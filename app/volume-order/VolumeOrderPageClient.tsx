'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { usePersistedState, mapSerializer } from '@/lib/hooks/use-persisted-state';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import dynamic from 'next/dynamic';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

// ── Types ──

interface TranslationObject {
  en: string;
  fr: string;
}

interface VolumeVariant {
  id: string;
  label: TranslationObject;
  price: number | null;
  shopifyVariantId: string | null;
}

interface LeadTimeTier {
  minQuantity: number;
  leadTimeDays: number;
}

interface VolumeProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number | null;
  shopifyProductId: string | null;
  volumeDescription: TranslationObject;
  volumeInstructions: TranslationObject;
  volumeMinOrderQuantity: number;
  allergens: string[];
  leadTimeTiers: LeadTimeTier[];
  variants: VolumeVariant[];
  pickupOnly: boolean;
}

// ── Helpers ──

function tr(field: TranslationObject | null | undefined, locale: string): string {
  if (!field) return '';
  if (locale === 'fr') return field.fr || field.en || '';
  return field.en || '';
}

function getTotalQuantity(product: VolumeProduct, cart: Map<string, number>): number {
  if (product.variants.length === 0) return cart.get(product.id) ?? 0;
  return product.variants.reduce((sum, v) => sum + (cart.get(v.id) ?? 0), 0);
}

function getLeadTimeDays(tiers: LeadTimeTier[], totalQuantity: number): number {
  const applicable = tiers
    .filter((t) => t.minQuantity <= totalQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
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
    return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ── Grouped cart type ──

interface CartGroup {
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  basePrice: number;
  allergens: string[];
  variants: Array<{ variantId: string; variantLabel: string; quantity: number; shopifyVariantId: string; price: number }>;
  totalQty: number;
  totalPrice: number;
}

// ── Product Card ──

function VolumeProductCard({
  product, locale, cart, onQuantityChange, brandColor, V,
}: {
  product: VolumeProduct;
  locale: string;
  cart: Map<string, number>;
  onQuantityChange: (variantId: string, quantity: number) => void;
  brandColor: string;
  V: Record<string, string>;
}) {
  const isFr = locale === 'fr';
  const description = tr(product.volumeDescription, locale);
  const totalQty = getTotalQuantity(product, cart);
  const belowMin = totalQty > 0 && product.leadTimeTiers.length > 0 && totalQty < product.leadTimeTiers[0].minQuantity;
  const currentLeadDays = getLeadTimeDays(product.leadTimeTiers, totalQty);

  return (
    <div className="group flex flex-col gap-3">
      {product.image ? (
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
          <img src={product.image} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      ) : (
        <div
          className="aspect-[3/4]"
          style={{ backgroundColor: brandColor }}
        />
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {product.name}
          </h3>
        </div>

        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{description}</p>
        )}

        {/* Allergen badges */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.allergens.map((a) => (
              <span
                key={a}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200/60"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Quantity inputs */}
        <div className="flex flex-col gap-2 mt-2">
          {product.variants.length > 0 ? (
            product.variants.map((v) => {
              const variantPrice = v.price ?? product.price;
              return (
                <div key={v.id} className="flex items-center gap-2">
                  <label htmlFor={`qty-${v.id}`} className="text-xs text-gray-600 min-w-0 flex-1"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {tr(v.label, locale)}
                  </label>
                  {variantPrice != null && variantPrice > 0 && (
                    <span className="text-[10px] text-gray-400 shrink-0"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      ${(variantPrice / 100).toFixed(2)}
                    </span>
                  )}
                  <input id={`qty-${v.id}`} type="number" min={0}
                    value={(cart.get(v.id) ?? 0) || ''}
                    placeholder="0"
                    onChange={(e) => onQuantityChange(v.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                    aria-label={`${tr(v.label, locale)} quantity`} />
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`qty-${product.id}`} className="text-xs text-gray-600"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {V.quantity}
              </label>
              <input id={`qty-${product.id}`} type="number" min={0}
                value={(cart.get(product.id) ?? 0) || ''}
                placeholder="0"
                onChange={(e) => onQuantityChange(product.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-16 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                aria-label={`${product.name} quantity`} />
            </div>
          )}
        </div>

        {/* Lead time tiers */}
        {product.leadTimeTiers.length > 0 && (
          <div className="mt-1.5">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-0.5"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {V.leadTimeTitle}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {product.leadTimeTiers
                .slice()
                .sort((a, b) => a.minQuantity - b.minQuantity)
                .map((tier, i) => (
                  <span key={i}
                    className={`text-[10px] tracking-wide ${
                      totalQty >= tier.minQuantity ? 'text-gray-600 font-medium' : 'text-gray-300'
                    }`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {tier.minQuantity}+ → {tier.leadTimeDays}{isFr ? 'j' : 'd'}
                  </span>
                ))}
            </div>
            {totalQty > 0 && (
              <p className="text-[10px] text-gray-500 mt-0.5"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {isFr
                  ? `Votre délai actuel : ${currentLeadDays} jour${currentLeadDays > 1 ? 's' : ''}`
                  : `Your current lead time: ${currentLeadDays} day${currentLeadDays > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        )}

        {belowMin && (
          <p className="text-[11px] text-red-500 mt-1" role="alert">
            {isFr
              ? `Minimum: ${product.leadTimeTiers[0]?.minQuantity} (actuel : ${totalQty})`
              : `Minimum: ${product.leadTimeTiers[0]?.minQuantity} (current: ${totalQty})`}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Inline Cart Sidebar ──

function VolumeInlineCart({
  groups, totalQuantity, subtotal,
  fulfillmentDate, fulfillmentTime,
  fulfillmentType, allergenNote,
  dateWarning, earliestDateStr, maxLeadTimeDays,
  onDateChange, onTimeChange,
  onFulfillmentTypeChange, onAllergenNoteChange,
  onCheckout, onRemoveProduct, checkoutLoading, checkoutError,
  locale, hasMinViolation, deliveryDisabled, V,
}: {
  groups: CartGroup[];
  totalQuantity: number;
  subtotal: number;
  fulfillmentDate: string;
  fulfillmentTime: string;
  fulfillmentType: 'pickup' | 'delivery';
  allergenNote: string;
  dateWarning: string | null;
  earliestDateStr: string;
  maxLeadTimeDays: number;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onFulfillmentTypeChange: (t: 'pickup' | 'delivery') => void;
  onAllergenNoteChange: (n: string) => void;
  onCheckout: () => void;
  onRemoveProduct: (productId: string) => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
  locale: string;
  hasMinViolation: boolean;
  deliveryDisabled: boolean;
  V: Record<string, string>;
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);

  return (
    <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {V.yourOrder}
        </h2>
      </div>

      {totalQuantity === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">{V.noItems}</p>
          <p className="text-xs text-gray-300 mt-1">
            {V.startHint}
          </p>
        </div>
      ) : (
        <>
          {/* Grouped line items */}
          <div className="max-h-[40vh] overflow-y-auto">
            {groups.map((group) => (
              <div key={group.productId} className="px-5 py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{group.productName}</p>
                  {group.totalPrice > 0 && (
                    <span className="text-sm text-gray-900 font-medium shrink-0"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      ${(group.totalPrice / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                {group.variants.length > 1 ? (
                  <div className="mt-1 space-y-0.5">
                    {group.variants.map((v) => (
                      <div key={v.variantId} className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-gray-400 break-words min-w-0"
                          style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                          {v.variantLabel}
                        </span>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0"
                          style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                          {v.quantity} × ${(v.price / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {group.variants[0]?.variantLabel
                      ? `${group.variants[0].variantLabel} — ×${group.totalQty}`
                      : `×${group.totalQty}`}
                    {group.variants[0]?.price > 0 && ` @ $${(group.variants[0].price / 100).toFixed(2)}`}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveProduct(group.productId)}
                  className="text-[11px] text-gray-400 underline hover:text-red-500 mt-1"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {isFr ? 'retirer' : 'remove'}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 space-y-4">
            {/* Allergen summary */}
            {(() => {
              const allAllergens = Array.from(new Set(groups.flatMap((g) => g.allergens || [])));
              if (allAllergens.length === 0) return null;
              return (
                <div className="rounded-md bg-amber-50 ring-1 ring-amber-200/60 px-3 py-2.5">
                  <p
                    className="text-[10px] uppercase tracking-widest text-amber-600 mb-1.5"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}
                  >
                    {isFr ? 'Contient' : 'Contains'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allAllergens.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-white text-amber-700 ring-1 ring-amber-200/60"
                        style={{ fontFamily: 'var(--font-diatype-mono)' }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span>{V.estTotal}</span>
                <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {subtotal > 0 ? `$${(subtotal / 100).toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{V.items}</span>
                <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>{totalQuantity}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {V.taxNote}
              </p>
            </div>

            <hr className="border-gray-200" />

            {/* Pickup / Delivery toggle */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {V.fulfillment}
              </p>
              <div className="flex rounded overflow-hidden border border-gray-300">
                {(['pickup', 'delivery'] as const).map((type) => (
                  <button key={type} type="button"
                    onClick={() => onFulfillmentTypeChange(type)}
                    disabled={type === 'delivery' && deliveryDisabled}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
                      fulfillmentType === type
                        ? 'bg-[#333112] text-white'
                        : type === 'delivery' && deliveryDisabled
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {type === 'pickup' ? V.pickup : V.delivery}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <DatePickerField
                label={V.date}
                value={toDateValue(fulfillmentDate)}
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
                {V.earliest}{' '}
                <span className="text-gray-600">{formatDateHuman(earliestDateStr, locale)}</span>
                {' '}({maxLeadTimeDays}{isFr ? 'j délai' : 'd lead'})
              </p>
            )}
            {dateWarning && (
              <p className="text-[11px] text-red-500 -mt-2" role="alert">{dateWarning}</p>
            )}

            {/* Allergen note */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                {V.allergenNote}
              </label>
              <textarea value={allergenNote}
                onChange={(e) => onAllergenNoteChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors resize-none bg-transparent"
                placeholder={V.allergenPlaceholder} />
            </div>

            {hasMinViolation && (
              <p className="text-xs text-amber-600">
                {V.minWarning}
              </p>
            )}

            {!fulfillmentDate && totalQuantity > 0 && (
              <p className="text-xs text-amber-600">{V.noDateError}</p>
            )}

            {checkoutError && (
              <p className="text-xs text-red-600">{checkoutError}</p>
            )}

            <button onClick={onCheckout}
              disabled={checkoutLoading || !fulfillmentDate || !!dateWarning || hasMinViolation}
              className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {checkoutLoading
                ? V.loading
                : V.checkout}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page Component ──

export default function VolumeOrderPageClient() {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const V = T.volumeOrder;
  const { setVolumeCount } = useOrderItems();

  const [products, setProducts] = useState<VolumeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = usePersistedState<Map<string, number>>(
    'rhubarbe:volume:cart',
    new Map(),
    mapSerializer,
  );

  // Report cart count to nav
  useEffect(() => {
    let total = 0;
    cart.forEach((qty) => { total += qty; });
    setVolumeCount(total);
  }, [cart, setVolumeCount]);
  const [fulfillmentDate, setFulfillmentDate] = useState<string>('');
  const [fulfillmentTime, setFulfillmentTime] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [allergenNote, setAllergenNote] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#144437');

  // Fetch brand color from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data.brandColor) setBrandColor(data.brandColor); })
      .catch(() => {});
  }, []);

  // Max lead time across products with items in cart
  const { maxLeadTimeDays, earliestDateStr } = useMemo(() => {
    let maxDays = 0;
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0) {
        const days = getLeadTimeDays(product.leadTimeTiers, totalQty);
        if (days > maxDays) maxDays = days;
      }
    }
    return { maxLeadTimeDays: maxDays, earliestDateStr: toDateString(getEarliestDate(maxDays)) };
  }, [products, cart]);

  useEffect(() => {
    if (!fulfillmentDate) { setDateWarning(null); return; }
    if (fulfillmentDate < earliestDateStr) {
      setDateWarning(
        isFr
          ? `Date trop tôt — choisissez le ${earliestDateStr} ou après`
          : `Date too early — choose ${earliestDateStr} or later`,
      );
    } else {
      setDateWarning(null);
    }
  }, [fulfillmentDate, earliestDateStr, isFr]);

  const handleQuantityChange = useCallback((variantId: string, quantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) next.delete(variantId);
      else next.set(variantId, quantity);
      return next;
    });
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const next = new Map(prev);
      if (product.variants.length > 0) {
        for (const v of product.variants) next.delete(v.id);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }, [products]);

  // Build grouped cart
  const cartGroups = useMemo<CartGroup[]>(() => {
    const groups: CartGroup[] = [];
    for (const product of products) {
      const variants: CartGroup['variants'] = [];
      if (product.variants.length > 0) {
        for (const v of product.variants) {
          const qty = cart.get(v.id) ?? 0;
          if (qty > 0) {
            variants.push({
              variantId: v.id,
              variantLabel: tr(v.label, locale),
              quantity: qty,
              shopifyVariantId: v.shopifyVariantId ?? '',
              price: v.price ?? product.price ?? 0,
            });
          }
        }
      } else {
        const qty = cart.get(product.id) ?? 0;
        if (qty > 0) {
          variants.push({
            variantId: product.id,
            variantLabel: '',
            quantity: qty,
            shopifyVariantId: '',
            price: product.price ?? 0,
          });
        }
      }
      if (variants.length > 0) {
        groups.push({
          productId: product.id,
          productName: product.name,
          shopifyProductId: product.shopifyProductId ?? null,
          basePrice: product.price ?? 0,
          allergens: product.allergens || [],
          variants,
          totalQty: variants.reduce((s, v) => s + v.quantity, 0),
          totalPrice: variants.reduce((s, v) => s + v.price * v.quantity, 0),
        });
      }
    }
    return groups;
  }, [products, cart, locale]);

  const totalQuantity = useMemo(
    () => cartGroups.reduce((s, g) => s + g.totalQty, 0),
    [cartGroups],
  );

  const subtotal = useMemo(
    () => cartGroups.reduce((s, g) => s + g.totalPrice, 0),
    [cartGroups],
  );

  const hasMinViolation = useMemo(() => {
    return products.some((p) => {
      const qty = getTotalQuantity(p, cart);
      const minQty = p.leadTimeTiers.length > 0 ? p.leadTimeTiers[0].minQuantity : 1;
      return qty > 0 && qty < minQty;
    });
  }, [products, cart]);

  // If any product in the cart is pickup-only, disable delivery
  const deliveryDisabled = useMemo(() => {
    return products.some((p) => {
      const qty = getTotalQuantity(p, cart);
      return qty > 0 && p.pickupOnly;
    });
  }, [products, cart]);

  // Auto-switch to pickup if delivery becomes disabled
  useEffect(() => {
    if (deliveryDisabled && fulfillmentType === 'delivery') {
      setFulfillmentType('pickup');
    }
  }, [deliveryDisabled, fulfillmentType]);

  // Flatten groups back to line items for checkout API
  const checkoutItems = useMemo(() => {
    return cartGroups.flatMap((g) =>
      g.variants.map((v) => ({
        productId: g.productId,
        productName: g.productName,
        shopifyProductId: g.shopifyProductId,
        variantId: v.variantId,
        variantLabel: v.variantLabel || g.productName,
        shopifyVariantId: v.shopifyVariantId,
        quantity: v.quantity,
        price: v.price,
      })),
    );
  }, [cartGroups]);

  const handleCheckout = useCallback(async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const isoDate = fulfillmentTime
        ? `${fulfillmentDate}T${fulfillmentTime}:00`
        : `${fulfillmentDate}T00:00:00`;

      const res = await fetch('/api/checkout/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          fulfillmentDate: isoDate,
          fulfillmentType,
          allergenNote: allergenNote.trim() || null,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || V.checkoutError);
        return;
      }
      // Clear persisted cart before redirect
      try { localStorage.removeItem('rhubarbe:volume:cart'); } catch {}
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutError(V.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }, [checkoutItems, fulfillmentDate, fulfillmentTime, fulfillmentType, allergenNote, locale, isFr]);

  useEffect(() => {
    fetch('/api/storefront/volume-products')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: VolumeProduct[]) => setProducts(data))
      .catch(() => setError(V.loadError))
      .finally(() => setLoading(false));
  }, [isFr]);

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex gap-8">
        {/* Left: Products */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {V.title}
          </h1>
          <p className="text-sm text-gray-500 mb-10 max-w-xl">
            {V.subtitle}
          </p>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400">
                {V.noProducts}
              </p>
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product) => (
                <VolumeProductCard key={product.id} product={product} locale={locale}
                  cart={cart} onQuantityChange={handleQuantityChange} brandColor={brandColor} V={V} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Cart sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <VolumeInlineCart
            groups={cartGroups} totalQuantity={totalQuantity} subtotal={subtotal}
            fulfillmentDate={fulfillmentDate} fulfillmentTime={fulfillmentTime}
            fulfillmentType={fulfillmentType} allergenNote={allergenNote}
            dateWarning={dateWarning} earliestDateStr={earliestDateStr}
            maxLeadTimeDays={maxLeadTimeDays}
            onDateChange={setFulfillmentDate} onTimeChange={setFulfillmentTime}
            onFulfillmentTypeChange={setFulfillmentType}
            onAllergenNoteChange={setAllergenNote}
            onCheckout={handleCheckout} onRemoveProduct={handleRemoveProduct} checkoutLoading={checkoutLoading}
            checkoutError={checkoutError} locale={locale}
            hasMinViolation={hasMinViolation}
            deliveryDisabled={deliveryDisabled}
            V={V}
          />
        </div>
      </div>

      {/* Mobile bottom bar */}
      {totalQuantity > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          {checkoutError && <p className="text-xs text-red-600 mb-2">{checkoutError}</p>}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {totalQuantity} {V.items}
                {subtotal > 0 && ` · $${(subtotal / 100).toFixed(2)}`}
              </p>
            </div>
            <button onClick={handleCheckout}
              disabled={checkoutLoading || !fulfillmentDate || !!dateWarning || hasMinViolation}
              className="px-6 py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {checkoutLoading ? '…' : V.mobileCheckout}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
