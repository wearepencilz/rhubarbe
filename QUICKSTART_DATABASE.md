# Quick Start: Database Setup

This guide will get your database up and running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed

## Setup Steps

### 1. Start PostgreSQL

```bash
npm run docker:up
```

Wait for the container to start (about 10 seconds).

### 2. Verify Connection

```bash
npx tsx scripts/check-db.ts
```

You should see:
```
✅ Connection successful!
PostgreSQL version: 16.x
```

### 3. Run Migrations

```bash
npm run db:migrate
```

This creates all database tables.

### 4. Start Development Server

```bash
npm run dev
```

## That's It! 🎉

Your database is now ready for development.

## Optional: View Database

Open Drizzle Studio to browse your database:

```bash
npm run db:studio
```

## Troubleshooting

### PostgreSQL won't start?

```bash
# Check if port 5432 is already in use
lsof -i :5432

# Stop existing PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux
```

### Connection issues?

```bash
# Check container status
docker-compose ps

# View logs
npm run docker:logs

# Restart container
docker-compose restart postgres
```

## Next Steps

- Read [DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for detailed documentation
- Check [lib/db/README.md](lib/db/README.md) for database management commands
- Review schema in `lib/db/schema.ts`

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start PostgreSQL |
| `npm run docker:down` | Stop PostgreSQL |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open database GUI |
| `npm run db:seed` | Seed sample data |
| `npx tsx scripts/check-db.ts` | Test connection |
