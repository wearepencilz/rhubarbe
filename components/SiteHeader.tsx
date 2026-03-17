import Link from 'next/link';
import { getSettings } from '@/lib/db';

interface SiteHeaderProps {
  theme?: 'dark' | 'light';
}

export default async function SiteHeader({ theme = 'dark' }: SiteHeaderProps) {
  const settings = await getSettings().catch(() => ({}));
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
      <nav
        className="pointer-events-auto flex flex-col items-end gap-[8px] md:gap-[10px] text-[12px] md:text-[14px] tracking-[0.28px] uppercase leading-none"
        style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500, color: textColor }}
      >
        <Link href="/order" className="hover:opacity-60 transition-opacity">Order</Link>
        <Link href="/traiteur" className="hover:opacity-60 transition-opacity">Catering</Link>
        <Link href="/gateaux-signatures" className="hover:opacity-60 transition-opacity">Signature Cakes</Link>
        <Link href="/about" className="hover:opacity-60 transition-opacity">About</Link>
      </nav>
    </header>
  );
}
