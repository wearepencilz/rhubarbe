'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface OrderItemsContextType {
  orderCount: number;
  volumeCount: number;
  cakeCount: number;
  setOrderCount: (n: number) => void;
  setVolumeCount: (n: number) => void;
  setCakeCount: (n: number) => void;
}

const OrderItemsContext = createContext<OrderItemsContextType>({
  orderCount: 0,
  volumeCount: 0,
  cakeCount: 0,
  setOrderCount: () => {},
  setVolumeCount: () => {},
  setCakeCount: () => {},
});

function readOrderCount(): number {
  try {
    const count = localStorage.getItem('rhubarbe:order:count');
    if (count !== null) return parseInt(count, 10) || 0;
    return 0;
  } catch {}
  return 0;
}

function readVolumeCount(): number {
  try {
    const count = localStorage.getItem('rhubarbe:volume:count');
    if (count !== null) return parseInt(count, 10) || 0;
    return 0;
  } catch {}
  return 0;
}

function readCakeCount(): number {
  try {
    const count = localStorage.getItem('rhubarbe:cake:count');
    if (count !== null) return parseInt(count, 10) || 0;
    return 0;
  } catch {}
  return 0;
}

export function OrderItemsProvider({ children }: { children: React.ReactNode }) {
  const [orderCount, setOrderCount] = useState(0);
  const [volumeCount, setVolumeCount] = useState(0);
  const [cakeCount, setCakeCount] = useState(0);
  const pathname = usePathname();

  const hydrate = useCallback(() => {
    setOrderCount(readOrderCount());
    setVolumeCount(readVolumeCount());
    setCakeCount(readCakeCount());
  }, []);

  // Hydrate on mount and on every route change
  useEffect(() => {
    hydrate();
  }, [pathname, hydrate]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('rhubarbe:') && e.key?.includes(':count')) hydrate();
    };
    const onLocalCount = () => hydrate();
    window.addEventListener('storage', onStorage);
    window.addEventListener('rhubarbe:count-updated', onLocalCount);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('rhubarbe:count-updated', onLocalCount); };
  }, [hydrate]);

  return (
    <OrderItemsContext.Provider value={{ orderCount, volumeCount, cakeCount, setOrderCount, setVolumeCount, setCakeCount }}>
      {children}
    </OrderItemsContext.Provider>
  );
}

export function useOrderItems() {
  return useContext(OrderItemsContext);
}
