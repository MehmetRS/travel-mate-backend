import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
              vehicles: true
            }
          }
        } as any
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
    try {
      // Validate vehicle existence and ownership
      const vehicle = await this.prisma.vehicle.findUnique({
        where: {
          id: dto.vehicleId
        }
      });

      if (!vehicle) {
        throw new BadRequestException("Vehicle not found");
      }

      if (vehicle.userId !== userId) {
        throw new ForbiddenException("Vehicle does not belong to user");
      }

      // Create the trip with validated vehicle
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
          vehicleId: dto.vehicleId,
        },
        include: {
          user: {
            include: {
              vehicles: true
            }
          }
        } as any
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
    } catch (error) {
      console.error('[TripsService] create trip failed', error);

      // Re-throw HttpExceptions (BadRequestException, ForbiddenException, etc.)
      if (error instanceof BadRequestException ||
          error instanceof ForbiddenException ||
          error instanceof NotFoundException ||
          error instanceof ConflictException) {
        throw error;
      }

      // Fallback to InternalServerErrorException for unexpected errors
      throw new InternalServerErrorException("Failed to create trip");
    }
  }

  async findOne(id: string): Promise<TripDetailResponseDto> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            vehicles: true
          }
        }
      } as any
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

  async findAllWithFilters(query: any): Promise<TripResponseDto[]> {
    const {
      origin,
      destination,
      date,
      minPrice,
      maxPrice,
      minSeats,
      availableOnly,
      upcoming,
      past,
      role,
    } = query;

    const where: Prisma.TripWhereInput = {};

    // ORIGIN
    if (origin) {
      where.from = {
        contains: origin,
        mode: 'insensitive',
      };
    }

    // DESTINATION
    if (destination) {
      where.to = {
        contains: destination,
        mode: 'insensitive',
      };
    }

    // PRICE
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = Number(minPrice);
      }
      if (maxPrice) {
        where.price.lte = Number(maxPrice);
      }
    }

    // SEATS
    if (minSeats) {
      where.availableSeats = {
        gte: Number(minSeats),
      };
    }

    // AVAILABLE ONLY
    if (availableOnly === 'true') {
      if (where.availableSeats && typeof where.availableSeats === 'object' && 'gte' in where.availableSeats) {
        // If there's already a condition (from minSeats), combine them
        const existingCondition = where.availableSeats as { gte: number };
        where.availableSeats = {
          gte: existingCondition.gte,
          gt: 0,
        };
      } else {
        where.availableSeats = {
          gt: 0,
        };
      }
    }

    // DATE (single day filter)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.date = {
        gte: start,
        lte: end,
      };
    }

    // UPCOMING trips (startTime >= now)
    if (upcoming === 'true') {
      const now = new Date();
      where.date = {
        gte: now
      };
    }

    // PAST trips (startTime < now)
    if (past === 'true') {
      const now = new Date();
      where.date = {
        lt: now
      };
    }

    try {
      const trips = await this.prisma.trip.findMany({
        where,
        orderBy: {
          date: 'asc',
        },
        include: {
          user: {
            include: {
              vehicles: true // This is now NULL-safe with LEFT JOIN behavior
            }
          }
        } as any
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
    } catch (error) {
      console.error('[TripsService] dashboard query failed', error);
      // Return empty array instead of crashing to ensure dashboard never breaks
      return [];
    }
  }
}
