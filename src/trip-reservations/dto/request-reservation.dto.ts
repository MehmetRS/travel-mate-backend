import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RequestReservationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  tripId: string;
}
