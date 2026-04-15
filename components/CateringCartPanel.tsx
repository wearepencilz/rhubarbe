'use client';

import { useCateringCart } from '@/contexts/CateringCartContext';
import { VolumeInlineCart } from '@/app/catering/VolumeOrderPageClient';
import { useT } from '@/lib/i18n/useT';

const DEFAULT_TYPE_CONFIG = { orderScope: 'order' as const, orderMinimum: 1, variantMinimum: 0, increment: 1, unitLabel: 'quantity' as const, maxAdvanceDays: null, leadTimeTiers: [] };

export default function CateringCartPanel({ onCheckout, checkoutLoading, checkoutError }: {
  onCheckout: () => void; checkoutLoading: boolean; checkoutError: string | null;
}) {
  const {
    cartGroups, totalQuantity, subtotal, fulfillment, setFulfillment,
    hasMinViolation, deliveryDisabled, maxLeadTimeDays, earliestDateStr, latestDateStr,
    servesEstimate, dateWarning, deliveryMinForAnyday, closedPickupDays,
    setQuantity, removeProduct, typeSettings,
  } = useCateringCart();
  const { T, locale } = useT();
  const V = T.volumeOrder;

  return (
    <VolumeInlineCart
      groups={cartGroups} totalQuantity={totalQuantity} subtotal={subtotal}
      fulfillmentDate={fulfillment.date} fulfillmentTime={fulfillment.time}
      fulfillmentType={fulfillment.type} allergenNote={fulfillment.allergenNote}
      dateWarning={dateWarning} earliestDateStr={earliestDateStr}
      maxLeadTimeDays={maxLeadTimeDays} servesEstimate={servesEstimate}
      onDateChange={(d) => setFulfillment({ date: d })}
      onTimeChange={(t) => setFulfillment({ time: t })}
      onFulfillmentTypeChange={(t) => setFulfillment({ type: t })}
      onAllergenNoteChange={(n) => setFulfillment({ allergenNote: n })}
      onCheckout={onCheckout} onRemoveProduct={removeProduct} onQuantityChange={setQuantity}
      getTypeConfig={(g) => typeSettings[g.cateringType] ?? DEFAULT_TYPE_CONFIG}
      checkoutLoading={checkoutLoading} checkoutError={checkoutError}
      locale={locale} hasMinViolation={hasMinViolation} deliveryDisabled={deliveryDisabled}
      V={V} latestDateStr={latestDateStr}
      deliveryMinForAnyday={deliveryMinForAnyday} closedPickupDays={closedPickupDays}
    />
  );
}
