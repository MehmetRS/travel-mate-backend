import { IsInt, Min } from 'class-validator';

export class BookTripDto {
  @IsInt({ message: 'Number of seats must be an integer' })
  @Min(1, { message: 'Must book at least 1 seat' })
  seats: number;
}
