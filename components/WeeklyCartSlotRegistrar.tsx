'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useWeeklyCart } from '@/contexts/WeeklyCartContext';
import { useT } from '@/lib/i18n/useT';
import WeeklyCartPanel from '@/components/WeeklyCartPanel';

export default function WeeklyCartSlotRegistrar() {
  const { registerSlot, unregisterSlot } = useCartDrawer();
  const { cart, activeLaunch, selectedSlotId, selectedPickupDay, setCartLaunchId } = useWeeklyCart();
  const { locale } = useT();
  const isFr = locale === 'fr';

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const stateRef = useRef({ cart, activeLaunch, selectedSlotId, selectedPickupDay, locale, isFr, checkoutLoading, checkoutError });
  stateRef.current = { cart, activeLaunch, selectedSlotId, selectedPickupDay, locale, isFr, checkoutLoading, checkoutError };

  const handleCheckout = async () => {
    const s = stateRef.current;
    if (!s.cart.length || !s.activeLaunch) return;
    if (s.activeLaunch.pickupSlots.length > 0 && !s.selectedSlotId) {
      setCheckoutError(s.isFr ? 'Veuillez sélectionner un créneau.' : 'Please select a time slot.');
      return;
    }
    setCheckoutLoading(true); setCheckoutError(null);
    try {
      const launch = s.activeLaunch;
      const selectedSlot = launch.pickupSlots.find((sl) => sl.id === s.selectedSlotId) || null;
      const pickupDateFormatted = s.selectedPickupDay
        ? new Date(s.selectedPickupDay + 'T00:00:00').toLocaleDateString(s.locale === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
        : launch.pickupDate;
      const locationName = launch.pickupLocation ? (s.isFr ? launch.pickupLocation.publicLabel.fr : launch.pickupLocation.publicLabel.en) : '';

      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: s.cart.map((item) => ({
            productId: item.productId.includes('::') ? item.productId.split('::')[0] : item.productId,
            productName: item.name, shopifyProductId: null,
            shopifyVariantId: item.shopifyVariantId, quantity: item.quantity, price: item.price,
          })),
          launchId: launch.id,
          launchTitle: s.isFr ? launch.title?.fr : launch.title?.en,
          pickupDate: pickupDateFormatted,
          pickupLocationName: locationName,
          pickupLocationAddress: launch.pickupLocation?.address || '',
          pickupSlot: selectedSlot ? { startTime: selectedSlot.startTime, endTime: selectedSlot.endTime } : undefined,
          locale: s.locale,
        }),
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
    registerSlot('weekly', {
      label: { en: 'Weekly', fr: 'Hebdo' },
      renderContent: () => (
        <WeeklyCartPanel
          onCheckout={handleCheckoutRef.current}
          checkoutLoading={stateRef.current.checkoutLoading}
          checkoutError={stateRef.current.checkoutError}
          locale={stateRef.current.locale}
        />
      ),
      renderFooter: () => {
        const s = stateRef.current;
        if (!s.cart.length) return null;
        const subtotal = s.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return (
          <button onClick={handleCheckoutRef.current} disabled={s.checkoutLoading}
            className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[16px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-between px-6">
            <span>{s.checkoutLoading ? (s.isFr ? 'Chargement…' : 'Loading…') : (s.isFr ? 'Passer à la caisse' : 'Checkout')}</span>
            <span>${(subtotal/100).toFixed(2)}</span>
          </button>
        );
      },
    });
    return () => unregisterSlot('weekly');
  }, []);

  return null;
}
