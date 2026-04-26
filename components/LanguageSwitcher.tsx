'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();

  // Strip existing locale prefix to get the base path
  const basePath = pathname.replace(/^\/(fr|en)/, '') || '/';

  return (
    <div
      className="flex items-center gap-1 text-[16px] lowercase leading-none"
      style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}
    >
      <a
        href={`/fr${basePath}`}
        className="transition-opacity"
        style={{ opacity: locale === 'fr' ? 1 : 0.4 }}
        aria-label="Français"
      >
        fr
      </a>
      <span style={{ opacity: 0.4 }}>/</span>
      <a
        href={`/en${basePath}`}
        className="transition-opacity"
        style={{ opacity: locale === 'en' ? 1 : 0.4 }}
        aria-label="English"
      >
        en
      </a>
    </div>
  );
}
