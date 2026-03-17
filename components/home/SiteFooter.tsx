import { getSettings } from '@/lib/db';

export default async function SiteFooter() {
  const settings = await getSettings().catch(() => ({}));
  const logo: string = settings?.logo || '';
  const companyName: string = settings?.companyName || 'Janine';
  const footer = settings?.footer || {};

  const address: string = footer.address || '2455 rue Notre Dame Ouest, Montreal, H3J 1N6';
  const addressUrl: string = footer.addressUrl || 'https://maps.app.goo.gl/3yU5y5Mnq4Bqf8bAA';
  const hours: string = footer.hours || 'THU / FRI / SAT — 13H – 20H SOMETIMES LATER';
  const instagram: string = footer.instagram || 'https://instagram.com/janinemtl';
  const contact: string = footer.contact || '<p>bonjour@janinemtl.ca</p>';

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
      <div className="w-full flex items-end justify-center overflow-hidden">
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
