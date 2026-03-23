'use client';

import { useLocale } from '@/contexts/LocaleContext';

export function HeroTagline({ fr, en }: { fr: string; en: string }) {
  const { locale } = useLocale();
  return (
    <div
      className="absolute top-[33px] left-1/2 -translate-x-1/2 text-[#333112] text-[14px] leading-[18px] tracking-[0.42px] whitespace-pre-line"
      style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
    >
      {locale === 'fr' ? fr : en}
    </div>
  );
}
