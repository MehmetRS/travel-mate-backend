import { Controller, Get, Post, Body, Param, Req, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Public } from '../auth/public.decorator';
import { TripResponseDto, TripDetailResponseDto, CreateTripDto } from '../dtos/trip.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get()
  async findAll(@Query() query: any): Promise<TripResponseDto[]> {
    return this.tripsService.findAllWithFilters(query);
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
    return this.tripsService.create(req.user.id, createTripDto);
  }
}
