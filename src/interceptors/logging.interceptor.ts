import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const requestId = request.requestId || 'unknown';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;
        const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

        this.logger[logLevel]({
          requestId,
          method,
          path: url,
          statusCode,
          durationMs: duration,
        });
      }),
    );
  }
}