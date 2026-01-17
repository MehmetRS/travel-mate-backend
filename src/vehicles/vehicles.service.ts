import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  getByUserId(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
    });
  }

  create(userId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        ...dto,
        userId
      }
    });
  }
}
