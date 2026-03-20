# Database Setup

This directory contains the database configuration and schema for the Rhubarbe preorder operations system.

## Architecture

- **Production**: Vercel Postgres (managed PostgreSQL on Vercel)
- **Development**: Local PostgreSQL with Docker Compose
- **ORM**: Drizzle ORM for type-safe database access and migrations

## Quick Start

### Development Setup

1. **Start PostgreSQL**:
   ```bash
   npm run docker:up
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Seed database** (optional):
   ```bash
   npm run db:seed
   ```

4. **View database** (Drizzle Studio):
   ```bash
   npm run db:studio
   ```

### Production Setup

1. **Connect Vercel Postgres**:
   - Go to Vercel Dashboard → Your Project → Storage
   - Click "Create Database" → Select "Postgres"
   - Click "Connect to Project"
   - Vercel automatically adds `POSTGRES_URL` to your environment

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

## Database Management Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start local PostgreSQL with Docker |
| `npm run docker:down` | Stop local PostgreSQL |
| `npm run docker:logs` | View PostgreSQL logs |
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed database with initial data |

## Environment Variables

### Development
```env
DATABASE_URL=postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe
```

### Production
```env
POSTGRES_URL=<automatically set by Vercel>
```

### Testing
```env
TEST_DATABASE_URL=postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test
```

## Schema Management

The database schema is defined in `lib/db/schema.ts` using Drizzle ORM.

### Making Schema Changes

1. **Edit schema**:
   ```typescript
   // lib/db/schema.ts
   export const myTable = pgTable('my_table', {
     id: uuid('id').primaryKey().defaultRandom(),
     name: text('name').notNull(),
   });
   ```

2. **Generate migration**:
   ```bash
   npm run db:generate
   ```

3. **Review migration**:
   - Check `drizzle/migrations/` for generated SQL
   - Verify the migration is correct

4. **Run migration**:
   ```bash
   npm run db:migrate
   ```

## Files

- `client.ts` - Database client with environment detection
- `schema.ts` - Database schema definitions
- `README.md` - This file

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to database
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Start PostgreSQL
```bash
npm run docker:up
```

### Migration Issues

**Problem**: Migration fails
```
Error: relation "table_name" already exists
```

**Solution**: Check if migrations are out of sync
```bash
# Reset database (WARNING: deletes all data)
npm run docker:down
npm run docker:up
npm run db:migrate
```

### Port Conflicts

**Problem**: Port 5432 already in use

**Solution**: Stop existing PostgreSQL or change port in `docker-compose.yml`
```bash
# Check what's using port 5432
lsof -i :5432

# Stop existing PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux
```

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
