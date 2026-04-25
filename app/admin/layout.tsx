'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { ToastProvider } from './components/ToastContainer';
import { AdminLocaleProvider } from '@/contexts/AdminLocaleContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Prevent scroll-to-change on number inputs
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.matches('input[type="number"]')) {
        (e.target as HTMLElement).blur();
      }
    };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <AdminLocaleProvider>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar />
          <main className="lg:pl-[240px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </AdminLocaleProvider>
    </ToastProvider>
  );
}
