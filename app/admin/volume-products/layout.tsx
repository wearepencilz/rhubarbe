'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Products', href: '/admin/volume-products' },
  { label: 'Orders', href: '/admin/volume-products/orders' },
  { label: 'Prep Sheet', href: '/admin/volume-products/prep-sheet' },
  { label: 'Pickup List', href: '/admin/volume-products/pickup-list' },
  { label: 'Settings', href: '/admin/volume-products/settings' },
];

const tabPaths = new Set(tabs.map((t) => t.href));

export default function VolumeProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Show tabs on the main page and all tab pages; hide on product edit pages (UUID paths)
  const showTabs = pathname === '/admin/volume-products' || tabPaths.has(pathname);

  if (!showTabs) {
    return <>{children}</>;
  }

  return (
    <div>
      <nav className="flex gap-1 border-b border-gray-200 mb-6" aria-label="Catering navigation">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
