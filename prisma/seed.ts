import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  // Create demo trips
  await prisma.trip.createMany({
    data: [
      {
        from: 'New York',
        to: 'Los Angeles',
        date: '2026-06-15',
        price: 299.99,
        userId: user.id,
      },
      {
        from: 'Chicago',
        to: 'Miami',
        date: '2026-06-20',
        price: 199.99,
        userId: user.id,
      },
      {
        from: 'San Francisco',
        to: 'Seattle',
        date: '2026-06-25',
        price: 149.99,
        userId: user.id,
      },
    ],
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
