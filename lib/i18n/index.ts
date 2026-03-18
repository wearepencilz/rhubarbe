import fr from './locales/fr';
import en from './locales/en';
import { cookies } from 'next/headers';

export type Locale = 'fr' | 'en';

export const locales = { fr, en };

/** Get the translation dictionary for a locale */
export function getT(locale: Locale = 'fr') {
  return locales[locale];
}

/**
 * Read the current locale from the request cookie (server components).
 * Defaults to 'fr'.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get('locale')?.value;
    if (value === 'en' || value === 'fr') return value;
  } catch {
    // cookies() throws outside of a request context (e.g. static generation)
  }
  return 'fr';
}

/**
 * Resolve a translatable content field from a record.
 * Falls back to the base English value if no French translation exists.
 *
 * @example
 * const desc = t(product, 'description', 'fr');
 * // returns product.translations?.fr?.description ?? product.description
 */
export function t<T extends Record<string, any>>(
  record: T,
  field: string,
  locale: Locale = 'fr'
): string {
  if (locale !== 'en') {
    const translated = record?.translations?.[locale]?.[field];
    if (translated) return translated;
  }
  return record?.[field] ?? '';
}

export { fr, en };
