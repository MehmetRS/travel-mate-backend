import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripResponseDto, TripDetailResponseDto, CreateTripDto, VehicleDto } from '../dtos/trip.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma, Trip, User, Vehicle } from '@prisma/client';

type TripWithRelations = Trip & {
  user: User & {
    vehicle: Vehicle | null;
  };
};

// Response types for consistent mapping
interface TripResponse {
  id: string;
  origin: string;
  destination: string;
  departureDateTime: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  isFull: boolean;
  description?: string;
  driver: {
    id: string;
    name: string;
    rating: number;
    isVerified: boolean;
    vehicle: VehicleDto | null;
  };
}

interface TripDetailResponse extends TripResponse {
  createdAt: Date;
}

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TripResponseDto[]> {
    const trips = await this.prisma.trip.findMany({
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    }) as unknown as TripWithRelations[];

    const responses: TripResponse[] = trips.map(trip => ({
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: trip.date,
      price: trip.price,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      isFull: trip.isFull,
      description: trip.description ?? undefined,
      driver: {
        id: trip.user.id,
        name: trip.user.name || 'Unknown',
        rating: trip.user.rating,
        isVerified: trip.user.isVerified,
        vehicle: trip.user.vehicle ? plainToInstance(VehicleDto, trip.user.vehicle) : null
      }
    }));

    // Transform to DTO
    return responses.map(response =>
      plainToInstance(TripResponseDto, response, { excludeExtraneousValues: true })
    );
  }

  async create(userId: string, dto: CreateTripDto): Promise<TripResponseDto> {
    const trip = await this.prisma.trip.create({
      data: {
        from: dto.origin,
        to: dto.destination,
        date: dto.departureDateTime,
        price: dto.price,
        totalSeats: dto.availableSeats,
        availableSeats: dto.availableSeats,
        isFull: false,
        description: dto.description || null,
        userId,
      },
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    }) as unknown as TripWithRelations;

    return {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: trip.date,
      price: trip.price,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      isFull: trip.isFull,
      description: trip.description ?? undefined,
      driver: {
        id: trip.user.id,
        name: trip.user.name || 'Unknown',
        rating: trip.user.rating,
        isVerified: trip.user.isVerified,
        vehicle: trip.user.vehicle ? plainToInstance(VehicleDto, trip.user.vehicle) : null
      }
    };
  }

  async findOne(id: string): Promise<TripDetailResponseDto> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    }) as unknown as TripWithRelations;

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const response: TripDetailResponse = {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: trip.date,
      price: trip.price,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      isFull: trip.isFull,
      description: trip.description ?? undefined,
      createdAt: trip.createdAt,
      driver: {
        id: trip.user.id,
        name: trip.user.name || 'Unknown',
        rating: trip.user.rating,
        isVerified: trip.user.isVerified,
        vehicle: trip.user.vehicle ? plainToInstance(VehicleDto, trip.user.vehicle) : null
      }
    };

    // Transform to DTO
    return plainToInstance(TripDetailResponseDto, response, { excludeExtraneousValues: true });
  }

  async bookTrip(tripId: string, userId: string, seats: number): Promise<TripResponseDto> {
    // Find trip and check if it exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    }) as unknown as TripWithRelations;

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Check if user is trying to book their own trip
    if (trip.userId === userId) {
      throw new ForbiddenException('Cannot book your own trip');
    }

    // Check if trip is full
    if (trip.isFull) {
      throw new ConflictException('Trip is already full');
    }

    // Check if enough seats are available
    if (seats > trip.availableSeats) {
      throw new ConflictException('Not enough seats available');
    }

    // Update trip with new seat count
    const newAvailableSeats = trip.availableSeats - seats;
    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        availableSeats: newAvailableSeats,
        isFull: newAvailableSeats === 0
      },
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    }) as unknown as TripWithRelations;

    const response: TripResponse = {
      id: updatedTrip.id,
      origin: updatedTrip.from,
      destination: updatedTrip.to,
      departureDateTime: updatedTrip.date,
      price: updatedTrip.price,
      totalSeats: updatedTrip.totalSeats,
      availableSeats: updatedTrip.availableSeats,
      isFull: updatedTrip.isFull,
      description: updatedTrip.description ?? undefined,
      driver: {
        id: updatedTrip.user.id,
        name: updatedTrip.user.name || 'Unknown',
        rating: updatedTrip.user.rating,
        isVerified: updatedTrip.user.isVerified,
        vehicle: updatedTrip.user.vehicle ? plainToInstance(VehicleDto, updatedTrip.user.vehicle) : null
      }
    };

    return plainToInstance(TripResponseDto, response, { excludeExtraneousValues: true });
  }
}
