import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, PaymentResponseDto, PaymentStatus } from '../dtos/payment.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayment(
    tripId: string,
    payerId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Creating payment for trip ${tripId} by user ${payerId}`);

    // Verify trip exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, userId: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Optionally verify request exists if requestId provided
    if (dto.requestId) {
      const request = await this.prisma.tripRequest.findUnique({
        where: { id: dto.requestId },
        select: { id: true, requesterId: true, tripId: true },
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.requesterId !== payerId) {
        throw new ForbiddenException('Request does not belong to you');
      }

      if (request.tripId !== tripId) {
        throw new ForbiddenException('Request does not belong to this trip');
      }
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        tripId,
        payerId,
        requestId: dto.requestId || null,
        amount: dto.amount,
        status: PaymentStatus.NOT_STARTED,
      },
    });

    this.logger.log(`Payment ${payment.id} created successfully`);

    return plainToInstance(PaymentResponseDto, payment, {
      excludeExtraneousValues: true,
    });
  }

  async getPayment(paymentId: string, userId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        trip: {
          select: { userId: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only payer or trip owner can view payment
    if (payment.payerId !== userId && payment.trip.userId !== userId) {
      throw new ForbiddenException('You cannot view this payment');
    }

    return plainToInstance(PaymentResponseDto, payment, {
      excludeExtraneousValues: true,
    });
  }
}
