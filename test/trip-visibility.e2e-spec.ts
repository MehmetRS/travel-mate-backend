import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Trip Visibility (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.tripReservation.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Trip Visibility Rules', () => {
    let driverUser: any;
    let passengerUser: any;
    let unauthorizedUser: any;
    let trip: any;

    beforeEach(async () => {
      // Create test users
      driverUser = await prisma.user.create({
        data: {
          email: 'driver@example.com',
          name: 'Driver',
          password: 'password',
        },
      });

      passengerUser = await prisma.user.create({
        data: {
          email: 'passenger@example.com',
          name: 'Passenger',
          password: 'password',
        },
      });

      unauthorizedUser = await prisma.user.create({
        data: {
          email: 'unauthorized@example.com',
          name: 'Unauthorized',
          password: 'password',
        },
      });

      // Create a trip
      trip = await prisma.trip.create({
        data: {
          from: 'Istanbul',
          to: 'Ankara',
          date: new Date(Date.now() + 86400000), // Tomorrow
          price: 100,
          totalSeats: 4,
          availableSeats: 4,
          isFull: false,
          userId: driverUser.id,
          vehicleId: 'test-vehicle-id',
        },
      });
    });

    it('should allow driver to see their own trip', async () => {
      // Authenticate as driver
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'driver@example.com',
          password: 'password',
        });

      const token = loginResponse.body.access_token;

      // Try to get the trip
      const response = await request(app.getHttpServer())
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(trip.id);
    });

    it('should allow passenger with accepted reservation to see trip', async () => {
      // Create accepted reservation
      await prisma.tripReservation.create({
        data: {
          tripId: trip.id,
          passengerId: passengerUser.id,
          passengerAccepted: true,
          driverAccepted: true,
        },
      });

      // Authenticate as passenger
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'passenger@example.com',
          password: 'password',
        });

      const token = loginResponse.body.access_token;

      // Try to get the trip
      const response = await request(app.getHttpServer())
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(trip.id);
    });

    it('should not allow passenger with pending reservation to see trip', async () => {
      // Create pending reservation
      await prisma.tripReservation.create({
        data: {
          tripId: trip.id,
          passengerId: passengerUser.id,
          passengerAccepted: true,
          driverAccepted: false, // Not accepted by driver
        },
      });

      // Authenticate as passenger
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'passenger@example.com',
          password: 'password',
        });

      const token = loginResponse.body.access_token;

      // Try to get the trip - should fail
      await request(app.getHttpServer())
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should not allow unauthorized user to see trip', async () => {
      // Authenticate as unauthorized user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'unauthorized@example.com',
          password: 'password',
        });

      const token = loginResponse.body.access_token;

      // Try to get the trip - should fail
      await request(app.getHttpServer())
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 404 for non-existent trip', async () => {
      // Authenticate as driver
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'driver@example.com',
          password: 'password',
        });

      const token = loginResponse.body.access_token;

      // Try to get non-existent trip
      await request(app.getHttpServer())
        .get(`/trips/non-existent-id`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
