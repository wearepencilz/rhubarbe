'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

interface AdminLocaleContextType {
  adminLocale: Locale;
  setAdminLocale: (locale: Locale) => void;
}

const AdminLocaleContext = createContext<AdminLocaleContextType>({
  adminLocale: 'en',
  setAdminLocale: () => {},
});

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [adminLocale, setAdminLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('adminLocale') as Locale | null;
    if (stored === 'en' || stored === 'fr') setAdminLocaleState(stored);
  }, []);

  function setAdminLocale(locale: Locale) {
    setAdminLocaleState(locale);
    localStorage.setItem('adminLocale', locale);
  }

  return (
    <AdminLocaleContext.Provider value={{ adminLocale, setAdminLocale }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  return useContext(AdminLocaleContext);
}
