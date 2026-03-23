/**
 * Minimal JSON file store for legacy entities not yet migrated to PostgreSQL.
 * Replaces the old lib/db.js adapter for:
 * bundles, components, seasonal-collections, migration-status, offerings.
 *
 * Once these entities are migrated, this file can be deleted.
 */
import fs from 'fs';
import path from 'path';

const isProduction = process.env.VERCEL === '1';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

const dataDir = isTest
  ? path.join(process.cwd(), 'tests/fixtures/data')
  : path.join(process.cwd(), 'public/data');

function filePath(filename: string) {
  return path.join(dataDir, filename);
}

export function readJson<T = unknown>(filename: string): T | null {
  try {
    const raw = fs.readFileSync(filePath(filename), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson<T = unknown>(filename: string, data: T): T {
  fs.writeFileSync(filePath(filename), JSON.stringify(data, null, 2));
  return data;
}


