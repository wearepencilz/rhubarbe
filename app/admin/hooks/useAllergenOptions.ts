'use client';

import { useState, useEffect } from 'react';

let cached: string[] | null = null;

export function useAllergenOptions(): string[] {
  const [options, setOptions] = useState<string[]>(cached ?? []);

  useEffect(() => {
    if (cached) { setOptions(cached); return; }
    fetch('/api/settings/taxonomies/allergens')
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; archived?: boolean }> }) => {
        const values = (data.values ?? []).filter((d) => !d.archived).map((d) => d.value);
        cached = values;
        setOptions(values);
      })
      .catch(() => {});
  }, []);

  return options;
}
