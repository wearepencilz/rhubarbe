/**
 * Property-Based Test: API Response Shape Invariant
 *
 * Feature: json-to-postgres-migration, Property 3: API response shape invariant
 *
 * **Validates: Requirements 3.3**
 *
 * For any entity stored in PostgreSQL after migration, the JSON response
 * returned by the corresponding query helper must contain all fields that
 * were present in the pre-migration JSON source, with the same types and
 * nesting structure.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as storiesQueries from '@/lib/db/queries/stories';
import * as newsQueries from '@/lib/db/queries/news';
import * as requestsQueries from '@/lib/db/queries/requests';

// --- JSON shape interfaces ---

interface StoryJson {
  id?: string | number;
  slug?: string;
  title?: string | { en?: string; fr?: string };
  subtitle?: string | { en?: string; fr?: string };
  content?: unknown;
  category?: string;
  tags?: string[];
  coverImage?: string;
  cover_image?: string;
  status?: string;
  publishedAt?: string;
  published_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NewsJson {
  id?: string | number;
  title?: string;
  content?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

interface RequestJson {
  id?: string | number;
  name: string;
  email: string;
  phone?: string;
  date?: string;
  time?: string;
  guests?: string | number;
  eventType?: string;
  event_type?: string;
  delivery?: string;
  address?: string;
  notes?: string;
  type: string;
  status: string;
  createdAt?: string;
}

// --- Load source JSON once ---
const storiesPath = resolve(process.cwd(), 'public/data/backups/stories.json');
const storiesJson: StoryJson[] = JSON.parse(readFileSync(storiesPath, 'utf-8'));

const newsPath = resolve(process.cwd(), 'public/data/backups/news.json');
const newsJson: NewsJson[] = JSON.parse(readFileSync(newsPath, 'utf-8'));

const requestsPath = resolve(process.cwd(), 'public/data/backups/requests.json');
const requestsJson: RequestJson[] = JSON.parse(readFileSync(requestsPath, 'utf-8'));

// --- Helpers ---

function toBilingual(value: unknown): { en: string; fr: string } | null {
  if (value == null) return null;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, string>;
    return { en: obj.en ?? '', fr: obj.fr ?? '' };
  }
  if (typeof value === 'string') {
    return { en: '', fr: value };
  }
  return null;
}

/**
 * Returns the expected type string for a value, handling null/array.
 */
function expectedType(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

// --- Test DB connection ---
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('Property 3: API response shape invariant', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Clean and seed stories
    await db.execute(sql`DELETE FROM stories`);
    for (const s of storiesJson) {
      const biTitle = toBilingual(s.title);
      const biSubtitle = toBilingual(s.subtitle);
      await db.execute(
        sql`INSERT INTO stories (id, legacy_id, slug, title, subtitle, content, category, tags, cover_image, status, published_at, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${s.id != null ? String(s.id) : null},
              ${s.slug ?? null},
              ${biTitle ? JSON.stringify(biTitle) : null}::jsonb,
              ${biSubtitle ? JSON.stringify(biSubtitle) : null}::jsonb,
              ${s.content != null ? JSON.stringify(s.content) : null}::jsonb,
              ${s.category ?? null},
              ${s.tags ? JSON.stringify(s.tags) : null}::jsonb,
              ${s.coverImage ?? s.cover_image ?? null},
              ${s.status ?? null},
              ${s.publishedAt ?? s.published_at ? new Date((s.publishedAt ?? s.published_at)!) : null},
              ${s.createdAt ? new Date(s.createdAt) : sql`now()`},
              ${s.updatedAt ? new Date(s.updatedAt) : sql`now()`}
            )`
      );
    }

    // Clean and seed news
    await db.execute(sql`DELETE FROM news`);
    for (const n of newsJson) {
      await db.execute(
        sql`INSERT INTO news (id, legacy_id, title, content, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${n.id != null ? String(n.id) : null},
              ${n.title ?? null},
              ${n.content != null ? JSON.stringify(n.content) : null}::jsonb,
              ${n.createdAt ? new Date(n.createdAt) : sql`now()`},
              ${n.updatedAt ? new Date(n.updatedAt) : sql`now()`}
            )`
      );
    }

    // Clean and seed requests
    await db.execute(sql`DELETE FROM requests`);
    for (const r of requestsJson) {
      await db.execute(
        sql`INSERT INTO requests (id, legacy_id, name, email, phone, date, time, guests, event_type, delivery, address, notes, type, status, created_at)
            VALUES (
              gen_random_uuid(),
              ${r.id != null ? String(r.id) : null},
              ${r.name},
              ${r.email},
              ${r.phone ?? null},
              ${r.date ?? null},
              ${r.time ?? null},
              ${r.guests != null ? String(r.guests) : null},
              ${r.eventType ?? r.event_type ?? null},
              ${r.delivery ?? null},
              ${r.address ?? null},
              ${r.notes ?? null},
              ${r.type},
              ${r.status},
              ${r.createdAt ? new Date(r.createdAt) : sql`now()`}
            )`
      );
    }
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM stories`);
    await db.execute(sql`DELETE FROM news`);
    await db.execute(sql`DELETE FROM requests`);
    await client.end();
  });

  // --- Requests property test (requests.json has data) ---
  it('should return all expected fields with correct types for every request record', async () => {
    // Requests JSON has data — verify shape invariant
    expect(requestsJson.length).toBeGreaterThan(0);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...requestsJson),
        async (jsonItem) => {
          // Query all requests and find the one matching this legacy ID
          const allRequests = await requestsQueries.list();
          const row = allRequests.find((r) => r.legacyId === String(jsonItem.id));

          expect(row).toBeDefined();
          if (!row) return;

          // Verify all JSON source fields are present in the DB response
          // with correct types

          // Required fields — must be present and same type
          expect(typeof row.name).toBe('string');
          expect(row.name).toBe(jsonItem.name);

          expect(typeof row.email).toBe('string');
          expect(row.email).toBe(jsonItem.email);

          expect(typeof row.type).toBe('string');
          expect(row.type).toBe(jsonItem.type);

          expect(typeof row.status).toBe('string');
          expect(row.status).toBe(jsonItem.status);

          // Optional string fields — present with same type or null
          expect(row.phone).toBe(jsonItem.phone ?? null);
          expect(row.date).toBe(jsonItem.date ?? null);
          expect(row.time).toBe(jsonItem.time ?? null);
          expect(row.delivery).toBe(jsonItem.delivery ?? null);
          expect(row.address).toBe(jsonItem.address ?? null);
          expect(row.notes).toBe(jsonItem.notes ?? null);

          // guests is coerced to string in the DB
          expect(row.guests).toBe(
            jsonItem.guests != null ? String(jsonItem.guests) : null
          );

          // eventType mapped from eventType or event_type
          expect(row.eventType).toBe(
            jsonItem.eventType ?? jsonItem.event_type ?? null
          );

          // legacy_id preserved as string
          expect(row.legacyId).toBe(String(jsonItem.id));

          // createdAt should be a Date instance
          expect(row.createdAt).toBeInstanceOf(Date);

          // The response must have an id (UUID)
          expect(typeof row.id).toBe('string');
          expect(row.id.length).toBe(36); // UUID format
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Stories property test (gracefully handle empty array) ---
  it('should return all expected fields with correct types for every story record', async () => {
    if (storiesJson.length === 0) {
      // stories.json is empty — verify the DB also returns empty
      const allStories = await storiesQueries.list();
      expect(allStories).toEqual([]);
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...storiesJson),
        async (jsonItem) => {
          const allStories = await storiesQueries.list();
          const row = allStories.find(
            (s) => s.legacyId === (jsonItem.id != null ? String(jsonItem.id) : null)
          );

          expect(row).toBeDefined();
          if (!row) return;

          // Bilingual title field — should be object with en/fr keys
          if (jsonItem.title != null) {
            expect(row.title).toBeDefined();
            const title = row.title as { en: string; fr: string } | null;
            expect(title).not.toBeNull();
            if (title) {
              expect(typeof title.en).toBe('string');
              expect(typeof title.fr).toBe('string');
            }
          }

          // Bilingual subtitle
          if (jsonItem.subtitle != null) {
            const subtitle = row.subtitle as { en: string; fr: string } | null;
            if (subtitle) {
              expect(typeof subtitle.en).toBe('string');
              expect(typeof subtitle.fr).toBe('string');
            }
          }

          // String fields
          if (jsonItem.slug != null) expect(typeof row.slug).toBe('string');
          if (jsonItem.category != null) expect(typeof row.category).toBe('string');
          if (jsonItem.status != null) expect(typeof row.status).toBe('string');

          // Tags — should be array or null
          if (jsonItem.tags != null) {
            expect(Array.isArray(row.tags)).toBe(true);
          }

          // Cover image
          const expectedCover = jsonItem.coverImage ?? jsonItem.cover_image ?? null;
          if (expectedCover != null) {
            expect(typeof row.coverImage).toBe('string');
          }

          // UUID id
          expect(typeof row.id).toBe('string');
          expect(row.id.length).toBe(36);

          // Timestamps
          expect(row.createdAt).toBeInstanceOf(Date);
          expect(row.updatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- News property test (gracefully handle empty array) ---
  it('should return all expected fields with correct types for every news record', async () => {
    if (newsJson.length === 0) {
      // news.json is empty — verify the DB also returns empty
      const allNews = await newsQueries.list();
      expect(allNews).toEqual([]);
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...newsJson),
        async (jsonItem) => {
          const allNews = await newsQueries.list();
          const row = allNews.find(
            (n) => n.legacyId === (jsonItem.id != null ? String(jsonItem.id) : null)
          );

          expect(row).toBeDefined();
          if (!row) return;

          // Title
          if (jsonItem.title != null) {
            expect(typeof row.title).toBe('string');
            expect(row.title).toBe(jsonItem.title);
          }

          // Content — should be present if source had it
          if (jsonItem.content != null) {
            expect(row.content).toBeDefined();
            expect(expectedType(row.content)).toBe(expectedType(jsonItem.content));
          }

          // legacy_id
          expect(row.legacyId).toBe(String(jsonItem.id));

          // UUID id
          expect(typeof row.id).toBe('string');
          expect(row.id.length).toBe(36);

          // Timestamps
          expect(row.createdAt).toBeInstanceOf(Date);
          expect(row.updatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
