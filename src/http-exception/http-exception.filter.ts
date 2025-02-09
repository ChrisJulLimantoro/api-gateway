import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    console.log('Exception thrown', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.status(exception).json({
      statusCode: exception,
      message: 'Internal server error',
      error: exception.toString(),
    });
  }
}
