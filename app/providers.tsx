'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { TranslationOverridesProvider } from '@/contexts/TranslationOverridesContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <LocaleProvider>
        <TranslationOverridesProvider>
          {children}
        </TranslationOverridesProvider>
      </LocaleProvider>
    </ClerkProvider>
  );
}
