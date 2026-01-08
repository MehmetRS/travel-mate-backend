import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { validateEnv } from './config/env.validator';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate environment variables before starting the app
  validateEnv();

  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Request ID middleware
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:19006',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    next();
  });

  // Listen on the port provided by Railway
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server running on port ${port}`);

  // Handle graceful shutdown
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown`);
      await app.close();
      logger.log('Application shutdown complete');
      process.exit(0);
    });
  });
}

bootstrap();