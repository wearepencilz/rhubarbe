'use client';

import dynamic from 'next/dynamic';
import type { DateValue } from 'react-aria-components';
import { today, getLocalTimeZone } from '@internationalized/date';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

interface CartFulfillmentSectionProps {
  locale: string;
  fulfillmentType: 'pickup' | 'delivery';
  onFulfillmentTypeChange: (type: 'pickup' | 'delivery') => void;
  pickupDisabled?: boolean;
  deliveryDisabled?: boolean;
  date: string;
  onDateChange: (d: string) => void;
  dateValue: DateValue | null;
  minDateValue?: DateValue;
  maxDateValue?: DateValue;
  isDateUnavailable?: (date: DateValue) => boolean;
  dateWarning: string | null;
  noDateError?: boolean;
  noDateErrorText?: string;
  dateLabel?: string;
  dateHint?: string;
  deliveryAddress?: string;
  onDeliveryAddressChange?: (a: string) => void;
  showDeliveryAddress?: boolean;
  allergenNote?: string;
  onAllergenNoteChange?: (n: string) => void;
  allergenLabel?: string;
  allergenPlaceholder?: string;
  // Cake-specific
  eventType?: string;
  onEventTypeChange?: (t: string) => void;
  eventTypeLabel?: string;
  eventOptions?: { birthday: string; wedding: string; corporate: string; other: string };
  selectEventText?: string;
  showEventType?: boolean;
  specialInstructions?: string;
  onSpecialInstructionsChange?: (s: string) => void;
  specialInstructionsLabel?: string;
  specialInstructionsPlaceholder?: string;
  checkoutError?: string | null;
}

function toDateString(val: DateValue): string {
  return `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`;
}

export default function CartFulfillmentSection({
  locale, fulfillmentType, onFulfillmentTypeChange,
  pickupDisabled, deliveryDisabled,
  date, onDateChange, dateValue, minDateValue, maxDateValue, isDateUnavailable,
  dateWarning, noDateError, noDateErrorText, dateLabel, dateHint,
  deliveryAddress, onDeliveryAddressChange, showDeliveryAddress,
  allergenNote, onAllergenNoteChange, allergenLabel, allergenPlaceholder,
  eventType, onEventTypeChange, eventTypeLabel, eventOptions, selectEventText, showEventType,
  specialInstructions, onSpecialInstructionsChange, specialInstructionsLabel, specialInstructionsPlaceholder,
  checkoutError,
}: CartFulfillmentSectionProps) {
  const isFr = locale === 'fr';

  return (
    <div className="space-y-4">
      {/* Pickup / Delivery toggle */}
      <div className="flex gap-2">
        {(['pickup', 'delivery'] as const).map((type) => (
          <button key={type} type="button"
            onClick={() => onFulfillmentTypeChange(type)}
            disabled={type === 'pickup' ? pickupDisabled : deliveryDisabled}
            className={`flex-1 py-2 rounded-full border transition-colors ${
              fulfillmentType === type
                ? 'border-white bg-white text-[#0065B6]'
                : 'border-white text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {type === 'pickup' ? (isFr ? 'Cueillette' : 'Pickup') : (isFr ? 'Livraison' : 'Delivery')}
          </button>
        ))}
      </div>

      {/* Delivery address */}
      {showDeliveryAddress && fulfillmentType === 'delivery' && onDeliveryAddressChange && (
        <div className="flex flex-col gap-1">
          <label>{isFr ? 'Adresse de livraison' : 'Delivery address'}</label>
          <textarea value={deliveryAddress ?? ''} onChange={(e) => onDeliveryAddressChange(e.target.value)} rows={2}
            className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none resize-none bg-transparent text-white placeholder:text-white/30"
            placeholder={isFr ? "Entrez l'adresse de livraison" : 'Enter delivery address'} />
        </div>
      )}

      {/* Date — label left, input right */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p>{dateLabel ?? (isFr ? 'Date' : 'Date')}</p>
            {noDateError && noDateErrorText && (
              <span className="text-[12px]" style={{ color: '#EBE000' }}>{noDateErrorText}</span>
            )}
          </div>
          {dateHint && <p className="text-[11px] mt-1">{dateHint}</p>}
        </div>
        <DatePickerField
          value={dateValue}
          minValue={minDateValue ?? today(getLocalTimeZone())}
          maxValue={maxDateValue ?? undefined}
          isDateUnavailable={isDateUnavailable}
          onChange={(val: DateValue | null) => {
            onDateChange(val ? toDateString(val) : '');
          }}
        />
      </div>
      {dateWarning && <p className="text-[12px]" style={{ color: '#EBE000' }} role="alert">{dateWarning}</p>}

      {/* Event type (cake only) */}
      {showEventType && onEventTypeChange && eventOptions && (
        <div className="flex flex-col gap-1">
          <label>{eventTypeLabel}</label>
          <select value={eventType ?? ''} onChange={(e) => onEventTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-white rounded-full focus:outline-none bg-transparent">
            <option value="">{selectEventText}</option>
            <option value="birthday">{eventOptions.birthday}</option>
            <option value="wedding">{eventOptions.wedding}</option>
            <option value="corporate">{eventOptions.corporate}</option>
            <option value="other">{eventOptions.other}</option>
          </select>
        </div>
      )}

      {/* Notes */}
      {onSpecialInstructionsChange && (
        <div className="flex flex-col gap-1">
          <label>{specialInstructionsLabel}</label>
          <textarea value={specialInstructions ?? ''} onChange={(e) => onSpecialInstructionsChange(e.target.value)} rows={2}
            className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none resize-none bg-transparent text-white placeholder:text-white/30"
            placeholder={specialInstructionsPlaceholder} />
        </div>
      )}

      {/* Allergen note (catering) */}
      {onAllergenNoteChange && (
        <div className="flex flex-col gap-1">
          <label>{allergenLabel}</label>
          <textarea value={allergenNote ?? ''} onChange={(e) => onAllergenNoteChange(e.target.value)} rows={2}
            className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none resize-none bg-transparent text-white placeholder:text-white/30"
            placeholder={allergenPlaceholder} />
        </div>
      )}

      {checkoutError && <p className="text-[12px]" style={{ color: '#EBE000' }}>{checkoutError}</p>}
    </div>
  );
}
