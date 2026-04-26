/**
 * Seed script for stories, news, and requests tables.
 *
 * Reads public/data/backups/stories.json, news.json, and requests.json,
 * maps fields to the Postgres schema, preserves legacy IDs,
 * and handles bilingual content (title/subtitle as {en, fr} objects).
 * Uses onConflictDoNothing() for idempotent seeding.
 *
 * Run: npx tsx lib/db/seeds/seed-stories-news-requests.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db, client } from '../client';
import { journal, recipes, requests } from '../schema';

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

// --- Helpers ---

/**
 * Normalize a bilingual field: if it's already an {en, fr} object, return as-is.
 * If it's a plain string, treat it as the French value (primary locale).
 */
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


async function seedStoriesNewsRequests() {
  // --- Seed stories ---
  const storiesPath = resolve(process.cwd(), 'public/data/backups/stories.json');
  const storiesRaw = readFileSync(storiesPath, 'utf-8');
  const storiesData: StoryJson[] = JSON.parse(storiesRaw);

  if (storiesData.length > 0) {
    const storyRows = storiesData.map((s) => ({
      legacyId: s.id != null ? String(s.id) : null,
      slug: s.slug ?? null,
      title: toBilingual(s.title),
      subtitle: toBilingual(s.subtitle),
      content: s.content ?? null,
      category: s.category ?? null,
      tags: s.tags ?? null,
      coverImage: s.coverImage ?? s.cover_image ?? null,
      status: s.status ?? null,
      publishedAt: s.publishedAt ?? s.published_at
        ? new Date(s.publishedAt ?? s.published_at!)
        : null,
      ...(s.createdAt ? { createdAt: new Date(s.createdAt) } : {}),
      ...(s.updatedAt ? { updatedAt: new Date(s.updatedAt) } : {}),
    }));

    await db.insert(journal).values(storyRows).onConflictDoNothing();
    console.log(`Seeded ${storyRows.length} story rows (duplicates skipped).`);
  } else {
    console.log('No story rows to seed.');
  }

  // --- Seed news ---
  const newsPath = resolve(process.cwd(), 'public/data/backups/news.json');
  const newsRaw = readFileSync(newsPath, 'utf-8');
  const newsData: NewsJson[] = JSON.parse(newsRaw);

  if (newsData.length > 0) {
    const newsRows = newsData.map((n) => ({
      legacyId: n.id != null ? String(n.id) : null,
      title: n.title ? { en: '', fr: n.title } : null,
      content: n.content ?? null,
      ...(n.createdAt ? { createdAt: new Date(n.createdAt) } : {}),
      ...(n.updatedAt ? { updatedAt: new Date(n.updatedAt) } : {}),
    }));

    await db.insert(recipes).values(newsRows).onConflictDoNothing();
    console.log(`Seeded ${newsRows.length} news rows (duplicates skipped).`);
  } else {
    console.log('No news rows to seed.');
  }

  // --- Seed requests ---
  const requestsPath = resolve(process.cwd(), 'public/data/backups/requests.json');
  const requestsRaw = readFileSync(requestsPath, 'utf-8');
  const requestsData: RequestJson[] = JSON.parse(requestsRaw);

  if (requestsData.length > 0) {
    const requestRows = requestsData.map((r) => ({
      legacyId: r.id != null ? String(r.id) : null,
      name: r.name,
      email: r.email,
      phone: r.phone ?? null,
      date: r.date ?? null,
      time: r.time ?? null,
      guests: r.guests != null ? String(r.guests) : null,
      eventType: r.eventType ?? r.event_type ?? null,
      delivery: r.delivery ?? null,
      address: r.address ?? null,
      notes: r.notes ?? null,
      type: r.type,
      status: r.status,
      ...(r.createdAt ? { createdAt: new Date(r.createdAt) } : {}),
    }));

    await db.insert(requests).values(requestRows).onConflictDoNothing();
    console.log(`Seeded ${requestRows.length} request rows (duplicates skipped).`);
  } else {
    console.log('No request rows to seed.');
  }

  await client.end();
}

seedStoriesNewsRequests().catch((err) => {
  console.error('Stories/news/requests seed failed:', err);
  process.exit(1);
});
