import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Public } from '../auth/public.decorator';
import { TripResponseDto, TripDetailResponseDto, CreateTripDto } from '../dtos/trip.dto';

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
    return this.tripsService.create(req.user.sub, createTripDto);
  }
}
