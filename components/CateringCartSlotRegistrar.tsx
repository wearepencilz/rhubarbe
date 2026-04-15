'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useCateringCart } from '@/contexts/CateringCartContext';
import { useT } from '@/lib/i18n/useT';
import CateringCartPanel from '@/components/CateringCartPanel';

export default function CateringCartSlotRegistrar() {
  const { registerSlot, unregisterSlot } = useCartDrawer();
  const { totalQuantity, subtotal, fulfillment, hasMinViolation, dateWarning, cartGroups, locale: ctxLocale } = useCateringCart();
  const { locale } = useT();
  const isFr = locale === 'fr';

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const stateRef = useRef({ totalQuantity, subtotal, fulfillment, hasMinViolation, dateWarning, cartGroups, locale, isFr, checkoutLoading, checkoutError });
  stateRef.current = { totalQuantity, subtotal, fulfillment, hasMinViolation, dateWarning, cartGroups, locale, isFr, checkoutLoading, checkoutError };

  const handleCheckout = async () => {
    const s = stateRef.current;
    if (!s.totalQuantity || !s.fulfillment.date) return;
    setCheckoutLoading(true); setCheckoutError(null);
    try {
      const isoDate = s.fulfillment.time ? `${s.fulfillment.date}T${s.fulfillment.time}:00` : `${s.fulfillment.date}T00:00:00`;
      const items = s.cartGroups.flatMap((g) => g.variants.map((v) => ({
        productId: g.productId, productName: g.productName, shopifyProductId: g.shopifyProductId,
        variantId: v.variantId, variantLabel: v.variantLabel || g.productName,
        shopifyVariantId: v.shopifyVariantId, quantity: v.quantity, price: v.price,
      })));
      const cateringTypes = [...new Set(s.cartGroups.map((g) => g.cateringType).filter(Boolean))];
      const res = await fetch('/api/checkout/volume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, fulfillmentDate: isoDate, fulfillmentType: s.fulfillment.type, allergenNote: s.fulfillment.allergenNote.trim() || null, locale: s.locale, cateringTypes }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data.error || 'Checkout failed'); return; }
      window.location.href = data.checkoutUrl;
    } catch { setCheckoutError('Network error'); }
    finally { setCheckoutLoading(false); }
  };

  const handleCheckoutRef = useRef(handleCheckout);
  handleCheckoutRef.current = handleCheckout;

  useEffect(() => {
    registerSlot('catering', {
      label: { en: 'Catering', fr: 'Traiteur' },
      renderContent: () => (
        <CateringCartPanel
          onCheckout={handleCheckoutRef.current}
          checkoutLoading={stateRef.current.checkoutLoading}
          checkoutError={stateRef.current.checkoutError}
        />
      ),
      renderFooter: () => {
        const s = stateRef.current;
        if (!s.totalQuantity) return null;
        return (
          <button onClick={handleCheckoutRef.current}
            disabled={s.checkoutLoading || !s.fulfillment.date || !!s.dateWarning || s.hasMinViolation}
            className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[16px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6">
            <span>{s.checkoutLoading ? (s.isFr ? 'Chargement…' : 'Loading…') : (s.isFr ? 'Passer à la caisse' : 'Checkout')}</span>
            <span>{s.subtotal > 0 ? `$${(s.subtotal/100).toFixed(2)}` : ''}</span>
          </button>
        );
      },
    });
    return () => unregisterSlot('catering');
  }, []);

  return null;
}
