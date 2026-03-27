'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useState, useEffect } from 'react';

interface NavLabels {
  en: Record<string, string>;
  fr: Record<string, string>;
}

export default function SiteNav() {
  const { T, locale } = useT();
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const [navLabels, setNavLabels] = useState<NavLabels | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.navLabels) setNavLabels(data.navLabels);
      })
      .catch(() => {});
  }, []);

  const label = (key: string, fallback: string) => {
    const override = navLabels?.[locale as 'en' | 'fr']?.[key];
    return override || fallback;
  };

  return (
    <nav
      className="flex items-center gap-4 md:gap-6 text-[11px] md:text-[13px] tracking-[0.28px] uppercase leading-none"
      style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500, color: '#333112' }}
    >
      <Link href="/order" className="hover:opacity-60 transition-opacity flex items-center gap-1">
        {label('order', T.nav.order)}
        {orderCount > 0 && (
          <span className="text-[10px] opacity-50">({orderCount})</span>
        )}
      </Link>
      <Link href="/volume-order" className="hover:opacity-60 transition-opacity flex items-center gap-1">
        {label('volumeOrder', T.nav.volumeOrder)}
        {volumeCount > 0 && (
          <span className="text-[10px] opacity-50">({volumeCount})</span>
        )}
      </Link>
      <Link href="/cake-order" className="hover:opacity-60 transition-opacity flex items-center gap-1">
        {label('cakeOrder', T.nav.cakeOrder)}
        {cakeCount > 0 && (
          <span className="text-[10px] opacity-50">({cakeCount})</span>
        )}
      </Link>
      <Link href="/about" className="hover:opacity-60 transition-opacity">
        {label('about', T.nav.about)}
      </Link>
      <LanguageSwitcher />
    </nav>
  );
}
