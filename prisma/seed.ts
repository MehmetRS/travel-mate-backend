import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// Demo vehicle data
const vehicles = [
  {
    vehicleType: 'Sedan',
    brand: 'Toyota',
    model: 'Corolla',
    seats: 4,
  },
  {
    vehicleType: 'SUV',
    brand: 'Honda',
    model: 'CR-V',
    seats: 5,
  },
  {
    vehicleType: 'Hatchback',
    brand: 'Volkswagen',
    model: 'Golf',
    seats: 4,
  },
];

// Demo user data
const users = [
  {
    email: 'john@example.com',
    name: 'John Driver',
    isVerified: true,
    rating: 4.8,
  },
  {
    email: 'sarah@example.com',
    name: 'Sarah Smith',
    isVerified: true,
    rating: 4.9,
  },
  {
    email: 'mike@example.com',
    name: 'Mike Wilson',
    isVerified: false,
    rating: 4.2,
  },
];

async function main() {
  // Clear existing data
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users with vehicles
  const createdUsers = await Promise.all(
    users.map(async (userData, index) => {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          vehicle: {
            create: vehicles[index],
          },
        },
        include: {
          vehicle: true,
        },
      });
      return user;
    })
  );

  // Helper function to create a future date
  const getFutureDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  // Create trips for each user
  // Note: Using only fields available in current Prisma client
  // seatsTotal, seatsAvailable, and isFull are computed in the API layer
  const trips = [
    // Full trips
    {
      from: 'İstanbul',
      to: 'Ankara',
      date: getFutureDate(2).toISOString(), // Use date field, not dateTime
      price: 299.99,
      // seatsTotal, seatsAvailable, and isFull are computed in API layer
      description: 'Hızlı ve konforlu yolculuk.',
      userId: createdUsers[0].id,
    },
    {
      from: 'İzmir',
      to: 'Antalya',
      date: getFutureDate(3).toISOString(),
      price: 249.99,
      description: 'Sahil rotasında keyifli bir yolculuk.',
      userId: createdUsers[1].id,
    },
    // Available trips
    {
      from: 'Ankara',
      to: 'İstanbul',
      date: getFutureDate(4).toISOString(),
      price: 289.99,
      description: 'Sabah erkenden yola çıkış.',
      userId: createdUsers[0].id,
    },
    {
      from: 'Antalya',
      to: 'İzmir',
      date: getFutureDate(5).toISOString(),
      price: 239.99,
      description: 'Akşam yolculuğu, molalı.',
      userId: createdUsers[1].id,
    },
    {
      from: 'Bursa',
      to: 'Eskişehir',
      date: getFutureDate(6).toISOString(),
      price: 159.99,
      description: 'Öğlen yolculuğu.',
      userId: createdUsers[2].id,
    },
    {
      from: 'Eskişehir',
      to: 'Ankara',
      date: getFutureDate(7).toISOString(),
      price: 179.99,
      description: 'Sabah yolculuğu, öğrenciler tercih edilir.',
      userId: createdUsers[2].id,
    },
  ];

  // Create all trips
  await prisma.trip.createMany({
    data: trips,
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
