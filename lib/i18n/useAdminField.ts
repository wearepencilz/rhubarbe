'use client';

import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import type { Locale } from '@/lib/i18n';
import type { ContentTranslations } from '@/types';

/**
 * Returns the value and onChange handler for a translatable field,
 * scoped to the current admin locale.
 *
 * - When adminLocale = 'en': reads/writes record[field] directly
 * - When adminLocale = 'fr': reads record.translations.fr[field] (falls back to record[field] as placeholder)
 *
 * @example
 * const { value, onChange, placeholder } = useAdminField(formData, 'description', setFormData);
 * <Textarea label="Description" value={value} onChange={onChange} placeholder={placeholder} />
 */
export function useAdminField<T extends Record<string, any>>(
  record: T,
  field: string,
  setRecord: (updater: (prev: T) => T) => void
) {
  const { adminLocale } = useAdminLocale();

  if (adminLocale === 'en') {
    return {
      value: (record[field] as string) ?? '',
      placeholder: undefined as string | undefined,
      onChange: (v: string) =>
        setRecord((prev) => ({ ...prev, [field]: v })),
      locale: 'en' as Locale,
    };
  }

  // FR: read from translations.fr, fall back to EN value as placeholder
  const frValue = (record.translations as ContentTranslations | undefined)?.fr?.[field] ?? '';
  const enFallback = (record[field] as string) ?? '';

  return {
    value: frValue,
    placeholder: enFallback || undefined,
    onChange: (v: string) =>
      setRecord((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          fr: {
            ...(prev.translations?.fr ?? {}),
            [field]: v || undefined,
          },
        },
      })),
    locale: 'fr' as Locale,
  };
}

/**
 * Simpler version for plain objects (not records with translations).
 * Used for page content objects like about, traiteur, etc.
 * The object shape is: { en: { field }, fr: { field } }
 */
export function useAdminPageField(
  content: Record<string, any>,
  field: string,
  setContent: (updater: (prev: any) => any) => void
) {
  const { adminLocale } = useAdminLocale();

  const value = content?.[adminLocale]?.[field] ?? '';
  const enFallback = adminLocale !== 'en' ? (content?.en?.[field] ?? '') : undefined;

  return {
    value,
    placeholder: enFallback || undefined,
    onChange: (v: string) =>
      setContent((prev) => ({
        ...prev,
        [adminLocale]: {
          ...(prev?.[adminLocale] ?? {}),
          [field]: v,
        },
      })),
    locale: adminLocale,
  };
}
