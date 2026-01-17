import { Module } from '@nestjs/common';
import { TripReservationsService } from './trip-reservations.service';
import { TripReservationsController } from './trip-reservations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TripReservationsController],
  providers: [TripReservationsService],
})
export class TripReservationsModule {}
