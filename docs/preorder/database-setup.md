# Preorder Operations — Database Setup

## Local Development (Docker Compose)

```bash
# Start PostgreSQL
docker compose up -d postgres

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

## Environment Variables

```env
# Local development
DATABASE_URL=postgresql://rhubarbe:rhubarbe@localhost:5432/rhubarbe

# Production (Vercel Postgres) — set in Vercel dashboard
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
```

## Migrations

```bash
# Generate a new migration after schema changes
npx drizzle-kit generate:pg

# Apply migrations
npm run db:migrate

# Open Drizzle Studio to inspect data
npx drizzle-kit studio
```

## Schema Overview

| Table | Purpose |
|-------|---------|
| `availability_patterns` | Reusable ordering rules (recurring weekly, rolling lead-time, one-off) |
| `pickup_locations` | Physical pickup points with bilingual labels |
| `slot_templates` | Time slot definitions with capacity |
| `menu_weeks` | Weekly menu configurations with featured products |
| `product_availability_windows` | Date-specific overrides per product |
| `orders` / `order_items` | Customer orders with pickup details |
| `slot_capacity` | Per-slot capacity tracking with optimistic locking |

All tables include `created_at` and `updated_at` timestamps. Soft deletes use an `active` boolean flag.
