'use client';

import { useLocale } from '@/contexts/LocaleContext';

interface FooterLocale {
  address?: string;
  hours?: string;
  contact?: string;
}

interface SiteFooterClientProps {
  companyName: string;
  logo: string;
  addressUrl: string;
  instagram: string;
  en: FooterLocale;
  fr: FooterLocale;
}

export default function SiteFooterClient({
  companyName,
  logo,
  addressUrl,
  instagram,
  en,
  fr,
}: SiteFooterClientProps) {
  const { locale } = useLocale();

  const resolve = (field: keyof FooterLocale): string =>
    (locale === 'fr' ? fr[field] : undefined) ?? en[field] ?? '';

  const address = resolve('address');
  const hours = resolve('hours');
  const contact = resolve('contact');

  return (
    <footer id="visit" className="relative w-full bg-white overflow-hidden pt-12 md:pt-16">
      {/* Footer info row */}
      <div
        className="grid grid-cols-2 md:flex md:justify-between gap-6 md:gap-0 px-4 md:px-8 pb-12 md:pb-16 text-[#333112] text-[13px] md:text-[16px] leading-[22px] tracking-[0.48px]"
        style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
      >
        <address className="not-italic">
          <a
            href={addressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-60 transition-opacity"
            dangerouslySetInnerHTML={{ __html: address }}
          />
        </address>

        <div className="lowercase" dangerouslySetInnerHTML={{ __html: hours }} />

        <a href={instagram} className="hover:opacity-60 transition-opacity">
          instagram
        </a>

        <div dangerouslySetInnerHTML={{ __html: contact }} />
      </div>

      {/* Big logo */}
      <div className="w-full flex items-end justify-center overflow-hidden px-4 md:px-8">
        {logo ? (
          <img
            src={logo}
            alt={companyName}
            className="w-full object-contain object-bottom"
          />
        ) : (
          <p
            className="text-[#333112] text-[clamp(40px,12vw,180px)] leading-none tracking-tight select-none pb-0"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
            aria-hidden="true"
          >
            {companyName}
          </p>
        )}
      </div>
    </footer>
  );
}
