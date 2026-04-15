'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { calculateServesEstimate } from '@/lib/utils/order-helpers';
import type { VolumeProduct, VolumeVariant } from '@/app/catering/VolumeOrderPageClient';

export type { VolumeProduct, VolumeVariant };

export interface CateringFulfillment {
  date: string; time: string; type: 'pickup' | 'delivery'; allergenNote: string;
}

export interface CateringTypeConfig {
  orderScope: 'variant' | 'order'; orderMinimum: number; variantMinimum: number;
  increment: number; unitLabel: 'quantity' | 'people'; maxAdvanceDays: number | null;
  leadTimeTiers: Array<{ minQuantity: number; leadTimeDays: number }>;
}

export interface CartGroup {
  productId: string; productName: string; shopifyProductId: string | null;
  basePrice: number; allergens: string[]; volumeUnitLabel: 'quantity' | 'people';
  cateringType: string; servesPerUnit: number | null;
  variants: Array<{ variantId: string; variantLabel: string; quantity: number; shopifyVariantId: string; price: number }>;
  totalQty: number; totalPrice: number;
}

function tr(f: { en: string; fr: string } | null | undefined, locale: string) {
  if (!f) return ''; return locale === 'fr' ? (f.fr || f.en) : (f.en || '');
}
function getTotalQty(product: VolumeProduct, cart: Record<string, number>): number {
  if (product.variants.length === 0) return cart[product.id] ?? 0;
  return product.variants.reduce((s, v) => s + (cart[v.id] ?? 0), 0);
}
function getLeadTimeDays(tiers: Array<{ minQuantity: number; leadTimeDays: number }>, qty: number): number {
  const applicable = tiers.filter((t) => t.minQuantity <= qty).sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
}
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getEarliestDate(days: number) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+days); return d;
}

const DEFAULT_FULFILLMENT: CateringFulfillment = { date: '', time: '', type: 'pickup', allergenNote: '' };
const DEFAULT_TYPE_CONFIG: CateringTypeConfig = { orderScope: 'order', orderMinimum: 1, variantMinimum: 0, increment: 1, unitLabel: 'quantity', maxAdvanceDays: null, leadTimeTiers: [] };
const STORAGE_KEY = 'rhubarbe:catering:cart:v2';

interface CateringCartContextType {
  cart: Record<string, number>;
  fulfillment: CateringFulfillment;
  products: VolumeProduct[];
  typeSettings: Record<string, CateringTypeConfig>;
  deliveryMinForAnyday: number;
  closedPickupDays: number[];
  cartGroups: CartGroup[];
  totalQuantity: number;
  subtotal: number;
  hasMinViolation: boolean;
  deliveryDisabled: boolean;
  maxLeadTimeDays: number;
  earliestDateStr: string;
  latestDateStr: string | null;
  servesEstimate: number;
  dateWarning: string | null;
  setQuantity: (variantId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setFulfillment: (patch: Partial<CateringFulfillment>) => void;
  clearCart: () => void;
  locale: string;
}

const CateringCartContext = createContext<CateringCartContextType>({
  cart: {}, fulfillment: DEFAULT_FULFILLMENT, products: [], typeSettings: {},
  deliveryMinForAnyday: 200000, closedPickupDays: [0],
  cartGroups: [], totalQuantity: 0, subtotal: 0, hasMinViolation: false,
  deliveryDisabled: false, maxLeadTimeDays: 0, earliestDateStr: '', latestDateStr: null,
  servesEstimate: 0, dateWarning: null,
  setQuantity: () => {}, removeProduct: () => {}, setFulfillment: () => {}, clearCart: () => {},
  locale: 'fr',
});

function loadSaved(): { cart: Record<string, number>; fulfillment: CateringFulfillment } {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return { cart: {}, fulfillment: DEFAULT_FULFILLMENT };
}

export function CateringCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillmentState] = useState<CateringFulfillment>(DEFAULT_FULFILLMENT);
  const [products, setProducts] = useState<VolumeProduct[]>([]);
  const [typeSettings, setTypeSettings] = useState<Record<string, CateringTypeConfig>>({});
  const [deliveryMinForAnyday, setDeliveryMinForAnyday] = useState(200000);
  const [closedPickupDays, setClosedPickupDays] = useState<number[]>([0]);
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = loadSaved();
    setCartState(saved.cart);
    setFulfillmentState(saved.fulfillment);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, fulfillment }));
      const count = Object.values(cart).reduce((s, q) => s + q, 0);
      localStorage.setItem('rhubarbe:volume:count', String(count));
    } catch {}
  }, [cart, fulfillment, hydrated]);

  useEffect(() => {
    fetch('/api/storefront/volume-products')
      .then((r) => r.json())
      .then((data: any) => {
        setProducts(data.products ?? data);
        if (data.cateringTypeSettings) setTypeSettings(data.cateringTypeSettings);
        if (data.deliveryMinForAnyday != null) setDeliveryMinForAnyday(data.deliveryMinForAnyday);
        if (data.closedPickupDays) setClosedPickupDays(data.closedPickupDays);
      }).catch(() => {});
  }, []);

  const getTypeConfig = useCallback((product: VolumeProduct): CateringTypeConfig => {
    return typeSettings[product.cateringType ?? ''] ?? DEFAULT_TYPE_CONFIG;
  }, [typeSettings]);

  const cartGroups = useMemo<CartGroup[]>(() => {
    const groups: CartGroup[] = [];
    for (const product of products) {
      const variants: CartGroup['variants'] = [];
      if (product.variants.length > 0) {
        for (const v of product.variants) {
          const qty = cart[v.id] ?? 0;
          if (qty > 0) variants.push({ variantId: v.id, variantLabel: tr(v.label, locale), quantity: qty, shopifyVariantId: v.shopifyVariantId ?? '', price: v.price ?? product.price ?? 0 });
        }
      } else {
        const qty = cart[product.id] ?? 0;
        if (qty > 0) variants.push({ variantId: product.id, variantLabel: '', quantity: qty, shopifyVariantId: '', price: product.price ?? 0 });
      }
      if (variants.length > 0) {
        const config = getTypeConfig(product);
        const name = (locale === 'fr' ? product.translations?.fr?.title : null) || product.title || product.name;
        groups.push({ productId: product.id, productName: name, shopifyProductId: product.shopifyProductId ?? null, basePrice: product.price ?? 0, allergens: product.allergens || [], volumeUnitLabel: config.unitLabel ?? 'quantity', cateringType: product.cateringType ?? '', servesPerUnit: product.servesPerUnit, variants, totalQty: variants.reduce((s, v) => s + v.quantity, 0), totalPrice: variants.reduce((s, v) => s + v.price * v.quantity, 0) });
      }
    }
    return groups;
  }, [products, cart, locale, getTypeConfig]);

  const totalQuantity = useMemo(() => cartGroups.reduce((s, g) => s + g.totalQty, 0), [cartGroups]);
  const subtotal = useMemo(() => cartGroups.reduce((s, g) => s + g.totalPrice, 0), [cartGroups]);

  const hasMinViolation = useMemo(() => {
    const typeTotals = new Map<string, number>();
    for (const p of products) {
      const qty = getTotalQty(p, cart);
      if (qty === 0) continue;
      const type = p.cateringType ?? '';
      typeTotals.set(type, (typeTotals.get(type) ?? 0) + qty);
    }
    return products.some((p) => {
      const qty = getTotalQty(p, cart);
      if (qty === 0) return false;
      const config = getTypeConfig(p);
      if (config.orderScope === 'variant') {
        return p.variants.some((v) => { const q = cart[v.id] ?? 0; return q > 0 && (q < config.variantMinimum || (config.increment > 0 && (q - config.variantMinimum) % config.increment !== 0)); });
      }
      return (typeTotals.get(p.cateringType ?? '') ?? 0) < config.orderMinimum;
    });
  }, [products, cart, getTypeConfig]);

  const deliveryDisabled = useMemo(() => products.some((p) => getTotalQty(p, cart) > 0 && p.pickupOnly), [products, cart]);

  const { maxLeadTimeDays, earliestDateStr } = useMemo(() => {
    let max = 0;
    for (const p of products) {
      const qty = getTotalQty(p, cart);
      if (qty > 0) { const days = getLeadTimeDays(getTypeConfig(p).leadTimeTiers || [], qty); if (days > max) max = days; }
    }
    return { maxLeadTimeDays: max, earliestDateStr: toDateString(getEarliestDate(max)) };
  }, [products, cart, getTypeConfig]);

  const latestDateStr = useMemo(() => {
    let min: number | null = null;
    for (const p of products) {
      const qty = getTotalQty(p, cart);
      if (qty > 0) { const adv = getTypeConfig(p).maxAdvanceDays; if (adv && (min === null || adv < min)) min = adv; }
    }
    if (!min) return null;
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+min); return toDateString(d);
  }, [products, cart, getTypeConfig]);

  const servesEstimate = useMemo(() => calculateServesEstimate(
    products.filter((p) => getTotalQty(p, cart) > 0).map((p) => ({ quantity: getTotalQty(p, cart), servesPerUnit: p.servesPerUnit }))
  ), [products, cart]);

  const dateWarning = useMemo(() => {
    if (!fulfillment.date) return null;
    if (fulfillment.date < earliestDateStr) return `Date too early — choose ${earliestDateStr} or later`;
    return null;
  }, [fulfillment.date, earliestDateStr]);

  useEffect(() => {
    if (deliveryDisabled && fulfillment.type === 'delivery') setFulfillmentState((p) => ({ ...p, type: 'pickup' }));
  }, [deliveryDisabled]);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setCartState((prev) => { const next = { ...prev }; if (quantity <= 0) delete next[variantId]; else next[variantId] = quantity; return next; });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCartState((prev) => {
      const next = { ...prev };
      if (product.variants.length > 0) { for (const v of product.variants) delete next[v.id]; } else delete next[productId];
      return next;
    });
  }, [products]);

  const setFulfillment = useCallback((patch: Partial<CateringFulfillment>) => {
    setFulfillmentState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearCart = useCallback(() => { setCartState({}); setFulfillmentState(DEFAULT_FULFILLMENT); }, []);

  return (
    <CateringCartContext.Provider value={{
      cart, fulfillment, products, typeSettings, deliveryMinForAnyday, closedPickupDays,
      cartGroups, totalQuantity, subtotal, hasMinViolation, deliveryDisabled,
      maxLeadTimeDays, earliestDateStr, latestDateStr, servesEstimate, dateWarning,
      setQuantity, removeProduct, setFulfillment, clearCart, locale,
    }}>
      {children}
    </CateringCartContext.Provider>
  );
}

export function useCateringCart() { return useContext(CateringCartContext); }
