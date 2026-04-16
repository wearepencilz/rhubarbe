'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface CakeCartItem {
  cartId: string; // unique per cart entry
  productId: string;
  productName: string;
  productImage: string | null;
  cakeProductType: string | null;
  flavourHandles: string[];
  size: string; // guest count as string
  addonIds: string[];
  addonSizes: Record<string, string>;
  sheetCakeAddonIds: string[];
  sheetCakeFlavour: string;
  computedPrice: number | null;
}

export interface CakeFulfillment {
  pickupDate: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress: string;
  eventType: string;
  specialInstructions: string;
}

interface CakeCartContextType {
  items: CakeCartItem[];
  fulfillment: CakeFulfillment;
  products: any[];
  addItem: (item: Omit<CakeCartItem, 'cartId'>) => void;
  updateItem: (cartId: string, patch: Partial<CakeCartItem>) => void;
  removeItem: (cartId: string) => void;
  setFulfillment: (patch: Partial<CakeFulfillment>) => void;
  clearCart: () => void;
}

const DEFAULT_FULFILLMENT: CakeFulfillment = {
  pickupDate: '',
  fulfillmentType: 'pickup',
  deliveryAddress: '',
  eventType: '',
  specialInstructions: '',
};

const CakeCartContext = createContext<CakeCartContextType>({
  items: [],
  fulfillment: DEFAULT_FULFILLMENT,
  products: [],
  addItem: () => {},
  updateItem: () => {},
  removeItem: () => {},
  setFulfillment: () => {},
  clearCart: () => {},
});

const STORAGE_KEY = 'rhubarbe:cake:cart:v2';

function load(): { items: CakeCartItem[]; fulfillment: CakeFulfillment } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { items: [], fulfillment: DEFAULT_FULFILLMENT };
}

function save(items: CakeCartItem[], fulfillment: CakeFulfillment) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, fulfillment }));
    localStorage.setItem('rhubarbe:cake:count', String(items.length));
    window.dispatchEvent(new Event('rhubarbe:count-updated'));
  } catch {}
}

export function CakeCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CakeCartItem[]>([]);
  const [fulfillment, setFulfillmentState] = useState<CakeFulfillment>(DEFAULT_FULFILLMENT);
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const saved = load();
    setItems(saved.items);
    setFulfillmentState(saved.fulfillment);
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch('/api/storefront/cake-products').then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (hydrated) save(items, fulfillment);
  }, [items, fulfillment, hydrated]);

  const addItem = useCallback((item: Omit<CakeCartItem, 'cartId'>) => {
    setItems((prev) => [...prev, { ...item, cartId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }, []);

  const updateItem = useCallback((cartId: string, patch: Partial<CakeCartItem>) => {
    setItems((prev) => prev.map((i) => i.cartId === cartId ? { ...i, ...patch } : i));
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  const setFulfillment = useCallback((patch: Partial<CakeFulfillment>) => {
    setFulfillmentState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setFulfillmentState(DEFAULT_FULFILLMENT);
  }, []);

  return (
    <CakeCartContext.Provider value={{ items, fulfillment, products, addItem, updateItem, removeItem, setFulfillment, clearCart }}>
      {children}
    </CakeCartContext.Provider>
  );
}

export function useCakeCart() {
  return useContext(CakeCartContext);
}
