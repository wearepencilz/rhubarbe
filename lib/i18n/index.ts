import fr from './locales/fr';
import en from './locales/en';

export type Locale = 'fr' | 'en';

export const locales = { fr, en };

/** Get the translation dictionary for a locale */
export function getT(locale: Locale = 'fr') {
  return locales[locale];
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
