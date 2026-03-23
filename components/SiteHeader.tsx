import Link from 'next/link';
import * as settingsQueries from '@/lib/db/queries/settings';
import SiteNav from '@/components/SiteNav';
import { getLocale } from '@/lib/i18n/server';

interface SiteHeaderProps {
  theme?: 'dark' | 'light';
}

export default async function SiteHeader({ theme = 'dark' }: SiteHeaderProps) {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;
  const logo: string = settings?.logo || '';
  const companyName: string = settings?.companyName || 'Janine';

  const textColor = theme === 'light' ? '#ffffff' : '#333112';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between px-4 md:px-8 pt-5 md:pt-8 pointer-events-none">
      {/* Logo */}
      <Link href="/" className="pointer-events-auto" aria-label={`${companyName} home`}>
        {logo ? (
          <img
            src={logo}
            alt={companyName}
            className="h-[22px] md:h-[27px] w-auto object-contain"
            style={theme === 'light' ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        ) : (
          <span
            className="text-sm tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500, color: textColor }}
          >
            {companyName}
          </span>
        )}
      </Link>

      {/* Right nav */}
      <SiteNav color={textColor} />
    </header>
  );
}
