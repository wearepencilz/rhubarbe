'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import dynamic from 'next/dynamic';
import { getActivePricingTier } from '@/lib/utils/order-helpers';
import MobileCartModal from '@/components/ui/MobileCartModal';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

// ── Types ──

interface TranslationObject {
  en: string;
  fr: string;
}

interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
}

interface PricingTier {
  minPeople: number;
  priceInCents: number;
  shopifyVariantId: string;
}

interface CakeProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number | null;
  shopifyProductId: string | null;
  cakeDescription: TranslationObject;
  cakeFlavourNotes: TranslationObject | null;
  cakeInstructions: TranslationObject;
  cakeMinPeople: number;
  shortCardCopy: string | null;
  allergens: string[];
  leadTimeTiers: LeadTimeTier[];
  pricingTiers: PricingTier[];
  serves: string | null;
  cakeDeliveryAvailable: boolean;
}

// ── Helpers ──

function tr(field: TranslationObject | null | undefined, locale: string): string {
  if (!field) return '';
  if (locale === 'fr') return field.fr || field.en || '';
  return field.en || '';
}

function getLeadTimeDays(tiers: LeadTimeTier[], numberOfPeople: number): number {
  const applicable = tiers
    .filter((t) => t.minPeople <= numberOfPeople)
    .sort((a, b) => b.minPeople - a.minPeople);
  return applicable[0]?.leadTimeDays ?? 0;
}

function getPriceFromTiers(tiers: PricingTier[], numberOfPeople: number): PricingTier | null {
  if (tiers.length === 0) return null;
  const applicable = tiers
    .filter((t) => t.minPeople <= numberOfPeople)
    .sort((a, b) => b.minPeople - a.minPeople);
  return applicable[0] ?? null;
}

function getEarliestDate(leadTimeDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + leadTimeDays);
  return d;
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toDateValue(dateStr: string): DateValue | null {
  if (!dateStr) return null;
  try { return parseDate(dateStr); } catch { return null; }
}

function formatDateHuman(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ── Product Card ──

function CakeProductCard({
  product, locale, isSelected, onSelect, brandColor, numberOfPeople, C,
}: {
  product: CakeProduct;
  locale: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  brandColor: string;
  numberOfPeople: number;
  C: Record<string, any>;
}) {
  const description = tr(product.cakeDescription, locale);
  const flavourNotes = tr(product.cakeFlavourNotes, locale);
  const isFr = locale === 'fr';
  const activeTier = getActivePricingTier(product.pricingTiers, numberOfPeople);

  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className={`group flex flex-col text-left transition-all rounded-lg overflow-hidden border border-gray-200 ${
        isSelected
          ? 'ring-2 ring-[#333112] ring-offset-2'
          : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
      }`}
      aria-pressed={isSelected}
      aria-label={`${product.name}${isSelected ? ` (${C.selected})` : ''}`}
    >
      {product.image ? (
        <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
          <img src={product.image} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {isSelected && (
            <div className="absolute top-2 right-2 bg-[#333112] text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {C.selected}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-[4/5] relative" style={{ backgroundColor: brandColor }}>
          {isSelected && (
            <div className="absolute top-2 right-2 bg-[#333112] text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {C.selected}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 px-2 pb-3">
        <h3 className="text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
          {product.name}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {activeTier && (
            <span>${(activeTier.priceInCents / 100).toFixed(2)}</span>
          )}
          {product.serves && (
            <span className="uppercase tracking-wider">
              {isFr ? `Pour ${product.serves}` : `Serves ${product.serves}`}
            </span>
          )}
        </div>

        {flavourNotes && (
          <p className="text-xs text-gray-500 italic">{flavourNotes}</p>
        )}

        {product.shortCardCopy && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{product.shortCardCopy}</p>
        )}

        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{description}</p>
        )}

        {/* Allergen badges */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.allergens.map((a) => (
              <span key={a}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200/60"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Pricing tiers preview */}
        {product.pricingTiers.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {C.pricingTitle}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {product.pricingTiers
                .slice()
                .sort((a, b) => a.minPeople - b.minPeople)
                .map((tier, i) => {
                  const isActive = activeTier && tier.minPeople === activeTier.minPeople && tier.priceInCents === activeTier.priceInCents;
                  return (
                    <span key={i} className={`text-[10px] tracking-wide ${
                      isActive
                        ? 'bg-[#333112]/10 text-gray-900 font-medium rounded px-1'
                        : 'text-gray-500'
                    }`}
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {tier.minPeople}+ → ${(tier.priceInCents / 100).toFixed(0)}
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {/* Min people — derived from first pricing tier */}
        {product.pricingTiers.length > 0 && (
          <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-1"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {C.minimum}: {product.pricingTiers[0].minPeople} {C.numberOfPeopleShort}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Inline Cart Sidebar ──

function CakeInlineCart({
  selectedProduct, numberOfPeople, calculatedPrice,
  pickupDate, eventType, specialInstructions,
  fulfillmentType, deliveryAddress,
  dateWarning, earliestDateStr, maxLeadTimeDays,
  onDateChange, onNumberOfPeopleChange, onEventTypeChange, onSpecialInstructionsChange,
  onFulfillmentTypeChange, onDeliveryAddressChange,
  onCheckout, onRemove, checkoutLoading, checkoutError,
  locale, belowMin, C,
}: {
  selectedProduct: CakeProduct | null;
  numberOfPeople: number;
  calculatedPrice: number | null;
  pickupDate: string;
  eventType: string;
  specialInstructions: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress: string;
  dateWarning: string | null;
  earliestDateStr: string;
  maxLeadTimeDays: number;
  onDateChange: (d: string) => void;
  onNumberOfPeopleChange: (n: number) => void;
  onEventTypeChange: (t: string) => void;
  onSpecialInstructionsChange: (s: string) => void;
  onFulfillmentTypeChange: (t: 'pickup' | 'delivery') => void;
  onDeliveryAddressChange: (a: string) => void;
  onCheckout: () => void;
  onRemove: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
  locale: string;
  belowMin: boolean;
  C: Record<string, any>;
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);
  const deliveryUnavailable = fulfillmentType === 'delivery' && selectedProduct != null && !selectedProduct.cakeDeliveryAvailable;

  return (
    <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {C.yourOrder}
        </h2>
      </div>

      {!selectedProduct ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">{C.noItems}</p>
          <p className="text-xs text-gray-300 mt-1">{C.startHint}</p>
        </div>
      ) : (
        <>
          {/* Selected product */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
            </div>
            <button onClick={onRemove}
              className="text-[11px] text-gray-400 underline hover:text-red-500 mt-1"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {isFr ? 'retirer' : 'remove'}
            </button>
            {calculatedPrice != null && (
              <p className="text-sm text-gray-900 font-medium mt-1"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                ${(calculatedPrice / 100).toFixed(2)}
              </p>
            )}
            {calculatedPrice == null && selectedProduct.pricingTiers.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">{C.noPricing}</p>
            )}
          </div>

          {/* Allergen summary */}
          {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="rounded-md bg-amber-50 ring-1 ring-amber-200/60 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-amber-600 mb-1.5"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {isFr ? 'Contient' : 'Contains'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedProduct.allergens.map((a) => (
                    <span key={a}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-white text-amber-700 ring-1 ring-amber-200/60"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 space-y-4">
            {/* Number of People */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {C.numberOfPeople}
              </label>
              <input type="number" min={1}
                value={numberOfPeople || ''}
                placeholder="1"
                onChange={(e) => onNumberOfPeopleChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors bg-transparent"
                aria-label={C.numberOfPeople} />
            </div>

            {/* Dynamic price display */}
            {calculatedPrice != null && (
              <div className="flex justify-between text-sm font-semibold">
                <span>{C.estTotal}</span>
                <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  ${(calculatedPrice / 100).toFixed(2)}
                </span>
              </div>
            )}
            <p className="text-[11px] text-gray-400">{C.taxNote}</p>

            <hr className="border-gray-200" />

            {/* Pickup / Delivery toggle */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {isFr ? 'Cueillette / Livraison' : 'Fulfillment'}
              </p>
              <div className="flex rounded overflow-hidden border border-gray-300">
                {(['pickup', 'delivery'] as const).map((type) => (
                  <button key={type} type="button"
                    onClick={() => onFulfillmentTypeChange(type)}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
                      fulfillmentType === type
                        ? 'bg-[#333112] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {type === 'pickup' ? (isFr ? 'Cueillette' : 'Pickup') : (isFr ? 'Livraison' : 'Delivery')}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery unavailable warning */}
            {deliveryUnavailable && (
              <p className="text-xs text-red-600" role="alert">
                {isFr
                  ? "La livraison n'est pas disponible pour ce gâteau."
                  : 'Delivery is not available for this cake.'}
              </p>
            )}

            {/* Delivery address */}
            {fulfillmentType === 'delivery' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  {isFr ? 'Adresse de livraison' : 'Delivery address'}
                </label>
                <textarea value={deliveryAddress}
                  onChange={(e) => onDeliveryAddressChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors resize-none bg-transparent"
                  placeholder={isFr ? 'Entrez l\'adresse de livraison' : 'Enter delivery address'} />
              </div>
            )}

            {/* Date */}
            <div>
              <DatePickerField
                label={C.date}
                value={toDateValue(pickupDate)}
                minValue={minDateValue ?? today(getLocalTimeZone())}
                onChange={(val: DateValue | null) => {
                  if (val) {
                    const y = val.year;
                    const m = String(val.month).padStart(2, '0');
                    const d = String(val.day).padStart(2, '0');
                    onDateChange(`${y}-${m}-${d}`);
                  } else {
                    onDateChange('');
                  }
                }}
              />
            </div>
            {/* Dynamic earliest date helper */}
            {maxLeadTimeDays > 0 && (
              <p className="text-[11px] text-gray-400 -mt-2"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {C.earliest}{' '}
                <span className="text-gray-600">{formatDateHuman(earliestDateStr, locale)}</span>
                {' '}({maxLeadTimeDays}{isFr ? 'j délai' : 'd lead'})
              </p>
            )}
            {dateWarning && (
              <p className="text-[11px] text-red-500 -mt-2" role="alert">{dateWarning}</p>
            )}

            {/* Date confirmation line */}
            {pickupDate && !dateWarning && (
              <p className="text-xs text-gray-600 font-medium -mt-2">
                {fulfillmentType === 'pickup'
                  ? `${isFr ? 'Cueillette' : 'Pickup'}: ${formatDateHuman(pickupDate, locale)}`
                  : `${isFr ? 'Livraison' : 'Delivery'}: ${formatDateHuman(pickupDate, locale)}`}
              </p>
            )}

            {/* Event Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {C.eventType}
              </label>
              <select value={eventType}
                onChange={(e) => onEventTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors bg-transparent"
                aria-label={C.eventType}>
                <option value="">{C.selectEvent}</option>
                <option value="birthday">{C.eventOptions.birthday}</option>
                <option value="wedding">{C.eventOptions.wedding}</option>
                <option value="corporate">{C.eventOptions.corporate}</option>
                <option value="other">{C.eventOptions.other}</option>
              </select>
            </div>

            {/* Special Instructions */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {C.specialInstructions}
              </label>
              <textarea value={specialInstructions}
                onChange={(e) => onSpecialInstructionsChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors resize-none bg-transparent"
                placeholder={C.specialInstructionsPlaceholder} />
            </div>

            {belowMin && (
              <p className="text-xs text-amber-600">{C.minWarning}</p>
            )}

            {!pickupDate && selectedProduct && (
              <p className="text-xs text-amber-600">{C.noDateError}</p>
            )}

            {checkoutError && (
              <p className="text-xs text-red-600">{checkoutError}</p>
            )}

            <button onClick={onCheckout}
              disabled={checkoutLoading || !pickupDate || !!dateWarning || belowMin || calculatedPrice == null || deliveryUnavailable}
              className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {checkoutLoading ? C.loading : C.checkout}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page Component ──

export default function CakeOrderPageClient() {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const C = T.cakeOrder;
  const { setCakeCount } = useOrderItems();

  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);

  const [pickupDate, setPickupDate] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#144437');
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Report cart count to nav
  useEffect(() => {
    setCakeCount(selectedProductId ? 1 : 0);
  }, [selectedProductId, setCakeCount]);

  // Fetch brand color from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data.brandColor) setBrandColor(data.brandColor); })
      .catch(() => {});
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  // Calculate price from pricing tiers
  const matchedTier = useMemo(() => {
    if (!selectedProduct) return null;
    return getPriceFromTiers(selectedProduct.pricingTiers, numberOfPeople);
  }, [selectedProduct, numberOfPeople]);

  const calculatedPrice = matchedTier?.priceInCents ?? null;

  // Lead time based on selected product and number of people
  const { maxLeadTimeDays, earliestDateStr } = useMemo(() => {
    if (!selectedProduct) return { maxLeadTimeDays: 0, earliestDateStr: toDateString(new Date()) };
    const days = getLeadTimeDays(selectedProduct.leadTimeTiers, numberOfPeople);
    return { maxLeadTimeDays: days, earliestDateStr: toDateString(getEarliestDate(days)) };
  }, [selectedProduct, numberOfPeople]);

  // Validate date against lead time
  useEffect(() => {
    if (!pickupDate) { setDateWarning(null); return; }
    if (pickupDate < earliestDateStr) {
      setDateWarning(
        isFr
          ? `Date trop tôt — choisissez le ${earliestDateStr} ou après`
          : `Date too early — choose ${earliestDateStr} or later`,
      );
    } else {
      setDateWarning(null);
    }
  }, [pickupDate, earliestDateStr, isFr]);

  // Clear date if it becomes invalid when people count changes
  useEffect(() => {
    if (pickupDate && pickupDate < earliestDateStr) {
      setPickupDate('');
    }
  }, [earliestDateStr]);

  const belowMin = useMemo(() => {
    if (!selectedProduct || selectedProduct.pricingTiers.length === 0) return false;
    const minFromTiers = selectedProduct.pricingTiers[0].minPeople;
    return numberOfPeople < minFromTiers;
  }, [selectedProduct, numberOfPeople]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId((prev) => {
      if (prev === productId) return null;
      // Auto-set numberOfPeople to the minimum from the first pricing tier
      const product = products.find((p) => p.id === productId);
      if (product && product.pricingTiers.length > 0) {
        const minPeople = product.pricingTiers
          .slice()
          .sort((a, b) => a.minPeople - b.minPeople)[0].minPeople;
        setNumberOfPeople(minPeople);
      }
      return productId;
    });
  }, [products]);

  const handleRemove = useCallback(() => {
    setSelectedProductId(null);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedProduct || calculatedPrice == null || !matchedTier) return;
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const shopifyVariantId = matchedTier.shopifyVariantId;
      const shopifyProductId = selectedProduct.shopifyProductId ?? '';

      const res = await fetch('/api/checkout/cake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            shopifyProductId,
            variantId: selectedProduct.id,
            variantLabel: `${matchedTier.minPeople} ${C.numberOfPeopleShort}`,
            shopifyVariantId,
            quantity: 1,
            price: calculatedPrice,
          }],
          pickupDate: `${pickupDate}T00:00:00`,
          numberOfPeople,
          eventType,
          specialInstructions: specialInstructions.trim() || null,
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() || null : null,
          locale,
          calculatedPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || C.checkoutError);
        return;
      }
      try { localStorage.removeItem('rhubarbe:cake:cart'); } catch {}
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutError(C.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedProduct, calculatedPrice, matchedTier, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, deliveryAddress, locale]);

  useEffect(() => {
    fetch('/api/storefront/cake-products')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: CakeProduct[]) => setProducts(data))
      .catch(() => setError(C.loadError))
      .finally(() => setLoading(false));
  }, [isFr]);

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex gap-8">
        {/* Left: Products */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {C.title}
          </h1>
          <p className="text-sm text-gray-500 mb-10 max-w-xl">
            {C.subtitle}
          </p>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400">{C.noProducts}</p>
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4">
              {products.map((product) => (
                <CakeProductCard key={product.id} product={product} locale={locale}
                  isSelected={selectedProductId === product.id}
                  onSelect={handleSelectProduct} brandColor={brandColor}
                  numberOfPeople={numberOfPeople} C={C} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Cart sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <CakeInlineCart
            selectedProduct={selectedProduct}
            numberOfPeople={numberOfPeople}
            calculatedPrice={calculatedPrice}
            pickupDate={pickupDate}
            eventType={eventType}
            specialInstructions={specialInstructions}
            fulfillmentType={fulfillmentType}
            deliveryAddress={deliveryAddress}
            dateWarning={dateWarning}
            earliestDateStr={earliestDateStr}
            maxLeadTimeDays={maxLeadTimeDays}
            onDateChange={setPickupDate}
            onNumberOfPeopleChange={setNumberOfPeople}
            onEventTypeChange={setEventType}
            onSpecialInstructionsChange={setSpecialInstructions}
            onFulfillmentTypeChange={setFulfillmentType}
            onDeliveryAddressChange={setDeliveryAddress}
            onCheckout={handleCheckout}
            onRemove={handleRemove}
            checkoutLoading={checkoutLoading}
            checkoutError={checkoutError}
            locale={locale}
            belowMin={belowMin}
            C={C}
          />
        </div>
      </div>

      {/* Mobile cart modal */}
      <MobileCartModal open={showMobileCart} onClose={() => setShowMobileCart(false)}>
        <CakeInlineCart
          selectedProduct={selectedProduct}
          numberOfPeople={numberOfPeople}
          calculatedPrice={calculatedPrice}
          pickupDate={pickupDate}
          eventType={eventType}
          specialInstructions={specialInstructions}
          fulfillmentType={fulfillmentType}
          deliveryAddress={deliveryAddress}
          dateWarning={dateWarning}
          earliestDateStr={earliestDateStr}
          maxLeadTimeDays={maxLeadTimeDays}
          onDateChange={setPickupDate}
          onNumberOfPeopleChange={setNumberOfPeople}
          onEventTypeChange={setEventType}
          onSpecialInstructionsChange={setSpecialInstructions}
          onFulfillmentTypeChange={setFulfillmentType}
          onDeliveryAddressChange={setDeliveryAddress}
          onCheckout={() => { setShowMobileCart(false); handleCheckout(); }}
          onRemove={handleRemove}
          checkoutLoading={checkoutLoading}
          checkoutError={checkoutError}
          locale={locale}
          belowMin={belowMin}
          C={C}
        />
      </MobileCartModal>

      {/* Mobile bottom bar */}
      {selectedProduct && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {selectedProduct.name}{calculatedPrice != null && ` · $${(calculatedPrice / 100).toFixed(2)}`}
            </p>
            <button onClick={() => setShowMobileCart(true)}
              className="px-6 py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {isFr ? 'Voir la commande' : 'View order'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
