import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from '../src/trips/trips.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { TripResponseDto } from '../src/dtos/trip.dto';

describe('Dashboard Trip Categorization', () => {
  let tripsService: TripsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: PrismaService,
          useValue: {
            trip: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    tripsService = module.get<TripsService>(TripsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getDashboardTrips categorization logic', () => {
    it('should categorize trips correctly based on completion status and departure time', async () => {
      // Mock current time
      const now = new Date('2026-01-18T00:00:00Z');

      // Mock trips data
      const mockTrips = [
        // Upcoming trip (departureDateTime > now, isCompleted === false)
        {
          id: '1',
          from: 'Istanbul',
          to: 'Ankara',
          date: new Date('2026-01-19T10:00:00Z'), // Tomorrow
          price: 100,
          totalSeats: 4,
          availableSeats: 4,
          isFull: false,
          isCompleted: false,
          completedByDriver: false,
          completedByPassenger: false,
          userId: 'driver1',
          vehicleId: 'vehicle1',
          user: {
            id: 'driver1',
            name: 'Driver 1',
            rating: 4.5,
            isVerified: true,
            vehicle: {
              id: 'vehicle1',
              type: 'CAR',
              brand: 'Toyota',
              model: 'Corolla',
              seatCount: 5,
              licensePlate: 'ABC123',
            },
          },
        },
        // Past pending trip (departureDateTime <= now, isCompleted === false)
        {
          id: '2',
          from: 'Ankara',
          to: 'Istanbul',
          date: new Date('2026-01-17T10:00:00Z'), // Yesterday
          price: 120,
          totalSeats: 4,
          availableSeats: 2,
          isFull: false,
          isCompleted: false,
          completedByDriver: false,
          completedByPassenger: false,
          userId: 'driver2',
          vehicleId: 'vehicle2',
          user: {
            id: 'driver2',
            name: 'Driver 2',
            rating: 4.2,
            isVerified: false,
            vehicle: {
              id: 'vehicle2',
              type: 'VAN',
              brand: 'Ford',
              model: 'Transit',
              seatCount: 8,
              licensePlate: 'XYZ789',
            },
          },
        },
        // Past completed trip (isCompleted === true, date does NOT matter)
        {
          id: '3',
          from: 'Izmir',
          to: 'Bursa',
          date: new Date('2026-01-20T10:00:00Z'), // Future date but completed
          price: 150,
          totalSeats: 2,
          availableSeats: 0,
          isFull: true,
          isCompleted: true,
          completedByDriver: true,
          completedByPassenger: true,
          userId: 'driver3',
          vehicleId: 'vehicle3',
          user: {
            id: 'driver3',
            name: 'Driver 3',
            rating: 4.8,
            isVerified: true,
            vehicle: {
              id: 'vehicle3',
              type: 'CAR',
              brand: 'BMW',
              model: 'X5',
              seatCount: 5,
              licensePlate: 'DEF456',
            },
          },
        },
        // Another past completed trip (isCompleted === true, past date)
        {
          id: '4',
          from: 'Antalya',
          to: 'Mersin',
          date: new Date('2026-01-15T10:00:00Z'), // Past date and completed
          price: 180,
          totalSeats: 4,
          availableSeats: 0,
          isFull: true,
          isCompleted: true,
          completedByDriver: true,
          completedByPassenger: true,
          userId: 'driver4',
          vehicleId: 'vehicle4',
          user: {
            id: 'driver4',
            name: 'Driver 4',
            rating: 4.0,
            isVerified: false,
            vehicle: {
              id: 'vehicle4',
              type: 'CAR',
              brand: 'Honda',
              model: 'Civic',
              seatCount: 5,
              licensePlate: 'GHI789',
            },
          },
        },
      ];

      // Mock the Prisma findMany method
      jest.spyOn(prismaService.trip, 'findMany').mockResolvedValue(mockTrips as any);

      // Call the dashboard method
      const result = await tripsService.getDashboardTrips('test-user-id');

      // Verify the categorization
      expect(result).toHaveProperty('upcoming');
      expect(result).toHaveProperty('past');
      expect(result.past).toHaveProperty('pending');
      expect(result.past).toHaveProperty('completed');

      // Check upcoming trips (should have 1 trip)
      expect(result.upcoming.length).toBe(1);
      expect(result.upcoming[0].id).toBe('1');

      // Check past pending trips (should have 1 trip)
      expect(result.past.pending.length).toBe(1);
      expect(result.past.pending[0].id).toBe('2');

      // Check past completed trips (should have 2 trips)
      expect(result.past.completed.length).toBe(2);
      expect(result.past.completed[0].id).toBe('3');
      expect(result.past.completed[1].id).toBe('4');

      // Verify response shape - just check the basic structure and categorization
      expect(result).toHaveProperty('upcoming');
      expect(result).toHaveProperty('past');
      expect(result.past).toHaveProperty('pending');
      expect(result.past).toHaveProperty('completed');

      // Verify the categorization is correct
      expect(result.upcoming.length).toBe(1);
      expect(result.upcoming[0].id).toBe('1');

      expect(result.past.pending.length).toBe(1);
      expect(result.past.pending[0].id).toBe('2');

      expect(result.past.completed.length).toBe(2);
      expect(result.past.completed[0].id).toBe('3');
      expect(result.past.completed[1].id).toBe('4');

      // Verify basic properties exist on each trip
      result.upcoming.forEach(trip => {
        expect(trip).toHaveProperty('id');
        expect(trip).toHaveProperty('origin');
        expect(trip).toHaveProperty('destination');
        expect(trip).toHaveProperty('departureDateTime');
        expect(trip).toHaveProperty('price');
        expect(trip).toHaveProperty('driver');
      });

      result.past.pending.forEach(trip => {
        expect(trip).toHaveProperty('id');
        expect(trip).toHaveProperty('origin');
        expect(trip).toHaveProperty('destination');
        expect(trip).toHaveProperty('departureDateTime');
        expect(trip).toHaveProperty('price');
        expect(trip).toHaveProperty('driver');
      });

      result.past.completed.forEach(trip => {
        expect(trip).toHaveProperty('id');
        expect(trip).toHaveProperty('origin');
        expect(trip).toHaveProperty('destination');
        expect(trip).toHaveProperty('departureDateTime');
        expect(trip).toHaveProperty('price');
        expect(trip).toHaveProperty('driver');
      });
    });

    it('should handle empty result gracefully', async () => {
      // Mock empty trips data
      jest.spyOn(prismaService.trip, 'findMany').mockResolvedValue([]);

      // Call the dashboard method
      const result = await tripsService.getDashboardTrips('test-user-id');

      // Verify the response shape is maintained even with no trips
      expect(result).toEqual({
        upcoming: [],
        past: {
          pending: [],
          completed: [],
        },
      });
    });

    it('should handle error gracefully', async () => {
      // Mock error
      jest.spyOn(prismaService.trip, 'findMany').mockRejectedValue(new Error('Database error'));

      // Call the dashboard method
      const result = await tripsService.getDashboardTrips('test-user-id');

      // Verify the response shape is maintained even with error
      expect(result).toEqual({
        upcoming: [],
        past: {
          pending: [],
          completed: [],
        },
      });
    });
  });
});
