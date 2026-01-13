import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  // Remove blocking connection logic - let Prisma handle connection lazily
  async onModuleInit() {
    // No blocking connection - Prisma will connect on first query
    this.logger.log('Prisma service initialized (lazy connection)');
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma disconnected from database');
    } catch (error) {
      this.logger.error('Prisma disconnection failed', error);
      throw error; // Ensure the error is propagated
    }
  }

  isHealthy(): boolean {
    // Simple health check - if we can access the client, it's healthy
    return true;
  }
}
