'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface WeeklyCartItem {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  shopifyVariantId: string | null;
  allergens: string[];
}

export interface PickupSlot { id: string; startTime: string; endTime: string; capacity?: number; }
export interface PickupLocation { id: string; internalName: string; publicLabel: { en: string; fr: string }; address: string; disabledPickupDays?: number[]; }

export interface WeeklyLaunch {
  id: string;
  slug: string | null;
  title: { en: string; fr: string };
  introCopy: { en: string; fr: string };
  status: string;
  orderingOpen: boolean;
  orderOpens: string;
  orderCloses: string;
  pickupDate: string;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  pickupSlots: PickupSlot[];
  pickupLocation: PickupLocation | null;
  products: any[];
}

interface WeeklyCartContextType {
  cart: WeeklyCartItem[];
  cartLaunchId: string | null;
  selectedSlotId: string | null;
  selectedPickupDay: string | null;
  launches: WeeklyLaunch[];
  activeLaunch: WeeklyLaunch | null;
  loading: boolean;
  setCart: React.Dispatch<React.SetStateAction<WeeklyCartItem[]>>;
  setCartLaunchId: (id: string | null) => void;
  setSelectedSlotId: (id: string | null) => void;
  setSelectedPickupDay: (day: string | null) => void;
  setActiveLaunchIdx: (idx: number) => void;
  activeLaunchIdx: number;
}

const WeeklyCartContext = createContext<WeeklyCartContextType>({
  cart: [], cartLaunchId: null, selectedSlotId: null, selectedPickupDay: null,
  launches: [], activeLaunch: null, loading: true,
  setCart: () => {}, setCartLaunchId: () => {}, setSelectedSlotId: () => {},
  setSelectedPickupDay: () => {}, setActiveLaunchIdx: () => {}, activeLaunchIdx: 0,
});

function readLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v != null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function WeeklyCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<WeeklyCartItem[]>([]);
  const [cartLaunchId, setCartLaunchIdState] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotIdState] = useState<string | null>(null);
  const [selectedPickupDay, setSelectedPickupDayState] = useState<string | null>(null);
  const [launches, setLaunches] = useState<WeeklyLaunch[]>([]);
  const [activeLaunchIdx, setActiveLaunchIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    setCartState(readLS('rhubarbe:order:cart', []));
    setCartLaunchIdState(readLS('rhubarbe:order:launchId', null));
    setSelectedSlotIdState(readLS('rhubarbe:order:slotId', null));
    setSelectedPickupDayState(readLS('rhubarbe:order:pickupDay', null));
  }, []);

  // Fetch launches
  useEffect(() => {
    fetch('/api/launches/current')
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : data ? [data] : [];
        const list = raw.map((l: any) => ({
          ...l,
          title: l.title || { en: '', fr: '' },
          introCopy: l.introCopy || { en: '', fr: '' },
          status: l.status || '',
          products: l.products || [],
          pickupSlots: l.pickupSlots || [],
          pickupLocation: l.pickupLocation || null,
        }));
        setLaunches(list);
        // Restore active launch from cart
        const savedId = readLS<string | null>('rhubarbe:order:launchId', null);
        const idx = savedId ? list.findIndex((l: any) => l.id === savedId) : -1;
        setActiveLaunchIdx(idx >= 0 ? idx : 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setCart: React.Dispatch<React.SetStateAction<WeeklyCartItem[]>> = useCallback((action) => {
    setCartState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      writeLS('rhubarbe:order:cart', next);
      try { localStorage.setItem('rhubarbe:order:count', String(next.reduce((s, i) => s + i.quantity, 0))); window.dispatchEvent(new Event('rhubarbe:count-updated')); } catch {}
      return next;
    });
  }, []);

  const setCartLaunchId = useCallback((id: string | null) => {
    setCartLaunchIdState(id); writeLS('rhubarbe:order:launchId', id);
  }, []);
  const setSelectedSlotId = useCallback((id: string | null) => {
    setSelectedSlotIdState(id); writeLS('rhubarbe:order:slotId', id);
  }, []);
  const setSelectedPickupDay = useCallback((day: string | null) => {
    setSelectedPickupDayState(day); writeLS('rhubarbe:order:pickupDay', day);
  }, []);

  const activeLaunch = launches[activeLaunchIdx] ?? null;

  return (
    <WeeklyCartContext.Provider value={{
      cart, cartLaunchId, selectedSlotId, selectedPickupDay,
      launches, activeLaunch, loading,
      setCart, setCartLaunchId, setSelectedSlotId, setSelectedPickupDay,
      setActiveLaunchIdx, activeLaunchIdx,
    }}>
      {children}
    </WeeklyCartContext.Provider>
  );
}

export function useWeeklyCart() { return useContext(WeeklyCartContext); }
