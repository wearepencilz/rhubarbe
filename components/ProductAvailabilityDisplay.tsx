'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';

interface AvailabilityResult {
  orderable: boolean;
  availabilityMode: string;
  cutoffDatetime: string | null;
  pickupDates: string[];
  locations: { id: string; label: string }[];
  slots: { start: string; end: string; remaining: number }[];
  quantityRules: { min: number; max: number | null; step: number };
  messages: { en: string; fr: string };
}

interface Props {
  productId: string;
  onAvailabilityChange?: (result: AvailabilityResult | null) => void;
  onSelectionChange?: (selection: {
    pickupDate: string | null;
    locationId: string | null;
    slot: string | null;
    quantity: number;
  }) => void;
}

export default function ProductAvailabilityDisplay({ productId, onAvailabilityChange, onSelectionChange }: Props) {
  const { locale } = useT();
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchAvailability();
  }, [productId]);

  useEffect(() => {
    onSelectionChange?.({ pickupDate: selectedDate, locationId: selectedLocation, slot: selectedSlot, quantity });
  }, [selectedDate, selectedLocation, selectedSlot, quantity]);

  async function fetchAvailability() {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/availability`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
        onAvailabilityChange?.(data);
        if (data.quantityRules) setQuantity(data.quantityRules.min);
        if (data.pickupDates?.length === 1) setSelectedDate(data.pickupDates[0]);
        if (data.locations?.length === 1) setSelectedLocation(data.locations[0].id);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const adjustQuantity = (delta: number) => {
    if (!availability?.quantityRules) return;
    const { min, max, step } = availability.quantityRules;
    const next = quantity + delta * step;
    if (next >= min && (max === null || next <= max)) setQuantity(next);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3" role="status" aria-label="Loading availability">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600" />
        <span className="text-sm text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading availability...'}</span>
      </div>
    );
  }

  if (error || !availability) {
    return (
      <div className="py-3">
        <p className="text-sm text-gray-500">{locale === 'fr' ? 'Disponibilité non disponible' : 'Availability information unavailable'}</p>
      </div>
    );
  }

  if (!availability.orderable) {
    return (
      <div className="py-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          {locale === 'fr' ? 'Non disponible' : 'Not available'}
        </div>
        {availability.messages && (
          <p className="text-xs text-gray-500 mt-2">{locale === 'fr' ? availability.messages.fr : availability.messages.en}</p>
        )}
      </div>
    );
  }

  const msg = availability.messages ? (locale === 'fr' ? availability.messages.fr : availability.messages.en) : null;

  return (
    <div className="space-y-4 py-3">
      {/* Status */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        {locale === 'fr' ? 'Disponible' : 'Available'}
      </div>

      {/* Cutoff countdown */}
      {availability.cutoffDatetime && (
        <p className="text-xs text-gray-500">
          {locale === 'fr' ? 'Commander avant le ' : 'Order by '}
          {new Date(availability.cutoffDatetime).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
            month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {msg && <p className="text-xs text-gray-600">{msg}</p>}

      {/* Pickup date selector */}
      {availability.pickupDates.length > 1 && (
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {locale === 'fr' ? 'Date de cueillette' : 'Pickup date'}
          </label>
          <div className="flex flex-wrap gap-2">
            {availability.pickupDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                  selectedDate === date ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                }`}
              >
                {new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location selector */}
      {availability.locations.length > 1 && (
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {locale === 'fr' ? 'Point de cueillette' : 'Pickup location'}
          </label>
          <div className="flex flex-wrap gap-2">
            {availability.locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc.id)}
                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                  selectedLocation === loc.id ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slot selector */}
      {availability.slots.length > 0 && (
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {locale === 'fr' ? 'Créneau horaire' : 'Time slot'}
          </label>
          <div className="flex flex-wrap gap-2">
            {availability.slots.map((slot) => (
              <button
                key={`${slot.start}-${slot.end}`}
                onClick={() => setSelectedSlot(`${slot.start}-${slot.end}`)}
                disabled={slot.remaining <= 0}
                className={`px-3 py-1.5 border rounded text-sm transition-colors ${
                  selectedSlot === `${slot.start}-${slot.end}` ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                } ${slot.remaining <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {slot.start} – {slot.end}
                {slot.remaining <= 3 && slot.remaining > 0 && (
                  <span className="ml-1 text-xs text-orange-600">({slot.remaining})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity controls */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {locale === 'fr' ? 'Quantité' : 'Quantity'}
        </label>
        <div className="inline-flex items-center border border-gray-300 rounded">
          <button
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= availability.quantityRules.min}
            className="px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={locale === 'fr' ? 'Diminuer la quantité' : 'Decrease quantity'}
          >
            −
          </button>
          <span className="px-4 py-1.5 text-sm border-x border-gray-300 min-w-[3rem] text-center" aria-live="polite">
            {quantity}
          </span>
          <button
            onClick={() => adjustQuantity(1)}
            disabled={availability.quantityRules.max !== null && quantity >= availability.quantityRules.max}
            className="px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={locale === 'fr' ? 'Augmenter la quantité' : 'Increase quantity'}
          >
            +
          </button>
        </div>
        {availability.quantityRules.step > 1 && (
          <p className="text-xs text-gray-400 mt-1">
            {locale === 'fr' ? `Par multiples de ${availability.quantityRules.step}` : `In multiples of ${availability.quantityRules.step}`}
          </p>
        )}
      </div>
    </div>
  );
}
