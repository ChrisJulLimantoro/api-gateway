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
    @Inject('AUTH_WRITER') private readonly authWriterClient: ClientProxy,
    @Inject('AUTH_READER') private readonly authReaderClient: ClientProxy,
    @Inject('MASTER_WRITER') private readonly masterWriterClient: ClientProxy,
    @Inject('MASTER_READER') private readonly masterReaderClient: ClientProxy,
    @Inject('FINANCE_WRITER') private readonly financeWriterClient: ClientProxy,
    @Inject('FINANCE_READER') private readonly financeReaderClient: ClientProxy,
    @Inject('INVENTORY_WRITER')
    private readonly inventoryWriterClient: ClientProxy,
    @Inject('INVENTORY_READER')
    private readonly inventoryReaderClient: ClientProxy,
    @Inject('TRANSACTION_WRITER')
    private readonly transactionWriterClient: ClientProxy,
    @Inject('TRANSACTION_READER')
    private readonly transactionReaderClient: ClientProxy,

    @Inject('INVENTORY_RMQ') private readonly inventoryRmqClient: ClientProxy,
    @Inject('TRANSACTION_RMQ')
    private readonly transactionRmqClient: ClientProxy,
    @Inject('FINANCE_RMQ') private readonly financeRmqClient: ClientProxy,
    @Inject('AUTH_RMQ') private readonly authRmqClient: ClientProxy,
    @Inject('MARKETPLACE_RMQ')
    private readonly marketplaceRmqClient: ClientProxy,
    private readonly service: AppService,
  ) {}

  private readonly routeServiceMap: Record<string, ClientProxy> = {
    auth_writer: this.authWriterClient,
    auth_reader: this.authReaderClient,
    master_writer: this.masterWriterClient,
    master_reader: this.masterReaderClient,
    finance_writer: this.financeWriterClient,
    finance_reader: this.financeReaderClient,
    inventory_writer: this.inventoryWriterClient,
    inventory_reader: this.inventoryReaderClient,
    transaction_writer: this.transactionWriterClient,
    transaction_reader: this.transactionReaderClient,
  };

  private readonly rmqServiceMap: Record<string, ClientProxy> = {
    auth: this.authRmqClient, // vv
    finance: this.financeRmqClient,
    inventory: this.inventoryRmqClient, // vv
    transaction: this.transactionRmqClient, // vv
    marketplace: this.marketplaceRmqClient,
  };

  @Get('health')
  async healthCheck() {
    return CustomResponse.success('Service is running', null, 200);
  }

  @Post('login')
  async login(@Body() body: any, @Res() res, @Req() req) {
    console.log('Print Login');
    const response = await this.routeServiceMap['auth_reader']
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
    console.log('Sync Feature');
    const data = await this.routeServiceMap['auth_writer']
      .send({ cmd: 'sync_feature' }, {})
      .toPromise();
    return data;
  }

  // Sync company
  @Post('sync-company')
  async syncCompany(@Body() body: any, @Res() res: Response) {
    const payload = {
      params: {},
      body: {},
      method: 'POST',
    };
    const response = await this.routeServiceMap['master_reader']
      .send({ cmd: 'get:company' }, payload)
      .toPromise();
    if (response.success) {
      const companies = response.data;
      for (const key in this.rmqServiceMap) {
        if (Object.prototype.hasOwnProperty.call(this.rmqServiceMap, key)) {
          try {
            const client = this.rmqServiceMap[key];
            const response = await client
              .emit({ cmd: 'company_sync' }, companies)
              .toPromise();
            console.log('company created in', response);
          } catch (error) {
            console.log('error', error);
            console.log('service', key);
          }
        }
      }
    }
    console.log(response);
    return res.status(response.statusCode).json(response);
  }
  // Sync store
  @Post('sync-store')
  async syncStore(@Body() body: any, @Res() res: Response) {
    const payload = {
      params: {},
      body: {},
      method: 'POST',
    };
    const response = await this.routeServiceMap['master_reader']
      .send({ cmd: 'get:store' }, payload)
      .toPromise();
    if (response.success) {
      const stores = response.data;
      for (const key in this.rmqServiceMap) {
        if (Object.prototype.hasOwnProperty.call(this.rmqServiceMap, key)) {
          try {
            const client = this.rmqServiceMap[key];
            const response = await client
              .emit({ cmd: 'store_sync' }, stores)
              .toPromise();
            console.log('store created in', response);
          } catch (error) {
            console.log('error', error);
            console.log('service', key);
          }
        }
      }
    }
    console.log(response);
    return res.status(response.statusCode).json(response);
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
      const filePath: string = await this.transactionWriterClient
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
    const methodLower = method.toLowerCase();
    const targetService =
      this.routeServiceMap[
        service.concat(
          ['post', 'put', 'patch', 'delete'].find((m) => m === methodLower)
            ? '_writer'
            : '_reader',
        )
      ];
    if (!targetService) {
      return res
        .status(404)
        .json({ message: 'Service not found', statusCode: 404 });
    }

    // Construct the cmd and payload
    params.id = id;
    params.subId = subId;
    const cmd = `${methodLower}:${action.toLowerCase()}${id ? '/*' : ''}${subAction ? '/' + subAction.toLowerCase() : ''}${subId ? '/*' : ''}`;

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
