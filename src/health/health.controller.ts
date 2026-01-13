import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private isDbConnected = false;

  constructor(private readonly prisma: PrismaService) {
    // No blocking connection - let Prisma handle connection lazily
    this.logger.log('Health controller initialized');
  }

  @Public()
  @Get()
  async getHealth() {
    // Only check DB connection status, don't perform writes
    const dbStatus = this.isDbConnected ? 'connected' : 'disconnected';

    return {
      status: this.isDbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
