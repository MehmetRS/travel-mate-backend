import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.logger.log('Prisma connected to database');
        return;
      } catch (error) {
        this.connectionAttempts++;
        this.logger.error(
          `Prisma connection attempt ${this.connectionAttempts} failed`,
          error,
        );

        if (this.connectionAttempts === this.maxRetries) {
          this.logger.error(
            'Max connection retries reached. Shutting down application.',
          );
          process.exit(1);
        }

        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Prisma disconnected from database');
    } catch (error) {
      this.logger.error('Prisma disconnection failed', error);
      throw error; // Ensure the error is propagated
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
