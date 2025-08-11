import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { logger } from '../logger';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    // 只记录简单的错误信息
    if (exception instanceof AxiosError) {
      logger.error(
        `Request Exception: ${exception.message}, Status: ${exception.response?.status || 'unknown'}`,
      );
    } else {
      logger.error(`Request Exception: ${(exception as Error).message}`);
    }
    const message =
      exception instanceof AxiosError
        ? exception.response?.data
          ? JSON.stringify(exception.response?.data)
          : exception.message
        : (exception as Error).message;
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: status,
      message,
    });
    return;
  }
}
