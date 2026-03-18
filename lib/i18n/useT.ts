'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { getT } from '@/lib/i18n';

/** Client-side hook to get the translation dictionary for the current locale */
export function useT() {
  const { locale } = useLocale();
  return { T: getT(locale), locale };
}
