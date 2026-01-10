import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Note: Using minimal fields due to Prisma client mismatch
    // seatsTotal, seatsAvailable, and isFull are computed in API layer
    // User relations are temporarily mocked until client is regenerated
    const trips = await this.prisma.trip.findMany({
      orderBy: [
        { date: 'asc' }
      ]
    });

    // Map to strongly typed response with temporary defaults
    const responses: TripResponse[] = trips.map(trip => ({
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: new Date(trip.date),
      price: trip.price,
      totalSeats: 4, // Temporary default until seatsTotal is available
      availableSeats: 2, // Temporary default until seatsAvailable is available
      isFull: false, // Temporary default until isFull is available
      description: null, // Temporary until description field is available in Prisma
      driver: {
        id: 'temp-driver-id', // Temporary until user relations are available
        name: 'Driver Name',
        rating: 4.5,
        isVerified: false,
        vehicle: null // Temporary until vehicle relations are available
      }
    }));

    // Transform to DTO
    return responses.map(response =>
      plainToInstance(TripResponseDto, response, { excludeExtraneousValues: true })
    );
  }

  async create(userId: string, dto: CreateTripDto): Promise<TripResponseDto> {
    // Note: Using only fields available in current Prisma client
    // seatsTotal, seatsAvailable, and isFull are computed in API layer
    // User relations are temporarily mocked until client is regenerated
    const trip = await this.prisma.trip.create({
      data: {
        from: dto.origin,
        to: dto.destination,
        date: new Date(dto.departureDateTime).toISOString(),
        price: dto.price,
        userId: userId,
      }
    });

    return {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: new Date(trip.date),
      price: trip.price,
      totalSeats: dto.availableSeats,
      availableSeats: dto.availableSeats,
      isFull: false,
      description: dto.description || undefined,
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
    // Note: Using minimal fields due to Prisma client mismatch
    // seatsTotal, seatsAvailable, and isFull are computed in API layer
    // User relations are temporarily mocked until client is regenerated
    const trip = await this.prisma.trip.findUnique({
      where: { id }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Map to strongly typed response with temporary defaults
    const response: TripDetailResponse = {
      id: trip.id,
      origin: trip.from,
      destination: trip.to,
      departureDateTime: new Date(trip.date),
      price: trip.price,
      totalSeats: 4, // Temporary default until seatsTotal is available
      availableSeats: 2, // Temporary default until seatsAvailable is available
      isFull: false, // Temporary default until isFull is available
      description: null, // Temporary until description field is available in Prisma
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
}
