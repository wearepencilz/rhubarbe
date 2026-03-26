'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface OrderItemsContextType {
  orderCount: number;
  volumeCount: number;
  setOrderCount: (n: number) => void;
  setVolumeCount: (n: number) => void;
}

const OrderItemsContext = createContext<OrderItemsContextType>({
  orderCount: 0,
  volumeCount: 0,
  setOrderCount: () => {},
  setVolumeCount: () => {},
});

function readOrderCount(): number {
  try {
    const raw = localStorage.getItem('rhubarbe:order:cart');
    if (!raw) return 0;
    const items: any[] = JSON.parse(raw);
    return items.reduce((s, i) => s + (i.quantity ?? 0), 0);
  } catch {}
  return 0;
}

function readVolumeCount(): number {
  try {
    const raw = localStorage.getItem('rhubarbe:volume:cart');
    if (!raw) return 0;
    const entries: [string, number][] = JSON.parse(raw);
    return entries.reduce((s, [, qty]) => s + qty, 0);
  } catch {}
  return 0;
}

export function OrderItemsProvider({ children }: { children: React.ReactNode }) {
  const [orderCount, setOrderCount] = useState(0);
  const [volumeCount, setVolumeCount] = useState(0);
  const pathname = usePathname();

  const hydrate = useCallback(() => {
    setOrderCount(readOrderCount());
    setVolumeCount(readVolumeCount());
  }, []);

  // Hydrate on mount and on every route change
  useEffect(() => {
    hydrate();
  }, [pathname, hydrate]);

  return (
    <OrderItemsContext.Provider value={{ orderCount, volumeCount, setOrderCount, setVolumeCount }}>
      {children}
    </OrderItemsContext.Provider>
  );
}

export function useOrderItems() {
  return useContext(OrderItemsContext);
}
