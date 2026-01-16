import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  getByUserId(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
    });
  }
}
