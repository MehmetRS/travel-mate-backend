# Local Development Setup

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or Docker)
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd travel-mate-backend
npm install
```

### 2. Configure Environment

Create a `.env.local` file (for local development):

```env
# Local PostgreSQL Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/travel_mate_dev?schema=public"

# Authentication
JWT_SECRET="your-local-jwt-secret-change-in-production"

# Server
PORT=3000

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### 3. Setup Local Database

#### Option A: Docker PostgreSQL (Recommended)

```bash
# Start PostgreSQL container
docker run --name travel-mate-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=travel_mate_dev \
  -p 5432:5432 \
  -d postgres:14-alpine

# Verify it's running
docker ps
```

#### Option B: Local PostgreSQL Installation

Install PostgreSQL and create a database:

```sql
CREATE DATABASE travel_mate_dev;
```

### 4. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate:dev

# (Optional) Seed database with test data
npm run prisma:db:seed
```

### 5. Start Development Server

```bash
# Start in dev mode with hot-reload
npm run start:dev

# Server should be running at http://localhost:3000
```

## Development Workflow

### Making Schema Changes

1. **Edit `prisma/schema.prisma`** with your changes
   - Follow the [MIGRATION_POLICY.md](./MIGRATION_POLICY.md) rules
   - Only additive changes (no drops, renames, type changes)

2. **Create migration**
   ```bash
   npm run prisma:migrate:dev --name describe_your_change
   ```

3. **Review generated SQL** in `prisma/migrations/`
   - Ensure it follows safe migration practices
   - Check for performance implications

4. **Test locally**
   ```bash
   npm run test
   npm run test:e2e
   ```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode (for development)
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run build
```

### Database Tools

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Check migration status
npm run prisma:migrate:status

# Reset database (⚠️ DANGER: deletes all data)
npm run prisma:migrate:reset

# Generate Prisma Client after schema changes
npm run prisma:generate
```

## Package Scripts Reference

```json
{
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "prisma:generate": "prisma generate",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:migrate:status": "prisma migrate status",
  "prisma:studio": "prisma studio",
  "prisma:db:seed": "ts-node prisma/seed.ts"
}
```

## Testing Endpoints Locally

### Authentication

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the accessToken from response

# Get current user
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Trips (Public Read)

```bash
# List all trips (no auth required)
curl http://localhost:3000/trips

# Get trip detail (no auth required)
curl http://localhost:3000/trips/{tripId}

# Create trip (auth required)
curl -X POST http://localhost:3000/trips \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Istanbul",
    "destination": "Ankara",
    "departureDateTime": "2026-02-01T10:00:00Z",
    "price": 150,
    "availableSeats": 3,
    "description": "Comfortable ride"
  }'
```

### Trip Requests (New Feature)

```bash
# Create BOOKING request
curl -X POST http://localhost:3000/trips/{tripId}/requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"BOOKING","seatsRequested":2}'

# Get requests for trip (trip owner only)
curl http://localhost:3000/trips/{tripId}/requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Accept/Reject request (trip owner)
curl -X PATCH http://localhost:3000/requests/{requestId} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"ACCEPT"}'
```

### Chats

```bash
# Get chat for trip (members only)
curl http://localhost:3000/trips/{tripId}/chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Send message (members only)
curl -X POST http://localhost:3000/trips/{tripId}/chat/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","messageType":"TEXT"}'
```

### Payments (MVP)

```bash
# Create payment
curl -X POST http://localhost:3000/trips/{tripId}/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":150,"requestId":"{requestId}"}'

# Get payment
curl http://localhost:3000/payments/{paymentId} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Debugging

### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "stopOnEntry": false
    }
  ]
}
```

### Enable Debug Logging

In your `.env.local`:

```env
LOG_LEVEL=debug
```

### Check Database Queries

Use Prisma's query logging:

```typescript
// In prisma.service.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Common Issues

### "Can't reach database server"

- Ensure PostgreSQL is running: `docker ps` or check local service
- Verify DATABASE_URL in `.env.local`
- Check port conflicts (5432)

### "Migration failed"

- Check MIGRATION_POLICY.md for safe practices
- Ensure you're using `migrate dev` locally, not `migrate deploy`
- Try resetting: `npm run prisma:migrate:reset` (⚠️ deletes data)

### Port 3000 already in use

```bash
# Find and kill process using port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### TypeScript errors after schema changes

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Rebuild
npm run build
```

## Best Practices

1. **Always run tests before committing**
   ```bash
   npm run test && npm run test:e2e && npm run lint
   ```

2. **Use feature branches**
   ```bash
   git checkout -b feature/add-notifications
   ```

3. **Keep migrations small and focused**
   - One migration per feature/fix
   - Descriptive names

4. **Never commit sensitive data**
   - Keep `.env.local` in `.gitignore`
   - Use `.env.example` for templates

5. **Document new endpoints**
   - Update `docs/API_CONTRACT.md`
   - Add examples

## Next Steps

- Read [API_CONTRACT.md](./API_CONTRACT.md) for endpoint documentation
- Read [MIGRATION_POLICY.md](./MIGRATION_POLICY.md) for schema changes
- Read [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for production deployment
