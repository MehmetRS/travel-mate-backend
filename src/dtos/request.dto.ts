import { IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { Expose, Type } from 'class-transformer';

// Enums matching Prisma schema
export enum RequestType {
  BOOKING = 'BOOKING',
  CHAT = 'CHAT',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// Request DTOs
export class CreateTripRequestDto {
  @IsEnum(RequestType, { message: 'Type must be either BOOKING or CHAT' })
  type: RequestType;

  @ValidateIf((o) => o.type === RequestType.BOOKING)
  @IsInt({ message: 'Seats requested must be an integer' })
  @Min(1, { message: 'Must request at least 1 seat' })
  seatsRequested?: number;
}

export class UpdateTripRequestDto {
  @IsEnum(['ACCEPT', 'REJECT', 'CANCEL'], {
    message: 'Action must be ACCEPT, REJECT, or CANCEL',
  })
  action: 'ACCEPT' | 'REJECT' | 'CANCEL';
}

// Response DTOs
export class RequesterDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  rating: number;

  @Expose()
  isVerified: boolean;
}

export class TripRequestResponseDto {
  @Expose()
  id: string;

  @Expose()
  tripId: string;

  @Expose()
  requesterId: string;

  @Expose()
  @Type(() => RequesterDto)
  requester?: RequesterDto;

  @Expose()
  type: RequestType;

  @Expose()
  status: RequestStatus;

  @Expose()
  seatsRequested: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  chatId?: string | null;
}
