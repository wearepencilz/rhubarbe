'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { parseDate, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import type { CartItemUnion, FulfillmentState, DeliveryAddress } from '@/lib/checkout/types';
import { isPickupDayDisabled } from '@/lib/utils/order-helpers';
import FulfillmentToggle from './FulfillmentToggle';
import AddressForm from './AddressForm';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

interface FulfillmentStepProps {
  config: OrderTypeConfig;
  cartItems: CartItemUnion[];
  fulfillment: FulfillmentState;
  onFulfillmentChange: (update: Partial<FulfillmentState>) => void;
  onNext: () => void;
  locale: string;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function FulfillmentStep({
  config,
  cartItems,
  fulfillment,
  onFulfillmentChange,
  onNext,
  locale,
}: FulfillmentStepProps) {
  const isFr = locale === 'fr';
  const [errors, setErrors] = useState<Record<string, string>>({});

  const earliest = useMemo(() => config.getEarliestDate(cartItems), [config, cartItems]);
  const earliestStr = toDateString(earliest);
  const minDateValue = parseDate(earliestStr);
  const disabledDays = useMemo(() => config.getDisabledPickupDays(), [config]);

  const pickupSlots: Array<{ id: string; startTime: string; endTime: string }> =
    (fulfillment as any).pickupSlots ?? [];
  const showSlots = config.orderType === 'regular' && pickupSlots.length > 0;

  const deliveryDisabled = config.isDeliveryDisabled(cartItems);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    // Date required
    if (!fulfillment.date) {
      errs.date = isFr ? 'La date est requise' : 'Date is required';
    } else if (fulfillment.date < earliestStr) {
      const formatted = isFr ? earliestStr : earliestStr;
      errs.date = isFr
        ? `La date doit être le ${formatted} ou après`
        : `Date must be on or after ${formatted}`;
    }

    // Address required for delivery
    if (fulfillment.fulfillmentType === 'delivery') {
      const addr = fulfillment.address;
      const requiredFields: (keyof DeliveryAddress)[] = ['street', 'city', 'province', 'postalCode'];
      for (const field of requiredFields) {
        if (!addr[field].trim()) {
          errs[`address.${field}`] = isFr ? "L'adresse est requise" : 'Address is required';
        }
      }
    }

    // Slot required for regular with slots
    if (showSlots && !fulfillment.pickupSlotId) {
      errs.pickupSlot = isFr
        ? 'Veuillez sélectionner un créneau'
        : 'Please select a pickup slot';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (validate()) {
      onNext();
    }
  }

  // Build address errors for AddressForm from our flat errors map
  const addressErrors: Partial<Record<keyof DeliveryAddress, string>> = {};
  if (errors['address.street']) addressErrors.street = errors['address.street'];
  if (errors['address.city']) addressErrors.city = errors['address.city'];
  if (errors['address.province']) addressErrors.province = errors['address.province'];
  if (errors['address.postalCode']) addressErrors.postalCode = errors['address.postalCode'];

  return (
    <div className="space-y-6">
      {/* Fulfillment toggle */}
      {config.supportsFulfillmentToggle && (
        <FulfillmentToggle
          value={fulfillment.fulfillmentType}
          onChange={(type) => onFulfillmentChange({ fulfillmentType: type })}
          deliveryDisabled={deliveryDisabled}
          deliveryDisabledMessage={deliveryDisabled ? config.deliveryDisabledReason(locale) : undefined}
          locale={locale}
        />
      )}

      {/* Date picker */}
      <div>
        <DatePickerField
          label={isFr ? 'Date' : 'Date'}
          value={fulfillment.date ? parseDate(fulfillment.date) : null}
          minValue={minDateValue}
          isDateUnavailable={(date: DateValue) =>
            isPickupDayDisabled(date.toDate(getLocalTimeZone()), disabledDays)
          }
          onChange={(val: DateValue | null) => {
            if (val) {
              const y = val.year;
              const m = String(val.month).padStart(2, '0');
              const d = String(val.day).padStart(2, '0');
              onFulfillmentChange({ date: `${y}-${m}-${d}` });
            } else {
              onFulfillmentChange({ date: '' });
            }
          }}
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>

      {/* Pickup slot selector for Regular orders */}
      {showSlots && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            {isFr ? 'Créneau de cueillette' : 'Pickup slot'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {pickupSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => onFulfillmentChange({ pickupSlotId: slot.id })}
                className={`py-3 px-3 text-sm rounded border transition-colors ${
                  fulfillment.pickupSlotId === slot.id
                    ? 'bg-[#333112] text-white border-[#333112]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {slot.startTime} – {slot.endTime}
              </button>
            ))}
          </div>
          {errors.pickupSlot && (
            <p className="text-red-500 text-xs mt-1">{errors.pickupSlot}</p>
          )}
        </div>
      )}

      {/* Address form for delivery */}
      {fulfillment.fulfillmentType === 'delivery' && (
        <AddressForm
          address={fulfillment.address}
          onChange={(address) => onFulfillmentChange({ address })}
          errors={addressErrors}
          locale={locale}
        />
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest hover:bg-[#444218] transition-colors"
        style={{ fontFamily: 'var(--font-diatype-mono)' }}
      >
        {isFr ? 'Continuer vers la révision' : 'Continue to Review'}
      </button>
    </div>
  );
}
