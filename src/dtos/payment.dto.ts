import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Expose } from 'class-transformer';

// Enum matching Prisma schema
export enum PaymentStatus {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Request DTOs
export class CreatePaymentDto {
  @IsNumber()
  @Min(0, { message: 'Amount must be positive' })
  amount: number;

  @IsString()
  @IsOptional()
  requestId?: string;
}

// Response DTOs
export class PaymentResponseDto {
  @Expose()
  id: string;

  @Expose()
  tripId: string;

  @Expose()
  payerId: string;

  @Expose()
  requestId: string | null;

  @Expose()
  amount: number;

  @Expose()
  status: PaymentStatus;

  @Expose()
  providerRef: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
