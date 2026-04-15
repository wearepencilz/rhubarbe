'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useCakeCart } from '@/contexts/CakeCartContext';
import { useT } from '@/lib/i18n/useT';
import CakeCartPanel, { computeItemPrice } from '@/components/CakeCartPanel';

export default function CakeCartSlotRegistrar() {
  const { registerSlot, unregisterSlot } = useCartDrawer();
  const { items, fulfillment, clearCart } = useCakeCart();
  const { locale } = useT();
  const isFr = locale === 'fr';

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/storefront/cake-products').then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  const freshPrice = (item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) return item.computedPrice ?? 0;
    return computeItemPrice(item, product) ?? 0;
  };

  const stateRef = useRef({ items, fulfillment, locale, isFr, checkoutLoading, checkoutError, freshPrice });
  stateRef.current = { items, fulfillment, locale, isFr, checkoutLoading, checkoutError, freshPrice };

  const handleCheckout = async () => {
    const s = stateRef.current;
    if (!s.items.length || !s.fulfillment.pickupDate) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/checkout/cake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: s.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            shopifyProductId: '',
            variantId: item.productId,
            variantLabel: `${item.size} ${s.isFr ? 'invités' : 'guests'}`,
            shopifyVariantId: '',
            sizeValue: item.size,
            flavourHandle: item.flavourHandles[0] || 'default',
            quantity: 1,
            price: s.freshPrice(item),
          })),
          pickupDate: `${s.fulfillment.pickupDate}T00:00:00`,
          numberOfPeople: s.items.reduce((sum, i) => sum + (parseInt(i.size) || 0), 0),
          eventType: s.fulfillment.eventType,
          specialInstructions: s.fulfillment.specialInstructions || null,
          fulfillmentType: s.fulfillment.fulfillmentType,
          deliveryAddress: s.fulfillment.fulfillmentType === 'delivery' ? s.fulfillment.deliveryAddress || null : null,
          locale: s.locale,
          calculatedPrice: s.items.reduce((sum, i) => sum + s.freshPrice(i), 0),
          selectedFlavours: s.items.flatMap((i) => i.flavourHandles),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data.error || 'Checkout failed'); return; }
      clearCart();
      window.location.href = data.checkoutUrl;
    } catch { setCheckoutError('Network error'); }
    finally { setCheckoutLoading(false); }
  };

  const handleCheckoutRef = useRef(handleCheckout);
  handleCheckoutRef.current = handleCheckout;

  useEffect(() => {
    registerSlot('cake', {
      label: { en: 'Cake', fr: 'Gâteaux' },
      renderContent: () => (
        <CakeCartPanel
          onCheckout={handleCheckoutRef.current}
          checkoutLoading={stateRef.current.checkoutLoading}
          checkoutError={stateRef.current.checkoutError}
          locale={stateRef.current.locale}
        />
      ),
      renderFooter: () => {
        const s = stateRef.current;
        if (!s.items.length) return null;
        const total = s.items.reduce((sum, i) => sum + s.freshPrice(i), 0);
        return (
          <button onClick={handleCheckoutRef.current} disabled={s.checkoutLoading || !s.fulfillment.pickupDate}
            className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[14px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6">
            <span>{s.checkoutLoading ? (s.isFr ? 'Chargement…' : 'Loading…') : (s.isFr ? 'Passer à la caisse' : 'Checkout')}</span>
            <span>{total > 0 ? `$${(total/100).toFixed(2)}` : ''}</span>
          </button>
        );
      },
    });
    return () => unregisterSlot('cake');
  }, []);

  return null;
}
