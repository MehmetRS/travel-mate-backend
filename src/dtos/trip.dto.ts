import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}