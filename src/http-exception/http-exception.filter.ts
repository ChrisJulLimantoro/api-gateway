import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.code === 'LIMIT_FILE_SIZE' ? 400 : 500;

    response.status(status).json({
      statusCode: status,
      message:
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'File size exceeds the 2MB limit.'
          : exception.message,
    });
  }
}
@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.status(exception).json({
      statusCode: exception,
      message: 'Internal server error',
      error: exception.toString(),
    });
  }
}
