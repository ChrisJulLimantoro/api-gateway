import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'process';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST ?? 'localhost',
          port: 3001,
        },
      },

      {
        name: 'MASTER',
        transport: Transport.TCP,
        options: {
          host: process.env.MASTER_SERVICE_HOST ?? 'localhost',
          port: 3002,
        },
      },

      {
        name: 'FINANCE',
        transport: Transport.TCP,
        options: {
          host: process.env.FINANCE_SERVICE_HOST ?? 'localhost',
          port: 3003,
        },
      },

      {
        name: 'INVENTORY',
        transport: Transport.TCP,
        options: {
          host: process.env.INVENTORY_SERVICE_HOST ?? 'localhost',
          port: 3004,
        },
      },

      {
        name: 'TRANSACTION',
        transport: Transport.TCP,
        options: {
          host: process.env.TRANSACTION_SERVICE_HOST ?? 'localhost',
          port: 3005,
        },
      },
      {
        name: 'MARKETPLACE_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'marketplace_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'INVENTORY_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'inventory_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'TRANSACTION_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'transaction_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'FINANCE_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'finance_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'AUTH_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'auth_service_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    UploadModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
