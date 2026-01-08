import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.trip.findMany({
      where: {
        userId,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found or does not belong to you');
    }

    return trip;
  }

  async create(tripData: any, userId: string) {
    return this.prisma.trip.create({
      data: {
        ...tripData,
        userId,
      },
    });
  }
}