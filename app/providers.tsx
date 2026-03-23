'use client';

import { SessionProvider } from 'next-auth/react';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { TranslationOverridesProvider } from '@/contexts/TranslationOverridesContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <TranslationOverridesProvider>
          {children}
        </TranslationOverridesProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
