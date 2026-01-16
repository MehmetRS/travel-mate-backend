# Railway Deployment Guide

## Overview

This guide covers deploying Travel Mate backend to Railway with zero-downtime schema migrations.

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed (optional, for local testing)
- Git repository connected to Railway

## Initial Deployment

### 1. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your `travel-mate-backend` repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a DATABASE_URL variable

### 3. Configure Environment Variables

In Railway project settings → Variables, add:

```env
# Automatically created by Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Add these manually
JWT_SECRET=<generate-a-strong-random-secret>
PORT=3000
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-app.com

# Optional
NODE_ENV=production
```

**Generate JWT_SECRET:**
```bash
# Linux/Mac/WSL
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Configure Build Settings

Railway should auto-detect your project. Verify settings:

**Build Command:**
```bash
npm ci && npm run prisma:generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

**Root Directory:** `/` (project root)

### 5. Add Migration Deploy Step

Create or update `package.json` to include migration in production start:

```json
{
  "scripts": {
    "start:prod": "npm run prisma:migrate:deploy && node dist/main",
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

### 6. Initial Deploy

Railway will automatically deploy when you push to your connected branch (usually `main`).

Monitor the deployment logs in Railway dashboard.

## Deployment Workflow

### For Regular Code Changes (No Schema Changes)

1. **Commit and push to Git**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Railway auto-deploys**
   - Builds new Docker image
   - Runs `npm run build`
   - Starts with `npm run start:prod`
   - Zero downtime (if configured)

### For Schema Changes (Migrations)

⚠️ **IMPORTANT: Follow these steps carefully**

#### Step 1: Create Migration Locally

```bash
# 1. Make schema changes in prisma/schema.prisma
# 2. Create migration locally (NOT on Railway!)
npm run prisma:migrate:dev --name add_new_feature

# 3. Review generated SQL in prisma/migrations/
# 4. Test locally
npm run test:e2e
```

#### Step 2: Verify Migration Safety

Review `docs/MIGRATION_POLICY.md` checklist:

- [ ] No DROP TABLE or DROP COLUMN
- [ ] No ALTER COLUMN TYPE
- [ ] No column renames
- [ ] New columns are nullable OR have defaults
- [ ] No removing enum values
- [ ] Indices added for foreign keys
- [ ] Migration tested locally with existing data

#### Step 3: Deploy

```bash
# 1. Commit migration files
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "migration: add new feature tables"

# 2. Push to trigger Railway deployment
git push origin main
```

#### Step 4: Monitor Deployment

Railway will:
1. Pull new code
2. Build application
3. Run `prisma migrate deploy` (applies pending migrations)
4. Start new instance
5. Switch traffic (zero-downtime if multi-instance)

**Watch logs in Railway dashboard for:**
- Migration success messages
- Application startup
- No error logs

#### Step 5: Verify

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Test critical endpoints
curl https://your-app.railway.app/trips
```

## Rollback Strategy

### If Migration Fails

1. **Railway will NOT automatically rollback**
   - Application stays on previous version
   - Database changes are NOT reversed

2. **Manual Rollback Steps:**

```bash
# Option A: Revert commit and redeploy
git revert HEAD
git push origin main

# Option B: Fix forward (preferred)
# Create a new migration that fixes the issue
npm run prisma:migrate:dev --name fix_migration_issue
git add prisma/migrations/
git commit -m "fix: correct migration issue"
git push origin main
```

### If Application Fails After Deployment

1. **Check Railway logs** for errors
2. **Rollback via Railway UI:**
   - Go to Deployments
   - Find previous successful deployment
   - Click "Redeploy"

3. **Fix and redeploy:**
   ```bash
   # Fix the issue locally
   # Test thoroughly
   npm run test:e2e
   
   # Commit and push
   git add .
   git commit -m "fix: resolve deployment issue"
   git push origin main
   ```

## Multi-Phase Breaking Changes

If you MUST make a breaking change (e.g., rename a column):

### Phase 1: Addition (Week 1)

```prisma
model Trip {
  from   String  // Old - keep
  origin String? // New - nullable
}
```

Deploy and update app to write to both fields.

### Phase 2: Backfill (Week 1-2)

Run a data migration (write-only, safe):

```typescript
// Create a migration script
const trips = await prisma.trip.findMany();
for (const trip of trips) {
  if (!trip.origin) {
    await prisma.trip.update({
      where: { id: trip.id },
      data: { origin: trip.from },
    });
  }
}
```

### Phase 3: Read Switchover (Week 2)

Update app to read from `origin`, still write to both. Deploy.

### Phase 4: Stop Writing Old (Week 3)

Update app to only use `origin`. Deploy.

### Phase 5: Cleanup (Week 4+)

After monitoring period, drop old column:

```prisma
model Trip {
  origin String // Only new field
}
```

## Railway-Specific Tips

### Environment Variables

**Accessing Other Services:**
Railway provides automatic service linking. Reference other services:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Monitoring

1. **Logs:** Railway dashboard → Logs tab
2. **Metrics:** Railway dashboard → Metrics tab
3. **Set up alerts:** Railway → Project Settings → Notifications

### Database Backups

Railway PostgreSQL includes automatic daily backups.

**Manual backup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Backup database
railway run pg_dump $DATABASE_URL > backup.sql
```

**Restore backup:**
```bash
railway run psql $DATABASE_URL < backup.sql
```

### Scaling

**Vertical scaling** (more CPU/RAM):
- Railway dashboard → Settings → Change plan

**Horizontal scaling** (multiple instances):
- Not directly supported in hobby plan
- Pro plan: configure replicas in settings

### Custom Domains

1. Railway dashboard → Settings → Domains
2. Add custom domain
3. Configure DNS (Railway provides instructions)
4. Update CORS in environment variables:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

## CI/CD Best Practices

### Pre-Deployment Checks

Add GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Checks

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Migration Review Checklist

Before merging migration PRs:

- [ ] Migration follows MIGRATION_POLICY.md
- [ ] No destructive operations
- [ ] Tested locally with real data
- [ ] Reviewed SQL in migration file
- [ ] No performance concerns (large table scans)
- [ ] Rollback plan documented
- [ ] Team reviewed

## Troubleshooting

### Deployment Stuck/Failed

**Check build logs:**
- Railway dashboard → Deployments → Click deployment → View logs

**Common issues:**
- TypeScript errors: Run `npm run build` locally first
- Missing dependencies: Ensure `package-lock.json` is committed
- Migration errors: Check MIGRATION_POLICY.md compliance

### Database Connection Errors

```
Error: P1001: Can't reach database
```

**Solutions:**
1. Verify `DATABASE_URL` is set in Railway
2. Check PostgreSQL service is running
3. Restart both services (API and Database)

### Out of Memory

If app crashes with OOM:
1. Check for memory leaks in logs
2. Upgrade Railway plan for more RAM
3. Optimize queries (use `select` to fetch only needed fields)

### Slow Queries

1. **Enable query logging:**
   ```typescript
   // prisma.service.ts
   new PrismaClient({
     log: ['query'],
   });
   ```

2. **Check for missing indices** in Railway Postgres:
   ```sql
   -- Connect via railway run psql
   \d+ "Trip"  -- Check indices
   ```

3. **Add indices** if needed (migration):
   ```prisma
   @@index([field])
   ```

## Security Checklist

- [ ] JWT_SECRET is strong and secret (not in Git)
- [ ] DATABASE_URL is secret (Railway manages this)
- [ ] CORS is configured for specific origins only
- [ ] Rate limiting enabled (ThrottlerModule)
- [ ] Sensitive logs filtered (no passwords/tokens in logs)
- [ ] HTTPS enforced (Railway provides this automatically)
- [ ] Dependencies updated regularly (`npm audit`)

## Performance Optimization

### Connection Pooling

Prisma handles connection pooling. For high traffic:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Prisma will use connection pooling by default
```

### Caching

Consider adding Redis for caching:

1. Add Redis service in Railway
2. Install `@nestjs/cache-manager`
3. Cache expensive queries

### CDN

For static assets, use Railway's built-in CDN or external CDN like Cloudflare.

## Monitoring & Observability

### Health Checks

Endpoint already exists: `GET /health`

Configure Railway health check:
- Settings → Health Check → `/health`

### Logging

Railway captures stdout/stderr. Use structured logging:

```typescript
this.logger.log('User action', { userId, action, metadata });
```

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- DataDog

## Costs

**Railway Pricing (as of 2026):**
- Hobby: $5/month (includes $5 credit)
- Pro: $20/month (includes $20 credit)

**Resource usage:**
- PostgreSQL: ~$1-5/month (Hobby)
- Backend API: ~$3-10/month depending on traffic

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issue in this repo

## Summary: Deploy Checklist

✅ **Before Every Deployment:**
1. Tests pass locally: `npm run test:e2e`
2. Linting passes: `npm run lint`
3. Build succeeds: `npm run build`
4. Changes reviewed by team

✅ **For Migration Deployments:**
1. Follow MIGRATION_POLICY.md
2. Migration tested locally
3. SQL reviewed for safety
4. Rollback plan ready
5. Team notified of deployment

✅ **After Deployment:**
1. Check Railway logs for errors
2. Test critical endpoints
3. Monitor for 15-30 minutes
4. Update team on success
