import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTripRequestDto,
  TripRequestResponseDto,
  RequestType,
  RequestStatus,
} from '../dtos/request.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRequest(
    tripId: string,
    requesterId: string,
    dto: CreateTripRequestDto,
  ): Promise<TripRequestResponseDto> {
    this.logger.log(
      `Creating ${dto.type} request for trip ${tripId} by user ${requesterId}`,
    );

    // Verify trip exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, userId: true, availableSeats: true, isFull: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Cannot request your own trip
    if (trip.userId === requesterId) {
      throw new ForbiddenException('Cannot request your own trip');
    }

    // Validate BOOKING request
    if (dto.type === RequestType.BOOKING) {
      if (!dto.seatsRequested || dto.seatsRequested < 1) {
        throw new BadRequestException(
          'Seats requested is required and must be at least 1 for BOOKING requests',
        );
      }

      if (trip.isFull) {
        throw new ConflictException('Trip is already full');
      }

      if (dto.seatsRequested > trip.availableSeats) {
        throw new ConflictException(
          `Only ${trip.availableSeats} seats available`,
        );
      }
    }

    // Check for existing active request (PENDING or ACCEPTED)
    const existingRequest = await this.prisma.tripRequest.findFirst({
      where: {
        tripId,
        requesterId,
        type: dto.type,
        status: {
          in: [RequestStatus.PENDING, RequestStatus.ACCEPTED],
        },
      },
    });

    if (existingRequest) {
      throw new ConflictException(
        `You already have an active ${dto.type} request for this trip`,
      );
    }

    // Create request
    const request = await this.prisma.tripRequest.create({
      data: {
        tripId,
        requesterId,
        type: dto.type,
        seatsRequested: dto.type === RequestType.BOOKING ? dto.seatsRequested : null,
        status: RequestStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            rating: true,
            isVerified: true,
          },
        },
      },
    });

    this.logger.log(`Request ${request.id} created successfully`);

    return plainToInstance(TripRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async getRequestsForTrip(
    tripId: string,
    userId: string,
  ): Promise<TripRequestResponseDto[]> {
    // Verify trip exists and user is the owner
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException('Only trip owner can view requests');
    }

    const requests = await this.prisma.tripRequest.findMany({
      where: { tripId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            rating: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) =>
      plainToInstance(TripRequestResponseDto, req, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async updateRequest(
    requestId: string,
    userId: string,
    action: 'ACCEPT' | 'REJECT' | 'CANCEL',
  ): Promise<TripRequestResponseDto & { chatId?: string }> {
    this.logger.log(`User ${userId} attempting to ${action} request ${requestId}`);

    // Get request with trip info
    const request = await this.prisma.tripRequest.findUnique({
      where: { id: requestId },
      include: {
        trip: {
          select: {
            id: true,
            userId: true,
            availableSeats: true,
            isFull: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            rating: true,
            isVerified: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Authorization checks
    if (action === 'CANCEL') {
      // Only requester can cancel
      if (request.requesterId !== userId) {
        throw new ForbiddenException('Only requester can cancel their request');
      }
    } else {
      // Only trip owner can accept/reject
      if (request.trip.userId !== userId) {
        throw new ForbiddenException('Only trip owner can accept/reject requests');
      }
    }

    // Validate state transition
    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException(
        `Cannot ${action} request with status ${request.status}`,
      );
    }

    // Map action to status
    const newStatus =
      action === 'ACCEPT'
        ? RequestStatus.ACCEPTED
        : action === 'REJECT'
        ? RequestStatus.REJECTED
        : RequestStatus.CANCELLED;

    let chatId: string | undefined;

    // Handle ACCEPT logic
    if (action === 'ACCEPT') {
      await this.prisma.$transaction(async (tx) => {
        // If BOOKING, decrement seats atomically
        if (request.type === RequestType.BOOKING) {
          if (!request.seatsRequested) {
            throw new BadRequestException('Invalid booking request: missing seats');
          }

          // Double-check availability
          const currentTrip = await tx.trip.findUnique({
            where: { id: request.tripId },
            select: { availableSeats: true, isFull: true },
          });

          if (!currentTrip) {
            throw new NotFoundException('Trip not found');
          }

          if (currentTrip.isFull) {
            throw new ConflictException('Trip is now full');
          }

          if (request.seatsRequested > currentTrip.availableSeats) {
            throw new ConflictException(
              `Only ${currentTrip.availableSeats} seats available now`,
            );
          }

          const newAvailableSeats = currentTrip.availableSeats - request.seatsRequested;

          await tx.trip.update({
            where: { id: request.tripId },
            data: {
              availableSeats: newAvailableSeats,
              isFull: newAvailableSeats === 0,
            },
          });

          this.logger.log(
            `Decremented ${request.seatsRequested} seats for trip ${request.tripId}`,
          );
        }

        // Create or get chat for accepted requests
        let chat = await tx.chat.findUnique({
          where: { tripId: request.tripId },
        });

        if (!chat) {
          chat = await tx.chat.create({
            data: { tripId: request.tripId },
          });
          this.logger.log(`Created chat ${chat.id} for trip ${request.tripId}`);
        }

        chatId = chat.id;

        // Add requester as chat member (idempotent)
        await tx.chatMember.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: request.requesterId,
            },
          },
          create: {
            chatId: chat.id,
            userId: request.requesterId,
          },
          update: {}, // Already exists, no-op
        });

        // Add trip owner as chat member (idempotent)
        await tx.chatMember.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: request.trip.userId,
            },
          },
          create: {
            chatId: chat.id,
            userId: request.trip.userId,
          },
          update: {},
        });

        this.logger.log(
          `Added members to chat ${chat.id}: [${request.requesterId}, ${request.trip.userId}]`,
        );

        // Update request status
        await tx.tripRequest.update({
          where: { id: requestId },
          data: { status: newStatus },
        });
      });
    } else {
      // For REJECT and CANCEL, just update status (no transaction needed)
      await this.prisma.tripRequest.update({
        where: { id: requestId },
        data: { status: newStatus },
      });
    }

    this.logger.log(`Request ${requestId} updated to ${newStatus}`);

    // Fetch updated request
    const updatedRequest = await this.prisma.tripRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            rating: true,
            isVerified: true,
          },
        },
      },
    });

    const response = plainToInstance(TripRequestResponseDto, updatedRequest, {
      excludeExtraneousValues: true,
    });

    return { ...response, chatId };
  }
}
