import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests
      },
    ]),
    PrismaModule,
    AuthModule,
    TripsModule,
    HealthModule,
  ],
})
export class AppModule {}
