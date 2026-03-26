'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Like useState but persists to localStorage.
 * Hydrates from storage on mount; writes on every change.
 * Accepts an optional serializer/deserializer for non-JSON-native types (e.g. Map).
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (raw: string) => T;
  },
): [T, (value: T | ((prev: T) => T)) => void] {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;
  const hydrated = useRef(false);

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return deserialize(stored);
    } catch {}
    return initialValue;
  });

  // Write to localStorage on change (skip the initial hydration read)
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    try {
      localStorage.setItem(key, serialize(state));
    } catch {}
  }, [key, state, serialize]);

  return [state, setState];
}

/** Serializer helpers for Map<string, number> */
export const mapSerializer = {
  serialize: (m: Map<string, number>) => JSON.stringify(Array.from(m.entries())),
  deserialize: (raw: string): Map<string, number> => new Map(JSON.parse(raw)),
};
