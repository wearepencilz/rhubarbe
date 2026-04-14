'use client';

import { useLocale } from '@/contexts/LocaleContext';

export default function LanguageSwitcher({ color }: { color?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center gap-1 text-[16px] lowercase leading-none"
      style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}
    >
      <button
        onClick={() => setLocale('fr')}
        className="transition-opacity"
        style={{ opacity: locale === 'fr' ? 1 : 0.4 }}
        aria-label="Français"
        aria-pressed={locale === 'fr'}
      >
        fr
      </button>
      <span style={{ opacity: 0.4 }}>/</span>
      <button
        onClick={() => setLocale('en')}
        className="transition-opacity"
        style={{ opacity: locale === 'en' ? 1 : 0.4 }}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        en
      </button>
    </div>
  );
}
