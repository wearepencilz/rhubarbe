'use client';

import { useMemo } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { getT, mergeOverrides } from '@/lib/i18n';
import { useTranslationOverrides } from '@/contexts/TranslationOverridesContext';

/** Client-side hook to get the translation dictionary for the current locale, with CMS overrides applied */
export function useT() {
  const { locale } = useLocale();
  const overrides = useTranslationOverrides();

  const T = useMemo(() => {
    const base = getT(locale);
    const localeOverrides = overrides[locale];
    if (!localeOverrides || Object.keys(localeOverrides).length === 0) return base;
    return mergeOverrides(base, localeOverrides);
  }, [locale, overrides]);

  return { T, locale };
}
