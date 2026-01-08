import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log the error with full details for 5xx errors
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${exception.name}`,
        {
          error: exception.name,
          message: typeof exceptionResponse === 'object'
            ? (exceptionResponse as any).message
            : exceptionResponse,
          stack: exception.stack,
        },
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${exception.name}`,
        exceptionResponse,
      );
    }

    // Format the response
    // Sanitize error response
    const errorResponse = {
      statusCode: status,
      error: status >= 500 ? 'Internal Server Error' : exception.name,
      message: status >= 500 
        ? 'An unexpected error occurred' 
        : typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : exceptionResponse,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
    };

    response.status(status).json(errorResponse);
  }
}