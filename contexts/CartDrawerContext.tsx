'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface CartSlot {
  label: { en: string; fr: string };
  renderContent: () => React.ReactNode;
  renderFooter: () => React.ReactNode;
}

interface CartDrawerContextType {
  slots: React.MutableRefObject<Record<string, CartSlot>>;
  registerSlot: (key: string, slot: CartSlot) => void;
  unregisterSlot: (key: string) => void;
  cartOpen: boolean;
  defaultTab: string;
  openCart: (tab?: string) => void;
  closeCart: () => void;
  setDefaultTab: (tab: string) => void;
}

const CartDrawerContext = createContext<CartDrawerContextType>({
  slots: { current: {} },
  registerSlot: () => {},
  unregisterSlot: () => {},
  cartOpen: false,
  defaultTab: 'weekly',
  openCart: () => {},
  closeCart: () => {},
  setDefaultTab: () => {},
});

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const slots = useRef<Record<string, CartSlot>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState('weekly');

  const registerSlot = useCallback((key: string, slot: CartSlot) => {
    slots.current[key] = slot;
  }, []);

  const unregisterSlot = useCallback((key: string) => {
    delete slots.current[key];
  }, []);

  const openCart = useCallback((tab?: string) => {
    if (tab) setDefaultTab(tab);
    setCartOpen(true);
  }, []);

  return (
    <CartDrawerContext.Provider value={{
      slots, registerSlot, unregisterSlot,
      cartOpen, defaultTab, openCart,
      closeCart: () => setCartOpen(false),
      setDefaultTab,
    }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}
