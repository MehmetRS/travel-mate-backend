import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripResponseDto, TripDetailResponseDto, CreateTripDto } from '../dtos/trip.dto';
import { plainToInstance } from 'class-transformer';

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
  description: string | null;
  driver: {
    id: string;
    name: string;
    rating: number;
    isVerified: boolean;
    vehicle: {
      vehicleType: string;
      brand: string;
      model: string;
      seats: number;
    } | null;
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
      orderBy: [
        { date: 'asc' }
      ],
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    });

    // Map to strongly typed response
    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const responses: TripResponse[] = trips.map(trip => {
      const typedTrip = trip as any;
      return {
        id: trip.id,
        origin: trip.from,
        destination: trip.to,
        departureDateTime: new Date(trip.date),
        price: trip.price,
        totalSeats: typedTrip.totalSeats || 4,
        availableSeats: typedTrip.availableSeats || 2,
        isFull: typedTrip.isFull || false,
        description: typedTrip.description || null,
        driver: {
          id: 'temp-driver-id', // Temporary until user relations are available
          name: 'Driver Name',
          rating: 4.5,
          isVerified: false,
          vehicle: null // Temporary until vehicle relations are available
        }
      };
    });

    // Transform to DTO
    return responses.map(response =>
      plainToInstance(TripResponseDto, response, { excludeExtraneousValues: true })
    );
  }

  async create(userId: string, dto: CreateTripDto): Promise<TripResponseDto> {
    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const trip = await this.prisma.trip.create({
      data: {
        from: dto.origin,
        to: dto.destination,
        date: dto.departureDateTime.toISOString(),
        price: dto.price,
        totalSeats: dto.availableSeats,
        availableSeats: dto.availableSeats,
        isFull: false,
        description: dto.description,
        userId: userId,
      } as any,
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    } as any);

    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const typedTrip = trip as any;
    return {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: new Date(trip.date),
      price: trip.price,
      totalSeats: typedTrip.totalSeats || dto.availableSeats,
      availableSeats: typedTrip.availableSeats || dto.availableSeats,
      isFull: typedTrip.isFull || false,
      description: typedTrip.description || dto.description,
      driver: {
        id: userId,
        name: 'Driver Name',
        rating: 4.5,
        isVerified: false,
        vehicle: {
          vehicleType: '',
          brand: '',
          model: '',
          seats: 0,
        },
      },
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
    } as any);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const typedTrip = trip as any;
    const response: TripDetailResponse = {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: new Date(trip.date),
      price: trip.price,
      totalSeats: typedTrip.totalSeats || 4,
      availableSeats: typedTrip.availableSeats || 2,
      isFull: typedTrip.isFull || false,
      description: typedTrip.description || null,
      createdAt: trip.createdAt,
      driver: {
        id: 'temp-driver-id', // Temporary until user relations are available
        name: 'Driver Name',
        rating: 4.5,
        isVerified: false,
        vehicle: null // Temporary until vehicle relations are available
      }
    };

    // Transform to DTO
    return plainToInstance(TripDetailResponseDto, response, { excludeExtraneousValues: true });
  }

  async bookTrip(tripId: string, userId: string, seats: number): Promise<TripResponseDto> {
    // Find trip and check if it exists
    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Check if user is trying to book their own trip
    if (trip.userId === userId) {
      throw new ForbiddenException('Cannot book your own trip');
    }

    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const typedTrip = trip as any;

    // Check if trip is full
    if (typedTrip.isFull) {
      throw new ConflictException('Trip is already full');
    }

    // Check if enough seats are available
    if (seats > typedTrip.availableSeats) {
      throw new ConflictException('Not enough seats available');
    }

    // Update trip with new seat count
    const newAvailableSeats = typedTrip.availableSeats - seats;
    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        availableSeats: newAvailableSeats,
        isFull: newAvailableSeats === 0
      } as any,
      include: {
        user: {
          include: {
            vehicle: true
          }
        }
      }
    } as any);

    // TEMPORARY: Prisma client not regenerated.
    // This will be removed in Phase 19 after schema migration.
    const typedUpdatedTrip = updatedTrip as any;
    const typedUser = (updatedTrip as any).user as any;
    const response: TripResponse = {
      id: updatedTrip.id,
      origin: updatedTrip.from,
      destination: updatedTrip.to,
      departureDateTime: new Date(updatedTrip.date),
      price: updatedTrip.price,
      totalSeats: typedUpdatedTrip.totalSeats || 4,
      availableSeats: typedUpdatedTrip.availableSeats || 2,
      isFull: typedUpdatedTrip.isFull || false,
      description: typedUpdatedTrip.description || null,
      driver: {
        id: typedUser.id,
        name: typedUser.name || 'Unknown',
        rating: typedUser.rating,
        isVerified: typedUser.isVerified,
        vehicle: typedUser.vehicle
      }
    };

    return plainToInstance(TripResponseDto, response, { excludeExtraneousValues: true });
  }
}
