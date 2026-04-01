'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';

interface ThankYouLocale {
  heading: string;
  message: string;
  pickupReminder: string;
  backToMenu: string;
  orderSummary: string;
  pickupDetails: string;
  items: string;
  subtotal: string;
  date: string;
  location: string;
  timeSlot: string;
  menu: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  menu: string;
  pickupDate: string;
  pickupLocation: string;
  pickupSlot: string;
  items: OrderItem[];
  subtotal: number;
}

interface ThankYouClientProps {
  en: ThankYouLocale;
  fr: ThankYouLocale;
}

const STORAGE_KEY = 'rhubarbe_order';

export default function ThankYouClient({ en, fr }: ThankYouClientProps) {
  const { locale } = useLocale();
  const { clearCart } = useCart();
  const clearedRef = useRef(false);
  const [order, setOrder] = useState<OrderData | null>(null);

  const s = locale === 'fr' ? fr : en;

  // Load order from sessionStorage and clear cart once
  useEffect(() => {
    if (clearedRef.current) return;
    clearedRef.current = true;

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setOrder(JSON.parse(raw));
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {}

    clearCart();

    // Clear all order-type-specific persisted carts
    try {
      localStorage.removeItem('rhubarbe:order:cart');
      localStorage.removeItem('rhubarbe:order:launchId');
      localStorage.removeItem('rhubarbe:order:slotId');
      localStorage.removeItem('rhubarbe:order:pickupDay');
      localStorage.removeItem('rhubarbe:volume:cart');
      localStorage.removeItem('rhubarbe:cake:cart');
      localStorage.removeItem('rhubarbe:checkout:state');
    } catch {}
  }, [clearCart]);

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-screen-md mx-auto">
      {/* Checkmark */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <h1
        className="text-2xl md:text-3xl text-center uppercase tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}
      >
        {s.heading}
      </h1>

      <p className="text-center text-gray-600 mb-2 max-w-md mx-auto">
        {s.message}
      </p>
      <p className="text-center text-sm text-gray-500 mb-10 max-w-md mx-auto">
        {s.pickupReminder}
      </p>

      {/* Order details */}
      {order && (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Pickup details */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2
              className="text-xs uppercase tracking-widest text-gray-400"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {s.pickupDetails}
            </h2>

            {order.menu && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {s.menu}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{order.menu}</p>
              </div>
            )}

            {order.pickupDate && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {s.date}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{order.pickupDate}</p>
              </div>
            )}

            {order.pickupLocation && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {s.location}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{order.pickupLocation}</p>
              </div>
            )}

            {order.pickupSlot && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {s.timeSlot}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{order.pickupSlot}</p>
              </div>
            )}
          </div>

          {/* Items */}
          {order.items.length > 0 && (
            <div className="space-y-4">
              <h2
                className="text-xs uppercase tracking-widest text-gray-400"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {s.items}
              </h2>

              <div className="divide-y divide-gray-100">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                        {item.quantity} × ${(item.price / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {order.subtotal > 0 && (
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-sm text-gray-500">{s.subtotal}</span>
                  <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${(order.subtotal / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/order"
          className="inline-block text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          {s.backToMenu}
        </Link>
      </div>
    </main>
  );
}
