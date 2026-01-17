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

  @Get()
  async findAll(
    @Query() query: any,
    @Req() req: AuthenticatedRequest
  ): Promise<TripResponseDto[]> {
    return this.tripsService.findAllWithFilters(query, req.user.id);
  }

  @Get('dashboard')
  async getDashboard(
    @Req() req: AuthenticatedRequest
  ): Promise<{
    upcoming: TripResponseDto[];
    past: {
      pending: TripResponseDto[];
      completed: TripResponseDto[];
    }
  }> {
    return this.tripsService.getDashboardTrips(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<TripDetailResponseDto> {
    return this.tripsService.findOne(id, req.user.id);
  }

  @Post()
  async create(
    @Body() createTripDto: CreateTripDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TripResponseDto> {
    return this.tripsService.create(req.user.id, createTripDto);
  }

  @Public()
  @Get('public')
  async findPublicTrips(@Query() query: any): Promise<TripResponseDto[]> {
    return this.tripsService.findPublicTrips(query);
  }
}
