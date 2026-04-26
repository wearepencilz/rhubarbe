'use client';

import Link from 'next/link';

export default function SiteNav() {
  const items = [
    { href: '/order', label: 'weekly menu' },
    { href: '/catering', label: 'catering' },
    { href: '/cake', label: 'cakes' },
    { href: '/journal', label: 'journal' },
  ];

  return (
    <nav className="flex items-center gap-6 lowercase leading-none"
      style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821', fontSize: '16px' }}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="hover:opacity-60 transition-opacity">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
