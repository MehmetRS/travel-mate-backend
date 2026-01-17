import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TripReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestReservation(tripId: string, passengerId: string) {
    // Fetch trip by tripId
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    // Validate trip existence
    if (!trip) {
      throw new BadRequestException('Trip does not exist');
    }

    // Validate trip is not full
    if (trip.isFull) {
      throw new BadRequestException('Trip is full');
    }

    // Validate passenger is not the driver
    if (passengerId === trip.userId) {
      throw new ForbiddenException('Driver cannot request their own trip');
    }

    // Check if reservation already exists
    const existingReservation = await this.prisma.tripReservation.findUnique({
      where: {
        tripId_passengerId: {
          tripId,
          passengerId,
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException('Reservation already exists for this trip');
    }

    // Create new reservation
    return this.prisma.tripReservation.create({
      data: {
        tripId,
        passengerId,
        passengerAccepted: true,
        driverAccepted: false,
      },
    });
  }

  async acceptReservation(reservationId: string, userId: string) {
    // Fetch reservation with trip relation
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });

    // Validate reservation existence
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate user is the driver of the trip
    if (reservation.trip.userId !== userId) {
      throw new ForbiddenException('Only the trip driver can accept reservations');
    }

    // Update reservation to mark as driver accepted
    return this.prisma.tripReservation.update({
      where: { id: reservationId },
      data: {
        driverAccepted: true,
      },
    });
  }

  async rejectReservation(reservationId: string, userId: string) {
    // Fetch reservation with trip relation
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });

    // Validate reservation existence
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate user is the driver of the trip
    if (reservation.trip.userId !== userId) {
      throw new ForbiddenException('Only the trip driver can reject reservations');
    }

    // Delete the reservation
    await this.prisma.tripReservation.delete({
      where: { id: reservationId },
    });

    return { message: 'Reservation rejected and deleted successfully' };
  }

  async cancelReservation(reservationId: string, userId: string) {
    // Fetch reservation with trip relation
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });

    // Validate reservation existence
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate reservation is mutually accepted
    if (!reservation.passengerAccepted || !reservation.driverAccepted) {
      throw new BadRequestException('Only accepted reservations can be cancelled');
    }

    // Validate user is either passenger or driver
    const isPassenger = reservation.passengerId === userId;
    const isDriver = reservation.trip.userId === userId;

    if (!isPassenger && !isDriver) {
      throw new ForbiddenException('Only passenger or driver can cancel this reservation');
    }

    // Validate trip date is in the future
    const now = new Date();
    if (reservation.trip.date <= now) {
      throw new BadRequestException('Cannot cancel reservation for past or current trips');
    }

    // Delete the reservation
    await this.prisma.tripReservation.delete({
      where: { id: reservationId },
    });

    // If trip was marked as full, update it
    if (reservation.trip.isFull) {
      await this.prisma.trip.update({
        where: { id: reservation.trip.id },
        data: { isFull: false },
      });
    }

    return { message: 'Reservation cancelled successfully' };
  }

  async completeByDriver(reservationId: string, userId: string) {
    // Fetch reservation with trip relation
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });

    // Validate reservation existence
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate trip existence
    if (!reservation.trip) {
      throw new NotFoundException('Trip not found');
    }

    // Validate trip date is in the past
    const now = new Date();
    if (reservation.trip.date > now) {
      throw new BadRequestException('Trip date has not passed yet');
    }

    // Validate reservation is mutually accepted
    if (!reservation.passengerAccepted || !reservation.driverAccepted) {
      throw new BadRequestException('Reservation must be mutually accepted to complete');
    }

    // Validate user is the driver of the trip
    if (reservation.trip.userId !== userId) {
      throw new ForbiddenException('Only the trip driver can complete this reservation');
    }

    // Update the trip with driver completion
    const updatedTrip = await this.prisma.trip.update({
      where: { id: reservation.trip.id },
      data: {
        completedByDriver: true,
        // Check if both flags are now true to set isCompleted
        isCompleted: reservation.trip.completedByPassenger === true
      },
    });

    return {
      reservation: {
        id: reservation.id,
        tripId: reservation.tripId,
        passengerId: reservation.passengerId,
        passengerAccepted: reservation.passengerAccepted,
        driverAccepted: reservation.driverAccepted,
      },
      trip: {
        id: updatedTrip.id,
        isCompleted: updatedTrip.isCompleted,
        completedByDriver: updatedTrip.completedByDriver,
        completedByPassenger: updatedTrip.completedByPassenger,
      }
    };
  }

  async completeByPassenger(reservationId: string, userId: string) {
    // Fetch reservation with trip relation
    const reservation = await this.prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });

    // Validate reservation existence
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Validate trip existence
    if (!reservation.trip) {
      throw new NotFoundException('Trip not found');
    }

    // Validate trip date is in the past
    const now = new Date();
    if (reservation.trip.date > now) {
      throw new BadRequestException('Trip date has not passed yet');
    }

    // Validate reservation is mutually accepted
    if (!reservation.passengerAccepted || !reservation.driverAccepted) {
      throw new BadRequestException('Reservation must be mutually accepted to complete');
    }

    // Validate user is the passenger of the reservation
    if (reservation.passengerId !== userId) {
      throw new ForbiddenException('Only the passenger can complete this reservation');
    }

    // Update the trip with passenger completion
    const updatedTrip = await this.prisma.trip.update({
      where: { id: reservation.trip.id },
      data: {
        completedByPassenger: true,
        // Check if both flags are now true to set isCompleted
        isCompleted: reservation.trip.completedByDriver === true
      },
    });

    return {
      reservation: {
        id: reservation.id,
        tripId: reservation.tripId,
        passengerId: reservation.passengerId,
        passengerAccepted: reservation.passengerAccepted,
        driverAccepted: reservation.driverAccepted,
      },
      trip: {
        id: updatedTrip.id,
        isCompleted: updatedTrip.isCompleted,
        completedByDriver: updatedTrip.completedByDriver,
        completedByPassenger: updatedTrip.completedByPassenger,
      }
    };
  }
}
