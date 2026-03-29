'use client';

interface FulfillmentToggleProps {
  value: 'pickup' | 'delivery';
  onChange: (type: 'pickup' | 'delivery') => void;
  deliveryDisabled: boolean;
  deliveryDisabledMessage?: string;
  locale: string;
}

export default function FulfillmentToggle({
  value,
  onChange,
  deliveryDisabled,
  deliveryDisabledMessage,
  locale,
}: FulfillmentToggleProps) {
  const isFr = locale === 'fr';
  const pickupLabel = isFr ? 'Cueillette' : 'Pickup';
  const deliveryLabel = isFr ? 'Livraison' : 'Delivery';
  const fulfillmentLabel = isFr ? 'Mode de livraison' : 'Fulfillment';

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
        {fulfillmentLabel}
      </p>
      <div className="flex rounded overflow-hidden border border-gray-300">
        {(['pickup', 'delivery'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            disabled={type === 'delivery' && deliveryDisabled}
            className={`flex-1 py-3 text-xs uppercase tracking-widest transition-colors ${
              value === type
                ? 'bg-[#333112] text-white'
                : type === 'delivery' && deliveryDisabled
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            {type === 'pickup' ? pickupLabel : deliveryLabel}
          </button>
        ))}
      </div>
      {deliveryDisabled && deliveryDisabledMessage && (
        <p className="text-xs text-gray-400 mt-1">{deliveryDisabledMessage}</p>
      )}
    </div>
  );
}
