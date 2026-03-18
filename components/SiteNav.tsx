'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import { getT } from '@/lib/i18n';
import CartButton from '@/components/CartButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SiteNav({ color }: { color?: string }) {
  const { locale } = useLocale();
  const T = getT(locale);

  return (
    <nav
      className="pointer-events-auto flex flex-col items-end gap-[8px] md:gap-[10px] text-[12px] md:text-[14px] tracking-[0.28px] uppercase leading-none"
      style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500, color }}
    >
      <Link href="/order" className="hover:opacity-60 transition-opacity">{T.nav.order}</Link>
      <Link href="/traiteur" className="hover:opacity-60 transition-opacity">{T.nav.catering}</Link>
      <Link href="/gateaux-signatures" className="hover:opacity-60 transition-opacity">{T.nav.signatureCakes}</Link>
      <Link href="/about" className="hover:opacity-60 transition-opacity">{T.nav.about}</Link>
      <CartButton color={color} />
      <LanguageSwitcher color={color} />
    </nav>
  );
}
