'use client';

import { useState, useEffect } from 'react';

const cache: Record<string, string[] | undefined> = {};

export function useTaxonomyOptions(category: string): string[] {
  const [options, setOptions] = useState<string[]>(cache[category] ?? []);

  useEffect(() => {
    if (cache[category] !== undefined) { setOptions(cache[category]!); return; }
    fetch(`/api/settings/taxonomies/${category}`)
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; archived?: boolean }> }) => {
        const values = (data.values ?? []).filter((d) => !d.archived).map((d) => d.value);
        cache[category] = values;
        setOptions(values);
      })
      .catch(() => {});
  }, [category]);

  return options;
}
