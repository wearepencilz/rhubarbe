'use client';

import { useLocale } from '@/contexts/LocaleContext';

export default function LanguageSwitcher({ color }: { color?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center gap-1 text-[11px] md:text-[13px] tracking-[0.28px] uppercase leading-none font-[500]"
      style={{ fontFamily: 'var(--font-diatype-mono)' }}
    >
      <button
        onClick={() => setLocale('fr')}
        className={`transition-opacity ${locale === 'fr' ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
        aria-label="Français"
        aria-pressed={locale === 'fr'}
      >
        FR
      </button>
      <span className="opacity-20">/</span>
      <button
        onClick={() => setLocale('en')}
        className={`transition-opacity ${locale === 'en' ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
        aria-label="English"
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
}
