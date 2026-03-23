'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Overrides {
  fr: Record<string, any>;
  en: Record<string, any>;
}

const TranslationOverridesContext = createContext<Overrides>({ fr: {}, en: {} });

export function TranslationOverridesProvider({
  children,
  initialOverrides,
}: {
  children: React.ReactNode;
  initialOverrides?: Overrides;
}) {
  const [overrides, setOverrides] = useState<Overrides>(initialOverrides ?? { fr: {}, en: {} });

  useEffect(() => {
    if (initialOverrides) return; // already provided server-side
    fetch('/api/pages/translations')
      .then((r) => r.json())
      .then((data) => {
        if (data?.fr || data?.en) {
          setOverrides({ fr: data.fr ?? {}, en: data.en ?? {} });
        }
      })
      .catch(() => {});
  }, [initialOverrides]);

  return (
    <TranslationOverridesContext.Provider value={overrides}>
      {children}
    </TranslationOverridesContext.Provider>
  );
}

export function useTranslationOverrides() {
  return useContext(TranslationOverridesContext);
}
