'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Products', href: '/admin/cake-products' },
  { label: 'Orders', href: '/admin/cake-products/orders' },
  { label: 'Prep Sheet', href: '/admin/cake-products/prep-sheet' },
  { label: 'Pickup List', href: '/admin/cake-products/pickup-list' },
  { label: 'Settings', href: '/admin/cake-products/settings' },
];

const tabPaths = new Set(tabs.map((t) => t.href));

export default function CakeProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Show tabs on the main page and all tab pages; hide on product edit pages (UUID paths)
  const showTabs = pathname === '/admin/cake-products' || tabPaths.has(pathname);

  if (!showTabs) {
    return <>{children}</>;
  }

  return (
    <div>
      <nav className="flex gap-1 border-b border-gray-200 mb-6" aria-label="Cake navigation">
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
