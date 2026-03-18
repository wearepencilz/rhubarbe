import Link from 'next/link';
import { getSettings } from '@/lib/db';

export default async function SiteFooter() {
  const settings = await getSettings().catch(() => ({}));
  const companyName: string = settings?.companyName || 'Janine';

  return (
    <footer className="border-t border-gray-200 px-4 md:px-8 py-10">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
          <Link href="/order" className="hover:opacity-60 transition-opacity">Order</Link>
          <Link href="/traiteur" className="hover:opacity-60 transition-opacity">Catering</Link>
          <Link href="/gateaux-signatures" className="hover:opacity-60 transition-opacity">Signature Cakes</Link>
          <Link href="/about" className="hover:opacity-60 transition-opacity">About</Link>
        </nav>
        <p
          className="text-xs text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          © {new Date().getFullYear()} {companyName}
        </p>
      </div>
    </footer>
  );
}
