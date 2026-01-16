# Database Migration Policy

## Safe Migration Practices for Travel Mate Backend

This document defines the rules for database schema evolution to ensure zero-downtime deployments and backward compatibility.

## Golden Rule

**Never perform destructive changes on production databases.**

## ✅ SAFE Operations (Allowed)

### 1. Adding New Tables
```prisma
model NewFeature {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

### 2. Adding Nullable Columns
```prisma
model User {
  id       String  @id
  email    String
  phone    String? // ✅ New nullable field
}
```

### 3. Adding Columns with Defaults
```prisma
model Trip {
  id        String   @id
  status    String   @default("ACTIVE") // ✅ Has default value
  createdAt DateTime @default(now())    // ✅ Has default value
}
```

### 4. Adding New Enum Values (at the end)
```prisma
enum RequestType {
  BOOKING
  CHAT
  RIDE_SHARE // ✅ New value added at end
}
```

### 5. Adding Indices
```prisma
model Trip {
  origin String
  @@index([origin]) // ✅ Improves performance, no data change
}
```

### 6. Adding Foreign Key Relations (nullable)
```prisma
model Payment {
  id        String  @id
  requestId String? // ✅ Nullable
  request   Request? @relation(fields: [requestId], references: [id])
}
```

---

## ❌ UNSAFE Operations (Prohibited in Production)

### 1. Dropping Tables
```prisma
// ❌ NEVER DO THIS
// model OldTable { ... } // Removed - data loss!
```

### 2. Dropping Columns
```prisma
model User {
  id    String @id
  email String
  // ❌ removed: phone String - breaks old code!
}
```

### 3. Renaming Columns
```prisma
model Trip {
  id          String @id
  origin      String // ❌ Was "from" - breaks existing queries!
}
```

### 4. Changing Column Types
```prisma
model Trip {
  id    String @id // ❌ Was Int - breaks existing data!
  price String     // ❌ Was Float - type mismatch!
}
```

### 5. Adding NOT NULL to Existing Columns
```prisma
model User {
  id    String  @id
  phone String  // ❌ Was String? - existing rows have NULL!
}
```

### 6. Removing Enum Values
```prisma
enum Status {
  ACTIVE
  // ❌ removed: INACTIVE - existing data may use it!
}
```

---

## Migration Workflow

### Local Development

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create and apply migration
npm run prisma:migrate:dev

# 3. Review generated SQL in prisma/migrations/
# 4. Test thoroughly locally
npm run test:e2e
```

### Production (Railway)

```bash
# IMPORTANT: Only run migrate deploy, NEVER migrate dev!

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# Apply pending migrations
npm run prisma:migrate:deploy

# Generate Prisma Client
npm run prisma:generate
```

### Railway Deployment Checklist

- [ ] All migrations tested locally
- [ ] No destructive operations (drops, renames, type changes)
- [ ] New columns are nullable or have defaults
- [ ] Backup database before major schema changes
- [ ] Run `prisma migrate deploy` (not `migrate dev`)
- [ ] Verify application starts successfully
- [ ] Test critical endpoints after deployment

---

## Handling Breaking Changes (If Absolutely Necessary)

If you must make a breaking change, follow this multi-phase approach:

### Phase 1: Addition (Deploy 1)
1. Add new column/table alongside old one
2. Update code to write to BOTH old and new
3. Deploy

### Phase 2: Migration (Background)
1. Backfill new column/table with data from old
2. Verify data integrity

### Phase 3: Read Switchover (Deploy 2)
1. Update code to read from new column/table
2. Keep writing to both
3. Deploy

### Phase 4: Cleanup (Deploy 3 - after monitoring period)
1. Stop writing to old column/table
2. Deploy
3. Wait 1-2 weeks for rollback safety

### Phase 5: Removal (Deploy 4 - optional)
1. Drop old column/table
2. Deploy

**Example: Renaming "from" to "origin"**

```prisma
// Phase 1: Add new column
model Trip {
  from   String  // Old - keep for now
  origin String? // New - nullable
}

// Phase 2-3: Application code writes to both, reads from origin
// Phase 4: Stop writing to "from"
// Phase 5: Drop "from" column
model Trip {
  origin String // Only new column remains
}
```

---

## Prisma Commands Reference

```bash
# Local Development
npm run prisma:migrate:dev          # Create + apply migration
npm run prisma:migrate:dev --name <description>  # With name
npm run prisma:studio               # Visual database browser

# Production
npm run prisma:migrate:deploy       # Apply pending migrations
npm run prisma:generate             # Generate Prisma Client

# Utilities
npm run prisma:migrate:status       # Check migration status
npm run prisma:migrate:reset        # ⚠️  DANGER: Resets DB (dev only!)
npm run prisma:db:seed              # Run seed script
```

---

## Migration Review Checklist

Before merging a migration PR:

- [ ] Migration only contains additive changes
- [ ] New columns are nullable OR have default values
- [ ] No DROP, RENAME, or ALTER TYPE statements
- [ ] Indices added for new foreign keys
- [ ] Migration tested locally with existing data
- [ ] Application code handles both old and new schema (if transitioning)
- [ ] Migration SQL reviewed for performance impact (large tables?)
- [ ] Rollback plan documented

---

## Common Scenarios

### Adding a Required Field

**Wrong:**
```prisma
model User {
  email    String
  username String  // ❌ Required, but existing rows don't have it!
}
```

**Right:**
```prisma
model User {
  email    String
  username String? // ✅ Nullable first, backfill later, make required in phase 2
}
```

### Adding a Foreign Key

**Wrong:**
```prisma
model Payment {
  id       String  @id
  tripId   String  // ❌ Required, breaks if trip doesn't exist
  trip     Trip    @relation(fields: [tripId], references: [id])
}
```

**Right:**
```prisma
model Payment {
  id     String  @id
  tripId String? // ✅ Nullable, can be linked later
  trip   Trip?   @relation(fields: [tripId], references: [id])
}
```

### Replacing a Column

Use the multi-phase approach above. Never rename directly.

---

## Troubleshooting

### "Migration failed: column already exists"
You may have manually created the column. Either:
1. Drop it manually, or
2. Mark migration as applied: `prisma migrate resolve --applied <migration_name>`

### "Migration failed: column cannot be null"
You tried to add a required column. Make it nullable or add a default.

### Railway deployment stuck
Check Railway logs. Ensure `DATABASE_URL` is set and `prisma migrate deploy` is in build command.

---

## Environment Variables

Required for migrations:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

Railway sets this automatically. For local:

```env
DATABASE_URL="postgresql://localhost:5432/travel_mate_dev?schema=public"
```

---

## Summary

✅ **DO:**
- Add nullable columns
- Add new tables
- Add indices
- Use multi-phase approach for breaking changes

❌ **DON'T:**
- Drop tables or columns
- Rename anything
- Change column types
- Add NOT NULL to existing columns
- Remove enum values

**When in doubt, make it additive and nullable.**
