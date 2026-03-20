# Database Setup Guide

This guide covers setting up PostgreSQL for the Rhubarbe preorder operations system in both development and production environments.

## Overview

The preorder operations system uses PostgreSQL with Drizzle ORM for:
- Availability patterns and scheduling rules
- Pickup locations and time slots
- Menu weeks and product availability windows
- Order management and fulfillment tracking
- Real-time slot capacity management

## Development Setup

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed

### Step-by-Step Setup

1. **Start PostgreSQL with Docker**:
   ```bash
   npm run docker:up
   ```
   
   This starts a PostgreSQL 16 container with:
   - Database: `rhubarbe`
   - User: `rhubarbe`
   - Password: `rhubarbe_dev`
   - Port: `5432`

2. **Verify connection**:
   ```bash
   npx tsx scripts/check-db.ts
   ```
   
   You should see:
   ```
   ✅ Connection successful!
   PostgreSQL version: 16.x
   ```

3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```
   
   This creates all necessary tables and indexes.

4. **Seed database** (optional):
   ```bash
   npm run db:seed
   ```
   
   This adds sample data for development.

5. **View database** (optional):
   ```bash
   npm run db:studio
   ```
   
   Opens Drizzle Studio at `https://local.drizzle.studio`

### Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop and remove container |
| `npm run docker:logs` | View PostgreSQL logs |
| `docker-compose ps` | Check container status |
| `docker-compose restart postgres` | Restart PostgreSQL |

### Connecting with psql

```bash
# Connect to database
docker exec -it rhubarbe-postgres psql -U rhubarbe -d rhubarbe

# List tables
\dt

# Describe table
\d table_name

# Exit
\q
```

## Production Setup (Vercel)

### Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a region (same as your deployment region)
7. Click **Create**

### Step 2: Connect to Project

1. Click **Connect to Project**
2. Select your project
3. Select environment(s): Production, Preview, Development
4. Click **Connect**

Vercel automatically adds these environment variables:
- `POSTGRES_URL` - Connection string with pooling
- `POSTGRES_URL_NON_POOLING` - Direct connection string
- `POSTGRES_PRISMA_URL` - Prisma-compatible URL (not used)
- `POSTGRES_URL_NO_SSL` - Non-SSL connection (not used)

### Step 3: Run Migrations

**Option A: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run migrations
vercel env pull .env.production.local
npm run db:migrate
```

**Option B: Via Deployment**
Add to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "npm run db:migrate && next build"
  }
}
```

### Step 4: Verify

1. Check Vercel Dashboard → Storage → Postgres
2. View tables in the **Data** tab
3. Check connection in your app

## Environment Variables

### Development (.env.local)
```env
DATABASE_URL=postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe
```

### Production (Vercel)
```env
# Automatically set by Vercel
POSTGRES_URL=postgres://user:pass@host/db?sslmode=require
```

### Testing (.env.test)
```env
TEST_DATABASE_URL=postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test
```

## Schema Management

### Making Schema Changes

1. **Edit schema** in `lib/db/schema.ts`:
   ```typescript
   export const myTable = pgTable('my_table', {
     id: uuid('id').primaryKey().defaultRandom(),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').notNull().defaultNow(),
   });
   ```

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```
   
   This creates a new migration file in `drizzle/migrations/`

3. **Review migration**:
   - Check the generated SQL
   - Verify it matches your intent
   - Test on development database first

4. **Run migration**:
   ```bash
   # Development
   npm run db:migrate
   
   # Production (via Vercel)
   vercel env pull .env.production.local
   npm run db:migrate
   ```

### Migration Best Practices

- ✅ Always review generated SQL before running
- ✅ Test migrations on development first
- ✅ Use transactions for complex migrations
- ✅ Add indexes for frequently queried columns
- ✅ Use `notNull()` with `default()` for new columns
- ❌ Don't modify existing migrations
- ❌ Don't delete migrations that have been run
- ❌ Don't make breaking changes without a migration strategy

## Troubleshooting

### Connection Refused

**Problem**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps

# Start PostgreSQL
npm run docker:up

# Check logs
npm run docker:logs
```

### Port Already in Use

**Problem**:
```
Error: port 5432 is already allocated
```

**Solution**:
```bash
# Find what's using port 5432
lsof -i :5432

# Stop existing PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux

# Or change port in docker-compose.yml
```

### Migration Failed

**Problem**:
```
Error: relation "table_name" already exists
```

**Solution**:
```bash
# Check migration status
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run docker:down
npm run docker:up
npm run db:migrate
```

### Permission Denied

**Problem**:
```
Error: permission denied for schema public
```

**Solution**:
```bash
# Connect to database
docker exec -it rhubarbe-postgres psql -U rhubarbe -d rhubarbe

# Grant permissions
GRANT ALL ON SCHEMA public TO rhubarbe;
GRANT ALL ON ALL TABLES IN SCHEMA public TO rhubarbe;
```

### SSL Connection Error (Production)

**Problem**:
```
Error: no pg_hba.conf entry for host
```

**Solution**:
- Ensure you're using `POSTGRES_URL` (with SSL)
- Check Vercel environment variables are set
- Verify database region matches deployment region

## Database Backup

### Development

```bash
# Backup
docker exec rhubarbe-postgres pg_dump -U rhubarbe rhubarbe > backup.sql

# Restore
docker exec -i rhubarbe-postgres psql -U rhubarbe rhubarbe < backup.sql
```

### Production (Vercel)

Vercel Postgres includes automatic backups:
- Point-in-time recovery (PITR)
- Daily automated backups
- 7-day retention (Hobby plan)
- 30-day retention (Pro plan)

To restore:
1. Go to Vercel Dashboard → Storage → Postgres
2. Click **Backups** tab
3. Select backup and click **Restore**

## Performance Optimization

### Indexes

Add indexes for frequently queried columns:
```typescript
export const products = pgTable('products', {
  // ... columns
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  availabilityModeIdx: index('products_availability_mode_idx').on(table.availabilityMode),
}));
```

### Connection Pooling

Production uses connection pooling automatically via `POSTGRES_URL`.

For custom pooling:
```typescript
const client = postgres(connectionString, {
  max: 10,              // Max connections
  idle_timeout: 20,     // Idle timeout (seconds)
  connect_timeout: 10,  // Connect timeout (seconds)
});
```

### Query Optimization

- Use indexes for WHERE, ORDER BY, JOIN columns
- Limit result sets with pagination
- Use `SELECT` specific columns instead of `SELECT *`
- Cache frequently accessed data

## Monitoring

### Development

```bash
# View logs
npm run docker:logs

# Check connections
docker exec rhubarbe-postgres psql -U rhubarbe -d rhubarbe -c "SELECT * FROM pg_stat_activity;"
```

### Production (Vercel)

1. Go to Vercel Dashboard → Storage → Postgres
2. View **Metrics** tab:
   - Connection count
   - Query performance
   - Storage usage
   - CPU usage

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues or questions:
1. Check this guide first
2. Review Drizzle ORM docs
3. Check Vercel Postgres docs
4. Contact team lead
