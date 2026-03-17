# Game Database Migrations

This directory contains database migrations for the pixel art game feature.

## Prerequisites

- PostgreSQL database (Vercel Postgres, Neon, Supabase, or local PostgreSQL)
- Database connection string set in environment variables

## Setup

### 1. Create a PostgreSQL Database

Choose one of the following options:

#### Option A: Vercel Postgres (Recommended for Vercel deployments)
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Click "Connect to Project"
4. Vercel automatically adds `POSTGRES_URL` to your environment

#### Option B: Neon (Serverless Postgres)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env.local` as `DATABASE_URL`

#### Option C: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string (use "Connection pooling" for better performance)
5. Add to `.env.local` as `DATABASE_URL`

#### Option D: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb janine_game`
3. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://localhost:5432/janine_game
   ```

### 2. Set Environment Variable

Add to `.env.local`:

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Or use POSTGRES_URL (Vercel Postgres uses this)
POSTGRES_URL=postgresql://user:password@host:port/database
```

### 3. Run Migration

```bash
npm run db:migrate
```

This will create the following tables:
- `campaigns` - Game campaign configurations
- `game_sessions` - Individual game sessions
- `scores` - Validated game scores for leaderboard
- `rewards` - Reward allocations for winners
- `validation_logs` - Anti-cheat validation logs
- `analytics_events` - Game analytics events

## Rollback

To remove all game tables:

```bash
npm run db:rollback
```

## Verification

After running the migration, you can verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('campaigns', 'game_sessions', 'scores', 'rewards', 'validation_logs', 'analytics_events')
ORDER BY table_name;
```

## Schema Overview

### campaigns
- Stores game campaign configurations
- Includes reward limits, timer duration, and level data
- Automatically decrements `reward_remaining` when rewards are allocated

### game_sessions
- Tracks individual game sessions
- Stores player info, IP address, and browser fingerprint for anti-cheat
- Links to campaigns

### scores
- Stores validated game scores
- Optimized indexes for leaderboard queries
- Includes flagging system for suspicious submissions

### rewards
- Stores reward allocations for first 100 eligible winners
- Generates unique 16-character claim codes
- Tracks redemption status and expiration

### validation_logs
- Logs all anti-cheat validation checks
- Used for monitoring and debugging

### analytics_events
- Stores game analytics events
- Tracks player behavior and campaign performance

## Troubleshooting

### Connection Errors

If you see connection errors:

1. Verify your `DATABASE_URL` or `POSTGRES_URL` is correct
2. Check that your database is running and accessible
3. Ensure your IP is whitelisted (for cloud databases)
4. Check firewall settings

### Permission Errors

If you see permission errors:

1. Ensure your database user has CREATE TABLE permissions
2. For cloud databases, check that the user has sufficient privileges

### Migration Already Run

If tables already exist, you can:

1. Run rollback first: `npm run db:rollback`
2. Then run migration again: `npm run db:migrate`

Or manually drop the tables and re-run the migration.

## Next Steps

After successful migration:

1. Verify tables exist in your database
2. Test database connection with: `npm run test` (once tests are implemented)
3. Continue with API endpoint implementation (Task 3)
