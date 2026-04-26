'use client';

import { useState } from 'react';
import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import type { CartItemUnion, FulfillmentState } from '@/lib/checkout/types';
import OrderReviewSummary from './OrderReviewSummary';

interface ReviewStepProps {
  config: OrderTypeConfig;
  cartItems: CartItemUnion[];
  fulfillment: FulfillmentState;
  onBack: () => void;
  locale: string;
}

export default function ReviewStep({
  config,
  cartItems,
  fulfillment,
  onBack,
  locale,
}: ReviewStepProps) {
  const isFr = locale === 'fr';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedWarning, setSkippedWarning] = useState<string | null>(null);

  async function handleProceedToPayment() {
    setLoading(true);
    setError(null);
    setSkippedWarning(null);

    // Guard: pickup slot required for regular orders that have slots available
    const pickupSlots: unknown[] = (fulfillment as any).pickupSlots ?? [];
    if (
      config.orderType === 'regular' &&
      pickupSlots.length > 0 &&
      !fulfillment.pickupSlotId
    ) {
      setError(
        isFr
          ? 'Veuillez sélectionner un créneau de cueillette avant de continuer.'
          : 'Please select a pickup slot before proceeding.',
      );
      setLoading(false);
      return;
    }

    try {
      const payload = config.buildCheckoutPayload(cartItems, fulfillment, locale);
      const res = await fetch(config.checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const redirectUrl = data.checkoutUrl || data.invoiceUrl;

      if (res.ok && redirectUrl) {
        // Warn if some items were skipped (not linked to Shopify)
        if (data.skippedItems?.length > 0) {
          const names = data.skippedItems.join(', ');
          setSkippedWarning(
            isFr
              ? `Les produits suivants ne sont pas liés à Shopify et ont été exclus du paiement : ${names}`
              : `The following products are not linked to Shopify and were excluded from payment: ${names}`,
          );
          setLoading(false);
          // Still redirect after a short delay so user can see the warning
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 3000);
          return;
        }

        window.location.href = redirectUrl;
        return;
      }

      setError(
        data.error ??
          (isFr
            ? 'Une erreur est survenue. Veuillez réessayer.'
            : 'Something went wrong. Please try again.'),
      );
    } catch {
      setError(
        isFr
          ? 'Une erreur est survenue. Veuillez réessayer.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <OrderReviewSummary
        config={config}
        cartItems={cartItems}
        fulfillment={fulfillment}
        locale={locale}
      />

      {skippedWarning && (
        <div className="rounded-md bg-amber-50 ring-1 ring-amber-200/60 px-4 py-3">
          <p className="text-sm text-amber-700">{skippedWarning}</p>
          <p className="text-xs text-amber-500 mt-1">
            {isFr ? 'Redirection vers le paiement...' : 'Redirecting to payment...'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleProceedToPayment}
          disabled={loading}
          className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest hover:bg-[#444218] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          {loading && (
            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading
            ? isFr ? 'Traitement...' : 'Processing...'
            : isFr ? 'Procéder au paiement' : 'Proceed to Payment'}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full min-h-[44px] py-3 text-sm text-gray-500 underline disabled:opacity-50"
        >
          {isFr ? 'Retour' : 'Back'}
        </button>
      </div>
    </div>
  );
}
