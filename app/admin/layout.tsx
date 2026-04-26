'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import { ToastProvider } from './components/ToastContainer';
import { AdminLocaleProvider } from '@/contexts/AdminLocaleContext';
import { SidebarContext } from '@/contexts/SidebarContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.matches('input[type="number"]')) (e.target as HTMLElement).blur();
    };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  if (isLoginPage) return <>{children}</>;

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      <ToastProvider>
        <AdminLocaleProvider>
          <div className="min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="transition-all duration-200" style={{ marginLeft: expanded ? 272 : 88 }}>
              <div className="pr-4 py-6 [&>.admin-narrow]:max-w-3xl [&>.admin-narrow]:mx-auto">
                {children}
              </div>
            </main>
          </div>
        </AdminLocaleProvider>
      </ToastProvider>
    </SidebarContext.Provider>
  );
}
