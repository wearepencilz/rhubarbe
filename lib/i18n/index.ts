import fr from './locales/fr';
import en from './locales/en';
import type { Translations } from './locales/fr';

export type Locale = 'fr' | 'en';

export const locales: Record<Locale, Translations> = { fr, en };

/** Get the translation dictionary for a locale */
export function getT(locale: Locale = 'fr') {
  return locales[locale];
}

/**
 * Deep-merge CMS string overrides onto a locale's translation object.
 * Only plain string values are overridden — functions, arrays, and missing keys are skipped.
 */
export function mergeOverrides(base: Translations, overrides: Record<string, any>): Translations {
  const result = { ...base } as any;
  for (const section of Object.keys(overrides)) {
    if (!(section in result) || typeof overrides[section] !== 'object') continue;
    const baseSection = result[section];
    const overSection = overrides[section];
    if (typeof baseSection !== 'object' || baseSection === null) continue;
    result[section] = { ...baseSection };
    for (const key of Object.keys(overSection)) {
      const val = overSection[key];
      // Only override string keys (skip functions, arrays, nested objects)
      if (typeof val === 'string' && val.trim() !== '' && key in baseSection && typeof baseSection[key] === 'string') {
        result[section][key] = val;
      }
      // Handle nested sections (e.g. form.traiteur, form.gateaux, form.fields)
      if (typeof val === 'object' && !Array.isArray(val) && typeof baseSection[key] === 'object' && !Array.isArray(baseSection[key])) {
        result[section][key] = { ...baseSection[key] };
        for (const nestedKey of Object.keys(val)) {
          if (typeof val[nestedKey] === 'string' && val[nestedKey].trim() !== '' && nestedKey in baseSection[key] && typeof baseSection[key][nestedKey] === 'string') {
            result[section][key][nestedKey] = val[nestedKey];
          }
          // Handle eventTypes array override
          if (nestedKey === 'eventTypes' && Array.isArray(val[nestedKey]) && val[nestedKey].length > 0) {
            result[section][key][nestedKey] = val[nestedKey];
          }
        }
      }
    }
  }
  return result;
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
