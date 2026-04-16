'use client';

import { useState, useMemo } from 'react';
import { useWeeklyCart } from '@/contexts/WeeklyCartContext';
import { generatePickupDays, isPickupDayDisabled } from '@/lib/utils/order-helpers';

const SELECT_STYLE = {
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '10px',
};

function toLocalDate(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatDate(iso: string, locale: string) {
  try { return toLocalDate(iso).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}
function formatPickupRange(launch: any, locale: string) {
  const { pickupWindowStart, pickupWindowEnd, pickupDate } = launch;
  if (!pickupWindowStart || !pickupWindowEnd) return formatDate(pickupDate, locale);
  const start = toLocalDate(pickupWindowStart); const end = toLocalDate(pickupWindowEnd);
  if (start.getTime() === end.getTime()) return formatDate(pickupWindowStart, locale);
  const loc = locale === 'fr' ? 'fr-CA' : 'en-CA';
  const s = start.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
  const e = end.toLocaleDateString(loc, { weekday: 'short', day: 'numeric' });
  return `${s} – ${e}`;
}

export default function WeeklyCartPanel({ onCheckout, checkoutLoading, checkoutError, locale }: {
  onCheckout: () => void; checkoutLoading: boolean; checkoutError: string | null; locale: string;
}) {
  const { cart, setCart, activeLaunch, selectedSlotId, setSelectedSlotId, selectedPickupDay, setSelectedPickupDay } = useWeeklyCart();
  const isFr = locale === 'fr';

  const availablePickupDays = useMemo(() => {
    if (!activeLaunch?.pickupWindowStart || !activeLaunch?.pickupWindowEnd) return [];
    const all = generatePickupDays(activeLaunch.pickupWindowStart, activeLaunch.pickupWindowEnd, activeLaunch.pickupDate);
    if (all.length <= 1) return [];
    const disabled = activeLaunch.pickupLocation?.disabledPickupDays ?? [];
    return all.filter((day) => !isPickupDayDisabled(new Date(day + 'T00:00:00'), disabled));
  }, [activeLaunch]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const getMax = (productId: string): number | null => {
    if (!activeLaunch) return null;
    const baseId = productId.includes('::') ? productId.split('::')[0] : productId;
    const lp = activeLaunch.products.find((p: any) => p.productId === baseId);
    return lp?.maxQuantityOverride ?? null;
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.productId !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) removeFromCart(productId);
    else {
      const max = getMax(productId);
      const clamped = max != null ? Math.min(qty, max) : qty;
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: clamped } : i));
    }
  };

  if (!cart.length) return (
    <div className="py-8 text-center">
      <p className="text-[16px]">{isFr ? 'Aucun article' : 'No items yet'}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        {cart.map((item) => {
          const max = getMax(item.productId);
          const atMax = max != null && item.quantity >= max;
          return (
          <div key={item.productId} className="flex items-center gap-3 py-3">
            {item.image && <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-white/10"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-[16px] text-white font-medium truncate">{item.name}</p>
              {item.variantLabel && <p className="text-[14px] text-white">{item.variantLabel}</p>}
            </div>
            <span className="text-[13px] text-white shrink-0">${(item.price/100).toFixed(2)}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border border-white text-white flex items-center justify-center text-sm hover:bg-white/20">
                {item.quantity <= 1 ? '×' : '−'}
              </button>
              <span className="text-white text-[14px] w-6 text-center">{item.quantity}{max != null ? `/${max}` : ''}</span>
              <button onClick={() => updateQty(item.productId, item.quantity + 1)} disabled={atMax}
                className="w-7 h-7 rounded-full border border-white text-white flex items-center justify-center text-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
            </div>
          </div>
          );
        })}
      </div>

      {activeLaunch && (
        <div className="border-t border-white pt-4 space-y-3">
          <div className="flex items-center justify-between text-[16px] text-white mb-16">
            <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
            <span className="font-medium">${(subtotal/100).toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[16px] text-white">Date</p>
            {availablePickupDays.length > 1 ? (
              <select value={selectedPickupDay || ''} onChange={(e) => setSelectedPickupDay(e.target.value)}
                className="appearance-none bg-transparent text-white text-[16px] focus:outline-none"
                style={{ backgroundImage: SELECT_STYLE.backgroundImage, backgroundPosition: 'right 0 center', backgroundRepeat: 'no-repeat', backgroundSize: '16px', paddingRight: 22 }}>
                <option value="">{isFr ? 'Sélectionner une date' : 'Select a date'}</option>
                {availablePickupDays.map((day) => <option key={day} value={day}>{formatDate(day, locale)}</option>)}
              </select>
            ) : (
              <span className="text-[16px] text-white">{formatPickupRange(activeLaunch, locale)}</span>
            )}
          </div>

          {activeLaunch.pickupSlots.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[16px] text-white">{isFr ? 'Créneau' : 'Time slot'}</p>
              <select value={selectedSlotId || ''} onChange={(e) => setSelectedSlotId(e.target.value)}
                className="appearance-none bg-transparent text-white text-[16px] focus:outline-none"
                style={{ backgroundImage: SELECT_STYLE.backgroundImage, backgroundPosition: 'right 0 center', backgroundRepeat: 'no-repeat', backgroundSize: '16px', paddingRight: 22 }}>
                <option value="">{isFr ? 'Sélectionner un créneau' : 'Select a time'}</option>
                {activeLaunch.pickupSlots.map((s) => <option key={s.id} value={s.id}>{s.startTime} – {s.endTime}</option>)}
              </select>
            </div>
          )}

          {checkoutError && <p className="text-[14px] text-red-300">{checkoutError}</p>}
        </div>
      )}
    </div>
  );
}
