import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(Error)
export class MicroserviceConnectionExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception.message.includes('Connection closed')) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'The service you are trying to reach is currently unavailable. Please try again later.',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else if (exception.message.includes('Forbidden resource')) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'You are Forbidden to access this resource.',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // Handle other errors or rethrow the exception
      console.log('exception', exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An internal server error occurred.',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
