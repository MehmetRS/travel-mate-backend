import { Expose, Type } from 'class-transformer';
import { IsString, IsNumber, IsDate, IsOptional, Min, IsUUID, MinDate, IsNotEmpty } from 'class-validator';

// Request DTOs
export class CreateTripDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(), {
    message: 'Departure date must be in the future'
  })
  departureDateTime: Date;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  availableSeats: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;
}

// Response DTOs

export class VehicleDto {
  @Expose()
  vehicleType: string;

  @Expose()
  brand: string;

  @Expose()
  model: string;

  @Expose()
  seats: number;
}

export class DriverDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  rating: number;

  @Expose()
  isVerified: boolean;

  @Expose()
  @Type(() => VehicleDto)
  vehicle: VehicleDto | null;
}

export class TripResponseDto {
  @Expose()
  id: string;

  @Expose()
  origin: string;

  @Expose()
  destination: string;

  @Expose()
  departureDateTime: Date;

  @Expose()
  price: number;

  @Expose()
  totalSeats: number;

  @Expose()
  availableSeats: number;

  @Expose()
  isFull: boolean;

  @Expose()
  description?: string;

  @Expose()
  @Type(() => DriverDto)
  driver: DriverDto;
}

export class TripDetailResponseDto extends TripResponseDto {
  @Expose()
  createdAt: Date;
}
