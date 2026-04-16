'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useCakeCart } from '@/contexts/CakeCartContext';
import { useT } from '@/lib/i18n/useT';
import CakeCartPanel, { computeItemPrice } from '@/components/CakeCartPanel';
import { resolvePricingGridPrice } from '@/lib/utils/order-helpers';
import type { PricingGridRow } from '@/lib/utils/order-helpers';

export default function CakeCartSlotRegistrar() {
  const { registerSlot, unregisterSlot } = useCartDrawer();
  const { items, fulfillment, products, clearCart } = useCakeCart();
  const { locale } = useT();
  const isFr = locale === 'fr';

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const freshPrice = (item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) return item.computedPrice ?? 0;
    return computeItemPrice(item, product) ?? 0;
  };

  const stateRef = useRef({ items, fulfillment, locale, isFr, checkoutLoading, checkoutError, freshPrice, products });
  stateRef.current = { items, fulfillment, locale, isFr, checkoutLoading, checkoutError, freshPrice, products };

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
          items: s.items.flatMap((item) => {
            const product = s.products.find((p: any) => p.id === item.productId);
            const lines: any[] = [{
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
            }];
            if (!product) return lines;
            const addons = product.addons ?? [];
            const sheetAddon = addons.find((a: any) => a.cakeProductType === 'sheet-cake');
            // Sheet cake as separate line item
            if (sheetAddon && item.addonIds.includes(sheetAddon.id) && item.sheetCakeFlavour) {
              const sheetSize = item.addonSizes[sheetAddon.id];
              if (sheetSize) {
                const sizes = sheetAddon.pricingGrid.map((r: PricingGridRow) => r.sizeValue).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
                const nums = sizes.map((sv: string) => ({ sv, n: parseInt(sv) })).filter((x: any) => !isNaN(x.n)).sort((a: any, b: any) => b.n - a.n);
                const resolved = nums.find((x: any) => x.n <= parseInt(sheetSize))?.sv;
                if (resolved) {
                  const sp = resolvePricingGridPrice(sheetAddon.pricingGrid, resolved, item.sheetCakeFlavour);
                  lines.push({
                    productId: sheetAddon.id, productName: sheetAddon.name || 'Sheet Cake',
                    shopifyProductId: '', variantId: sheetAddon.id, variantLabel: `${sheetSize} guests`,
                    shopifyVariantId: sp?.shopifyVariantId || '', sizeValue: resolved,
                    flavourHandle: item.sheetCakeFlavour, quantity: 1,
                    price: sp?.priceInCents || 0, isAddon: true,
                  });
                  // Sheet cake's own addons
                  for (const rid of item.sheetCakeAddonIds) {
                    const ra = addons.find((a: any) => a.id === rid && a.cakeProductType !== 'sheet-cake');
                    if (!ra) continue;
                    const rp = resolvePricingGridPrice(ra.pricingGrid, resolved, 'default');
                    if (rp) lines.push({
                      productId: ra.id, productName: ra.name, shopifyProductId: '',
                      variantId: ra.id, variantLabel: '', shopifyVariantId: rp.shopifyVariantId || '',
                      sizeValue: resolved, flavourHandle: 'default', quantity: 1,
                      price: rp.priceInCents, isAddon: true,
                    });
                  }
                }
              }
            }
            return lines;
          }),
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
        const allAllergens = new Set<string>();
        for (const item of s.items) {
          const product = s.products.find((p: any) => p.id === item.productId);
          if (!product) continue;
          (product.allergens ?? []).forEach((a: string) => allAllergens.add(a));
          for (const h of item.flavourHandles) {
            const f = product.cakeFlavourConfig?.find((fl: any) => fl.handle === h);
            f?.allergens?.forEach((a: string) => allAllergens.add(a));
          }
        }
        return (
          <div>
            {allAllergens.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-[12px] shrink-0">{s.isFr ? 'Peut contenir' : 'May contain'}</span>
                {Array.from(allAllergens).map((a) => <span key={a} className="px-2 py-0.5 rounded-full text-[11px] border border-white">{a}</span>)}
              </div>
            )}
            <button onClick={handleCheckoutRef.current} disabled={s.checkoutLoading || !s.fulfillment.pickupDate}
              className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[14px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6">
              <span>{s.checkoutLoading ? (s.isFr ? 'Chargement…' : 'Loading…') : (s.isFr ? 'Passer à la caisse' : 'Checkout')}</span>
              <span>{total > 0 ? `$${(total/100).toFixed(2)}` : ''}</span>
            </button>
          </div>
        );
      },
    });
    return () => unregisterSlot('cake');
  }, [fulfillment.pickupDate, items.length, items, products.length, checkoutLoading]);

  return null;
}
