import {
  All,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { CustomResponse } from './http-exception/dto/custom-response.dto';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { join } from 'path';
import * as fs from 'fs';
import { Console } from 'console';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH') private readonly authClient: ClientProxy,
    @Inject('MASTER') private readonly masterClient: ClientProxy,
    @Inject('FINANCE') private readonly financeClient: ClientProxy,
    @Inject('INVENTORY') private readonly inventoryClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
    private readonly service: AppService,
  ) {}

  private readonly routeServiceMap: Record<string, ClientProxy> = {
    auth: this.authClient,
    master: this.masterClient,
    finance: this.financeClient,
    inventory: this.inventoryClient,
    transaction: this.transactionClient,
  };

  @Post('login')
  async login(@Body() body: any, @Res() res, @Req() req) {
    console.log('Print Login');
    const response = await this.authClient
      .send({ cmd: 'login' }, body)
      .toPromise();
    if (response.success) {
      const payload = response.data;
      const token = await this.service.generateToken(payload);
      payload['token'] = token;
      response.data = payload;
    }
    return res.status(response.statusCode).json(response);
  }

  @Get('routes')
  async getAllRoutes() {
    return this.routeServiceMap['inventory'].send({ cmd: 'get_routes' }, {});
  }

  @Get('sync-feature')
  async syncFeature() {
    const data = await this.routeServiceMap['auth']
      .send({ cmd: 'sync_feature' }, {})
      .toPromise();
    return data;
  }

  @Get('uploads/*')
  async getStaticFile(@Req() req: Request, @Res() res: Response) {
    console.log('Get Static File');
    const filename = req.url.split('/').slice(2).join('/');
    console.log('filename', filename);
    // Your logic for serving images
    const filePath = join(__dirname, '..', 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }
    res.sendFile(filePath);
  }

  @Get('nota/*')
  async getNota(@Req() req: Request, @Res() res: Response) {
    try {
      const id = req.params[0]; // Extract ID from wildcard route
      if (!id) {
        return res.status(400).json({ message: 'Transaction ID is required' });
      }

      // Send request to transaction service
      const filePath: string = await this.transactionClient
        .send({ cmd: 'get:transaction-nota/*' }, { params: { id } })
        .toPromise();

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Nota file not found' });
      }

      // Send the file as a response
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=nota-${id}.pdf`,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(500).json({ message: 'Error sending file' });
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }

  // Dynamic Routing
  @UseGuards(JwtAuthGuard)
  @All(':service/*') // Catch-all dynamic route
  async handleDynamicRoutes(@Req() req: Request, @Res() res: Response) {
    const { method, body, params, url, query } = req;
    const urlSanitized = url.split('?')[0];
    const [_, service, action, id, subAction, subId, ...remainingPath] =
      urlSanitized.split('/');
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

    const bodynew = { ...query, ...body };
    const payload = {
      params,
      body: bodynew,
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
