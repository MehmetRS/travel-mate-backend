import { Logger } from '@nestjs/common';

const logger = new Logger('ConfigValidator');

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'ALLOWED_ORIGINS',
] as const;

export function validateEnv(): void {
  const missingVars: string[] = [];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  // Log successful validation without exposing values
  logger.log('Environment variables validated successfully');
}
