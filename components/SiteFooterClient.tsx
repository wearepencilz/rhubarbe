'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import { getT } from '@/lib/i18n';

interface FooterLocale {
  address?: string;
  hours?: string;
  contact?: string;
}

interface SiteFooterClientProps {
  companyName: string;
  addressUrl?: string;
  instagram?: string;
  en: FooterLocale;
  fr: FooterLocale;
}

export default function SiteFooterClient({
  companyName,
  addressUrl,
  instagram,
  en,
  fr,
}: SiteFooterClientProps) {
  const { locale } = useLocale();
  const T = getT(locale);

  const resolve = (field: keyof FooterLocale): string =>
    (locale === 'fr' ? fr[field] : undefined) ?? en[field] ?? '';

  const address = resolve('address');
  const hours = resolve('hours');
  const contact = resolve('contact');

  return (
    <footer className="border-t border-gray-200 px-4 md:px-8 py-10">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}
        >
          {companyName}
        </span>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          <Link href="/order" className="hover:opacity-60 transition-opacity">{T.nav.order}</Link>
          <Link href="/catering" className="hover:opacity-60 transition-opacity">{T.nav.volumeOrder}</Link>
          <Link href="/cake" className="hover:opacity-60 transition-opacity">{T.nav.cakeOrder}</Link>
          <Link href="/about" className="hover:opacity-60 transition-opacity">{T.nav.about}</Link>
        </nav>
        <p
          className="text-xs text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          {T.footer.copyright(new Date().getFullYear(), companyName)}
        </p>
      </div>
    </footer>
  );
}
