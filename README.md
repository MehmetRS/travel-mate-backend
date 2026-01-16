# Travel Mate Backend

A robust, scalable NestJS backend for the Travel Mate carpooling platform with backward-compatible architecture and safe database migrations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Setup local database (see docs/LOCAL_DEVELOPMENT.md)
# Then run migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run start:dev
```

Server runs at `http://localhost:3000`

## 📚 Documentation

- **[API Contract](docs/API_CONTRACT.md)** - Complete API endpoint documentation with request/response schemas
- **[Migration Policy](docs/MIGRATION_POLICY.md)** - Database migration rules for zero-downtime deployments
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Complete local setup and development workflow
- **[Railway Deployment](docs/RAILWAY_DEPLOYMENT.md)** - Production deployment guide for Railway

## 🏗️ Architecture

### Core Principles

1. **Backward Compatibility First** - Never break existing clients
2. **Safe Migrations Only** - Additive database changes only (no drops, renames, type changes)
3. **Domain Separation** - Clear boundaries between auth, trips, requests, chats, payments
4. **Public Reads, Auth Writes** - Trip listings are public, actions require authentication
5. **Explicit State Machines** - Request status transitions are atomic and predictable

### Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT
- **Validation**: class-validator
- **Rate Limiting**: @nestjs/throttler

## 🎯 Key Features

### Trip Requests System (New)
- **Booking Requests**: Users request seats, driver accepts/rejects
- **Chat Requests**: Users request to join trip chat
- **Atomic Seat Management**: Seat decrements happen in transactions
- **Auto-Chat Creation**: Accepted requests automatically create/join chats
- **State Machine**: PENDING → ACCEPTED/REJECTED/CANCELLED

### Chat System
- **Membership-Based**: Explicit chat members table
- **Message Types**: TEXT, IMAGE, LOCATION with metadata support
- **Access Control**: Only members can read/send messages
- **Trip-Scoped**: One chat per trip

### Payment System (MVP)
- **Payment Tracking**: Link payments to trips and requests
- **Status Flow**: NOT_STARTED → STARTED → PAID/FAILED/REFUNDED
- **Extensible**: Ready for payment provider integration
- **Access Control**: Only payer and trip owner can view

## 📂 Project Structure

```
src/
├── auth/           # Authentication & JWT
├── trips/          # Trip management (public read, auth write)
├── requests/       # Trip request system (NEW)
├── chats/          # Chat & messaging with membership
├── payments/       # Payment tracking (MVP)
├── health/         # Health check endpoint
├── prisma/         # Database service
├── dtos/           # Data Transfer Objects
├── filters/        # Exception filters
├── interceptors/   # Logging interceptors
└── middleware/     # Request ID middleware

prisma/
├── schema.prisma   # Database schema
├── migrations/     # Migration history
└── seed.ts         # Seed data

docs/
├── API_CONTRACT.md           # API documentation
├── MIGRATION_POLICY.md       # DB migration rules
├── LOCAL_DEVELOPMENT.md      # Dev setup guide
└── RAILWAY_DEPLOYMENT.md     # Production deployment
```

## 🔐 Authentication

All authenticated endpoints require a Bearer token:

```bash
Authorization: Bearer <your-jwt-token>
```

Get token via:
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login existing account
- `GET /auth/me` - Verify current session

## 🛣️ API Endpoints

### Public Endpoints (No Auth)
- `GET /trips` - List all trips
- `GET /trips/:id` - Get trip details
- `POST /auth/register` - Register
- `POST /auth/login` - Login
- `GET /health` - Health check

### Protected Endpoints (Auth Required)
- `POST /trips` - Create trip
- `POST /trips/:tripId/requests` - Create booking/chat request
- `GET /trips/:tripId/requests` - List requests (trip owner only)
- `PATCH /requests/:requestId` - Accept/reject/cancel request
- `GET /trips/:tripId/chat` - Get chat (members only)
- `POST /trips/:tripId/chat/messages` - Send message (members only)
- `POST /trips/:tripId/payments` - Create payment
- `GET /payments/:paymentId` - Get payment details

See [API_CONTRACT.md](docs/API_CONTRACT.md) for complete documentation.

## 🗄️ Database Schema

Key models:
- **User** - Users with authentication
- **Vehicle** - User vehicles
- **Trip** - Trip listings with seats tracking
- **TripRequest** - Booking/chat requests with state machine
- **Chat** - Trip chats
- **ChatMember** - Explicit chat membership
- **Message** - Chat messages with types (TEXT/IMAGE/LOCATION)
- **Payment** - Payment tracking

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔨 Development Workflow

### Making Schema Changes

1. **Edit `prisma/schema.prisma`** (follow MIGRATION_POLICY.md)
2. **Create migration**: `npx prisma migrate dev --name your_change`
3. **Review SQL**: Check `prisma/migrations/`
4. **Test**: `npm run test:e2e`
5. **Commit**: Include migration files in commit

### Code Quality

```bash
npm run lint          # Lint code
npm run format        # Format code
npm run build         # Type check
```

## 🚢 Deployment

### Railway (Production)

```bash
# 1. Ensure migrations are tested locally
npm run test:e2e

# 2. Commit and push
git push origin main

# 3. Railway auto-deploys with:
#    - npm run prisma:migrate:deploy
#    - npm run build
#    - npm run start:prod
```

See [RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) for complete guide.

## 🔒 Security

- JWT authentication with secure secrets
- Rate limiting (ThrottlerModule)
- CORS configured for specific origins
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- Password hashing (bcrypt)
- Structured logging without sensitive data

## 📊 Monitoring

- Health endpoint: `GET /health`
- Structured logging with correlation IDs
- Request/response logging interceptor
- Error tracking with exception filters

## 🐛 Troubleshooting

### Common Issues

**"Can't reach database"**
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
docker ps  # if using Docker
```

**TypeScript errors after schema changes**
```bash
npx prisma generate
npm run build
```

**Migration conflicts**
```bash
npx prisma migrate status
# Follow MIGRATION_POLICY.md for safe practices
```

## 📝 Environment Variables

Required variables:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
PORT=3000
ALLOWED_ORIGINS="http://localhost:3000"
```

See `.env.example` for complete list.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Follow MIGRATION_POLICY.md for schema changes
3. Write tests for new features
4. Update API_CONTRACT.md if adding endpoints
5. Run tests: `npm run test && npm run test:e2e`
6. Commit: `git commit -m 'feat: add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open Pull Request

## 📋 Migration Policy Summary

✅ **ALLOWED:**
- Add new tables
- Add nullable columns
- Add columns with defaults
- Add new enum values (at end)
- Add indices

❌ **PROHIBITED:**
- Drop tables/columns
- Rename anything
- Change column types
- Add NOT NULL to existing columns
- Remove enum values

For breaking changes, use multi-phase deployment strategy (see MIGRATION_POLICY.md).

## 🎯 Response Contract Rules

1. Never remove/rename existing fields
2. New fields must be optional/nullable
3. Consistent error codes (400/401/403/404/409/500)
4. Flat JSON responses (no wrapper inconsistencies)
5. Maintain existing endpoint URLs

## 📦 Package Scripts

```json
{
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "prisma:generate": "prisma generate",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:studio": "prisma studio"
}
```

## 🔄 Version History

### Current: v1.0.0
- ✅ Trip requests system (booking + chat)
- ✅ Chat membership with message types
- ✅ Payment tracking (MVP)
- ✅ Backward-compatible architecture
- ✅ Safe migration policy
- ✅ Comprehensive documentation

### Upcoming: v1.1.0
- Real-time messaging (WebSockets)
- Payment provider integration
- Advanced search/filtering
- User ratings system
- Trip history

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues
- **Email**: support@travelmate.com

## 📄 License

[Your License Here]

## 👥 Team

Built with ❤️ by the Travel Mate team

---

**Ready to get started?** Follow the [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)!
