import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { TripReservationsService } from './trip-reservations.service';
import { RequestReservationDto } from './dto/request-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('trip-reservations')
@UseGuards(JwtAuthGuard)
export class TripReservationsController {
  constructor(
    private readonly tripReservationsService: TripReservationsService,
  ) {}

  @Post('request')
  async requestReservation(
    @Body() requestReservationDto: RequestReservationDto,
    @Req() req,
  ) {
    const passengerId = req.user.sub;
    return this.tripReservationsService.requestReservation(
      requestReservationDto.tripId,
      passengerId,
    );
  }

  @Post(':id/accept')
  async acceptReservation(@Param('id') reservationId: string, @Req() req) {
    const userId = req.user.sub;
    return this.tripReservationsService.acceptReservation(reservationId, userId);
  }

  @Post(':id/reject')
  async rejectReservation(@Param('id') reservationId: string, @Req() req) {
    const userId = req.user.sub;
    return this.tripReservationsService.rejectReservation(reservationId, userId);
  }

  @Post(':id/cancel')
  async cancelReservation(@Param('id') reservationId: string, @Req() req) {
    const userId = req.user.sub;
    return this.tripReservationsService.cancelReservation(reservationId, userId);
  }

  @Post(':id/complete/driver')
  async completeByDriver(@Param('id') reservationId: string, @Req() req) {
    const userId = req.user.sub;
    return this.tripReservationsService.completeByDriver(reservationId, userId);
  }

  @Post(':id/complete/passenger')
  async completeByPassenger(@Param('id') reservationId: string, @Req() req) {
    const userId = req.user.sub;
    return this.tripReservationsService.completeByPassenger(reservationId, userId);
  }
}
