'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/launches', label: 'Launches' },
    { href: '/admin/products', label: 'Menu Items' },
    { href: '/admin/flavours', label: 'Flavours' },
    { href: '/admin/ingredients', label: 'Ingredients' },
    { href: '/admin/formats', label: 'Formats' },
    { href: '/admin/modifiers', label: 'Modifiers' },
    { href: '/admin/batches', label: 'Batches' },
    { href: '/admin/news', label: 'News' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-semibold text-gray-900">Rhubarbe CMS</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                // Exact match for dashboard, prefix match for others
                const isActive = item.href === '/admin' 
                  ? pathname === '/admin'
                  : pathname?.startsWith(item.href + '/') || pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
