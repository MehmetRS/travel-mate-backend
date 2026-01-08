import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateTripDto } from '../dtos/trip.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.tripsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.tripsService.findOne(id, userId);
  }

  @Post()
  async create(@Body() tripData: CreateTripDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.tripsService.create(tripData, userId);
  }
}
