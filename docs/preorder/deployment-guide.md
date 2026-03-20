# Preorder Operations — Deployment Guide

## Prerequisites

- Vercel project connected to the repository
- Vercel Postgres database provisioned
- Environment variables configured in Vercel dashboard

## Environment Variables

Set these in Vercel → Settings → Environment Variables:

```
POSTGRES_URL=<vercel-postgres-url>
POSTGRES_PRISMA_URL=<vercel-postgres-prisma-url>
```

## Deployment Steps

1. Merge `feature/preorder-operations` into `main`
2. Vercel auto-deploys on push to `main`
3. Run migrations against production DB:
   ```bash
   npx vercel env pull .env.local
   npm run db:migrate
   ```
4. Optionally seed initial data:
   ```bash
   npm run db:seed
   ```

## Migration Strategy

- Migrations are additive — new tables and columns only
- Existing products get `availability_mode: 'always_available'` by default
- No breaking changes to existing product data or Shopify sync

## Rollback

If issues arise:
1. Revert the merge commit on `main`
2. Vercel auto-deploys the previous version
3. Database migrations are forward-only; if needed, create a new migration to undo schema changes

## Monitoring

- Error logs are available in **Admin → Error Logs**
- Slot capacity warnings appear when slots reach 80% capacity
- All configuration changes are logged with user and timestamp
