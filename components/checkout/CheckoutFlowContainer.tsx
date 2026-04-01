'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { usePersistedState } from '@/lib/hooks/use-persisted-state';
import type { CheckoutStep, FulfillmentState, CartItemUnion } from '@/lib/checkout/types';
import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import { regularOrderConfig } from '@/lib/checkout/configs/regular';
import { volumeOrderConfig } from '@/lib/checkout/configs/volume';
import { cakeOrderConfig } from '@/lib/checkout/configs/cake';
import FulfillmentStep from './FulfillmentStep';
import ReviewStep from './ReviewStep';
import OrderReviewSummary from './OrderReviewSummary';

interface CheckoutFlowProps {
  orderType: 'regular' | 'volume' | 'cake';
}

const configMap: Record<string, OrderTypeConfig> = {
  regular: regularOrderConfig,
  volume: volumeOrderConfig,
  cake: cakeOrderConfig,
};

const cartKeys: Record<string, string> = {
  regular: 'rhubarbe:order:cart',
  volume: 'rhubarbe:volume:cart',
  cake: 'rhubarbe:cake:cart',
};

const orderPaths: Record<string, string> = {
  regular: '/order',
  volume: '/catering',
  cake: '/cake',
};

const defaultFulfillment: FulfillmentState = {
  fulfillmentType: 'pickup',
  date: '',
  pickupSlotId: null,
  pickupDay: null,
  address: { street: '', city: '', province: '', postalCode: '' },
  allergenNote: '',
  eventType: '',
  specialInstructions: '',
  numberOfPeople: 0,
};

export default function CheckoutFlowContainer({ orderType }: CheckoutFlowProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const isFr = locale === 'fr';

  const config = configMap[orderType];
  const [cartItems, setCartItems] = useState<CartItemUnion[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('fulfillment');

  const [fulfillment, setFulfillment] = usePersistedState<FulfillmentState>(
    'rhubarbe:checkout:state',
    defaultFulfillment,
  );

  // Read cart items from localStorage on mount
  useEffect(() => {
    try {
      // Volume and cake orders save full checkout items to a dedicated key
      const checkoutItemsKey: Record<string, string> = {
        volume: 'rhubarbe:volume:checkout-items',
        cake: 'rhubarbe:cake:cart',
      };

      const key = checkoutItemsKey[orderType] ?? cartKeys[orderType];
      const raw = localStorage.getItem(key);

      // Fallback to the main cart key if checkout-items not found
      const fallbackRaw = !raw && orderType !== 'regular'
        ? localStorage.getItem(cartKeys[orderType])
        : null;

      const source = raw || fallbackRaw;
      if (!source) {
        router.replace(orderPaths[orderType]);
        return;
      }

      const items: CartItemUnion[] = JSON.parse(source) as CartItemUnion[];

      if (!Array.isArray(items) || items.length === 0) {
        router.replace(orderPaths[orderType]);
        return;
      }

      setCartItems(items);
      setCartLoaded(true);
    } catch {
      router.replace(orderPaths[orderType]);
    }
  }, [orderType, router]);

  const handleFulfillmentChange = useCallback(
    (update: Partial<FulfillmentState>) => {
      setFulfillment((prev) => ({ ...prev, ...update }));
    },
    [setFulfillment],
  );

  const handleNext = useCallback(() => setCurrentStep('review'), []);
  const handleBack = useCallback(() => setCurrentStep('fulfillment'), []);

  // Don't render until cart is loaded and validated
  if (!cartLoaded) return null;

  const stepLabel =
    currentStep === 'fulfillment'
      ? isFr ? 'Étape 1 — Livraison' : 'Step 1 — Fulfillment'
      : isFr ? 'Étape 2 — Révision' : 'Step 2 — Review';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Step indicator */}
      <p
        className="text-xs uppercase tracking-widest text-gray-500 mb-6"
        style={{ fontFamily: 'var(--font-diatype-mono)' }}
      >
        {stepLabel}
      </p>

      <div className="md:grid md:grid-cols-[1fr_360px] md:gap-8">
        {/* Main flow column */}
        <div>
          {currentStep === 'fulfillment' && (
            <FulfillmentStep
              config={config}
              cartItems={cartItems}
              fulfillment={fulfillment}
              onFulfillmentChange={handleFulfillmentChange}
              onNext={handleNext}
              locale={locale}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              config={config}
              cartItems={cartItems}
              fulfillment={fulfillment}
              onBack={handleBack}
              locale={locale}
            />
          )}
        </div>

        {/* Sidebar summary — desktop only */}
        <aside className="hidden md:block">
          <div className="sticky top-8 rounded border border-gray-200 p-5">
            <OrderReviewSummary
              config={config}
              cartItems={cartItems}
              fulfillment={fulfillment}
              locale={locale}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
