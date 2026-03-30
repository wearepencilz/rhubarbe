'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Menus', href: '/admin/menus' },
  { label: 'Orders', href: '/admin/menus/orders' },
  { label: 'Prep Sheet', href: '/admin/menus/prep-sheet' },
  { label: 'Pickup List', href: '/admin/menus/pickup-list' },
];

const tabPaths = new Set(tabs.map((t) => t.href));

export default function MenusLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabs = pathname === '/admin/menus' || tabPaths.has(pathname);

  if (!showTabs) return <>{children}</>;

  return (
    <div>
      <nav className="flex gap-1 border-b border-gray-200 mb-6" aria-label="Menus navigation">
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
