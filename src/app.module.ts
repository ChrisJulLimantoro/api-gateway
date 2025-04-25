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
      // FOR LOAD BALANCING OF AUTH SERVICE
      {
        name: 'AUTH_WRITER',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.AUTH_SERVICE_WRITER_PORT ?? '3001'),
        },
      },

      {
        name: 'AUTH_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.AUTH_SERVICE_READER_PORT ?? '3001'),
        },
      },

      // FOR LOAD BALANCING OF MASTER SERVICE
      {
        name: 'MASTER_WRITER',
        transport: Transport.TCP,
        options: {
          host: process.env.MASTER_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.MASTER_SERVICE_WRITER_PORT ?? '3002'),
        },
      },

      {
        name: 'MASTER_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.MASTER_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.MASTER_SERVICE_READER_PORT ?? '3002'),
        },
      },

      // FOR LOAD BALANCING OF FINANCE SERVICE
      {
        name: 'FINANCE_WRITER',
        transport: Transport.TCP,
        options: {
          host: process.env.FINANCE_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.FINANCE_SERVICE_WRITER_PORT ?? '3003'),
        },
      },

      {
        name: 'FINANCE_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.FINANCE_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.FINANCE_SERVICE_READER_PORT ?? '3003'),
        },
      },

      // FOR LOAD BALANCING OF INVENTORY SERVICE
      {
        name: 'INVENTORY_WRITER',
        transport: Transport.TCP,
        options: {
          host: process.env.INVENTORY_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.INVENTORY_SERVICE_WRITER_PORT ?? '3004'),
        },
      },

      {
        name: 'INVENTORY_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.INVENTORY_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.INVENTORY_SERVICE_READER_PORT ?? '3004'),
        },
      },

      // FOR LOAD BALANCING OF TRANSACTION SERVICE
      {
        name: 'TRANSACTION_WRITER',
        transport: Transport.TCP,
        options: {
          host: process.env.TRANSACTION_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.TRANSACTION_SERVICE_WRITER_PORT ?? '3005'),
        },
      },

      {
        name: 'TRANSACTION_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.TRANSACTION_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.TRANSACTION_SERVICE_READER_PORT ?? '3005'),
        },
      },
      {
        name: 'MARKETPLACE_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'marketplace_service_queue_1',
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
          queue: 'inventory_service_queue_1',
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
          queue: 'transaction_service_queue_1',
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
          queue: 'finance_service_queue_1',
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
          queue: 'auth_service_queue_1',
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
