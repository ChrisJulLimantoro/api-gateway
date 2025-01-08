import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import { MicroserviceConnectionExceptionFilter } from './http-exception/microservice-connection-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:5173',  // Allow your frontend's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',  // Allowed HTTP methods
    allowedHeaders: 'Content-Type, Authorization',  // Allowed headers
  });

  app.useGlobalFilters(new MicroserviceConnectionExceptionFilter());
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
