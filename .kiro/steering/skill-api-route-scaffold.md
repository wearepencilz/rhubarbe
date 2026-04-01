---
inclusion: manual
description: Skill — Scaffold REST API routes for a CMS entity following project conventions.
---

# Skill: API Route Scaffold

Use this skill when creating new API routes for a CMS entity.

## File Structure

For a resource called `[resource]`:

```
app/api/[resource]/route.ts            # GET (list) + POST (create)
app/api/[resource]/[id]/route.ts       # GET (single) + PUT (update) + DELETE
lib/db/queries/[resource].ts           # Database query functions
```

## Collection Route (`app/api/[resource]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as resourceQueries from '@/lib/db/queries/[resource]';
import type { PaginatedResponse, ErrorResponse } from '@/types';

// GET — no auth required
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;
    // ... extract filter params

    const allFiltered = await resourceQueries.list({ search /* filters */ });

    const total = allFiltered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = allFiltered.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<(typeof allFiltered)[number]> = {
      data: paginatedData, total, page, pageSize,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching [resource]:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch [resource]',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST — auth required
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // Duplicate check (if applicable)
    const duplicate = await resourceQueries.getByName(body.name);
    if (duplicate) {
      return NextResponse.json(
        { error: 'A [resource] with this name already exists', code: 'DUPLICATE_NAME', details: { existingId: duplicate.id }, timestamp: new Date().toISOString() } satisfies ErrorResponse,
        { status: 409 },
      );
    }

    const created = await resourceQueries.create({ /* map body fields */ });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating [resource]:', error);
    return NextResponse.json(
      { error: 'Failed to create [resource]', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}
```

## Item Route (`app/api/[resource]/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as resourceQueries from '@/lib/db/queries/[resource]';
import type { ErrorResponse } from '@/types';

// GET — no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await resourceQueries.getById(params.id);
    if (!item) {
      return NextResponse.json(
        { error: '[Resource] not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse,
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching [resource]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch [resource]', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}

// PUT — auth required
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const existing = await resourceQueries.getById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: '[Resource] not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    // Duplicate name check excluding current item
    if (body.name) {
      const duplicate = await resourceQueries.getByName(body.name);
      if (duplicate && duplicate.id !== params.id) {
        return NextResponse.json(
          { error: 'A [resource] with this name already exists', code: 'DUPLICATE_NAME', details: { existingId: duplicate.id }, timestamp: new Date().toISOString() } satisfies ErrorResponse,
          { status: 409 },
        );
      }
    }

    const updated = await resourceQueries.update(params.id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating [resource]:', error);
    return NextResponse.json(
      { error: 'Failed to update [resource]', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}

// DELETE — auth required
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 401 },
    );
  }

  try {
    const deleted = await resourceQueries.remove(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: '[Resource] not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse,
        { status: 404 },
      );
    }
    return NextResponse.json({ message: '[Resource] deleted successfully' });
  } catch (error) {
    console.error('Error deleting [resource]:', error);
    return NextResponse.json(
      { error: 'Failed to delete [resource]', timestamp: new Date().toISOString() } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}
```

## Database Query Module (`lib/db/queries/[resource].ts`)

```typescript
import { db } from '@/lib/db/client';
import { [resourceTable] } from '@/lib/db/schema';
import { eq, ilike, asc } from 'drizzle-orm';

export async function list(filters?: { search?: string; /* entity-specific filters */ }) {
  let rows = await db.select().from([resourceTable]).orderBy(asc([resourceTable].name));
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(s));
  }
  // ... apply additional filters
  return rows;
}

export async function getById(id: string) {
  const [row] = await db.select().from([resourceTable]).where(eq([resourceTable].id, id));
  return row ?? null;
}

export async function getByName(name: string) {
  const [row] = await db.select().from([resourceTable]).where(ilike([resourceTable].name, name));
  return row ?? null;
}

export async function create(data: typeof [resourceTable].$inferInsert) {
  const [created] = await db.insert([resourceTable]).values(data).returning();
  return created;
}

export async function update(id: string, data: Partial<typeof [resourceTable].$inferInsert>) {
  const [updated] = await db
    .update([resourceTable])
    .set({ ...data, updatedAt: new Date() })
    .where(eq([resourceTable].id, id))
    .returning();
  return updated ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete([resourceTable]).where(eq([resourceTable].id, id)).returning();
  return !!deleted;
}
```

## Conventions

- GET endpoints are public (no auth check)
- POST/PUT/DELETE require `await auth()` — return 401 if null
- Error responses always use the `ErrorResponse` type from `@/types`
- Include `timestamp: new Date().toISOString()` in every error
- Use error codes: `AUTH_REQUIRED`, `NOT_FOUND`, `DUPLICATE_NAME`
- Pagination: default `pageSize=20`, return `PaginatedResponse<T>`
- Schema uses `pgTable` from Drizzle with `uuid` primary keys and `defaultRandom()`
- Always include `createdAt` and `updatedAt` timestamp columns
- Use `customJsonb<T>()` from `@/lib/db/custom-types` for JSON array/object columns

## Schema Pattern

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { customJsonb } from './custom-types';

export const [resourceTable] = pgTable('[resource]', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // ... entity fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('[resource]_name_idx').on(table.name),
}));
```
