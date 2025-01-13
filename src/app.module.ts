import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'process';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: {
          port: 3000,
        },
      },

      {
        name: 'MASTER',
        transport: Transport.TCP,
        options: {
          port: 3001,
        },
      },

      {
        name: 'FINANCE',
        transport: Transport.TCP,
        options: {
          port: 3002,
        },
      },

      {
        name: 'INVENTORY',
        transport: Transport.TCP,
        options: {
          port: 3003,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
