import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  VAN = 'VAN',
}

export class CreateVehicleDto {
  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1)
  seatCount: number;

  @IsString()
  @IsOptional()
  licensePlate?: string;
}
