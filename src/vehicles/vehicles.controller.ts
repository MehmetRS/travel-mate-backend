import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  getMyVehicles(@Req() req) {
    return this.vehiclesService.getByUserId(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createVehicle(@Req() req, @Body() dto: CreateVehicleDto) {
    const userId = req.user.id;
    return this.vehiclesService.create(userId, dto);
  }
}
