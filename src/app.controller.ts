import {
  All,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import e, { Request, Response } from 'express';
import { CustomResponse } from './http-exception/dto/custom-response.dto';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH') private readonly authClient: ClientProxy,
    @Inject('MASTER') private readonly masterClient: ClientProxy,
    private readonly service: AppService,
  ) {}

  private readonly routeServiceMap: Record<string, ClientProxy> = {
    auth: this.authClient,
    master: this.masterClient,
  };

  @Post('login')
  async login(@Body() body: any, @Res() res) {
    const response = await this.authClient
      .send({ cmd: 'login' }, body)
      .toPromise();
    if (response.success) {
      const payload = {
        userId: response.data.id,
        email: response.data.email,
      };
      const token = await this.service.generateToken(payload);
      payload['token'] = token;
      response.data = payload;
    }
    return res.status(response.statusCode).json(response);
  }

  @Get('routes')
  async getAllRoutes() {
    return this.routeServiceMap['master'].send({ cmd: 'get_all_routes' }, {});
  }

  @Get('sync-feature')
  async syncFeature() {
    return this.routeServiceMap['auth'].send({ cmd: 'sync_feature' }, {});
  }

  // Dynamic Routing
  @UseGuards(JwtAuthGuard)
  @All(':service/*') // Catch-all dynamic route
  async handleDynamicRoutes(@Req() req: Request, @Res() res: Response) {
    const { method, body, params, url } = req;
    const [_, service, action, id, subAction, subId, ...remainingPath] =
      url.split('/');
    // Find the target service
    const targetService = this.routeServiceMap[service];
    if (!targetService) {
      return res
        .status(404)
        .json({ message: 'Service not found', statusCode: 404 });
    }

    // Construct the cmd and payload
    params.id = id;
    params.subId = subId;
    const cmd = `${method.toLowerCase()}:${action.toLowerCase()}${id ? '/*' : ''}${subAction ? '/' + subAction.toLowerCase() : ''}${subId ? '/*' : ''}`;
    const payload = {
      params,
      body,
      method,
    };
    try {
      // Send to the respective service
      //FIXME: Delete console.log
      console.log('cmd', cmd);
      console.log('payload', payload);
      const response = await targetService.send({ cmd }, payload).toPromise();
      return res.status(response.statusCode).json(response);
    } catch (error) {
      //FIXME: Delete console.log
      console.log('error', error);
      return res
        .status(error.statusCode || 500)
        .json(
          CustomResponse.error(error.message, null, error.statusCode || 500),
        );
    }
  }
}
