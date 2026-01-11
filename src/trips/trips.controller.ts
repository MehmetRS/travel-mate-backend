import { Controller, Get, Post, Body, Param, Req, ForbiddenException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Public } from '../auth/public.decorator';
import { TripResponseDto, TripDetailResponseDto, CreateTripDto } from '../dtos/trip.dto';
import { BookTripDto } from '../dtos/booking.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get()
  async findAll(): Promise<TripResponseDto[]> {
    return this.tripsService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TripDetailResponseDto> {
    return this.tripsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createTripDto: CreateTripDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TripResponseDto> {
    // TODO: Remove debug logs after verification
    console.log('DEBUG: createTripDto.departureDateTime raw:', createTripDto.departureDateTime);
    console.log('DEBUG: createTripDto.departureDateTime type:', typeof createTripDto.departureDateTime);
    console.log('DEBUG: createTripDto.departureDateTime instanceof Date:', createTripDto.departureDateTime instanceof Date);
    console.log('DEBUG: createTripDto.departureDateTime is future:', createTripDto.departureDateTime > new Date());

    return this.tripsService.create(req.user.sub, createTripDto);
  }

  @Post(':id/book')
  async bookTrip(
    @Param('id') id: string,
    @Body() bookTripDto: BookTripDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TripResponseDto> {
    return this.tripsService.bookTrip(id, req.user.sub, bookTripDto.seats);
  }
}
