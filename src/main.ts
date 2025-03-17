import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import { MicroserviceConnectionExceptionFilter } from './http-exception/microservice-connection-exception.filter';
import * as express from 'express';
import * as multer from 'multer';
import { diskStorage } from 'multer';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow your frontend's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    allowedHeaders: 'Content-Type, Authorization', // Allowed headers
  });

  // allow Multipart/form-data
  app.use(express.urlencoded({ extended: true }));
  // Enable parsing of JSON bodies
  app.use(express.json());

  app.useGlobalFilters(new MicroserviceConnectionExceptionFilter());
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
