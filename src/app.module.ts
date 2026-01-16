import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ChatsModule } from './chats/chats.module';
import { RequestsModule } from './requests/requests.module';
import { PaymentsModule } from './payments/payments.module';
import { VehiclesModule } from './vehicles/vehicles.module';
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
    ChatsModule,
    RequestsModule,
    PaymentsModule,
    VehiclesModule,
    HealthModule,
  ],
})
export class AppModule {}
