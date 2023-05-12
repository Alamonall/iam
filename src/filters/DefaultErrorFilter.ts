import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import DefaultError from './DefaultError';

@Catch(DefaultError)
export default class DefaultErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(error: DefaultError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error({
      message: error.message,
      method: request.method,
      code: error.code,
      source: error.source,
      status: error.status,
      additional: error.additional,
    });
    response.status(error.status).json({ failure_code: error.code });
  }
}
