'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { usePersistedState, mapSerializer } from '@/lib/hooks/use-persisted-state';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import dynamic from 'next/dynamic';
import { calculateServesEstimate, isSundayUnavailable } from '@/lib/utils/order-helpers';
import MobileCartModal from '@/components/ui/MobileCartModal';
import { CateringCardSkeleton } from '@/components/ui/OrderPageSkeleton';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

interface TranslationObject { en: string; fr: string; }

interface VolumeVariant {
  id: string;
  label: TranslationObject;
  description: TranslationObject | null;
  price: number | null;
  shopifyVariantId: string | null;
  image: string | null;
}

interface LeadTimeTier { minQuantity: number; leadTimeDays: number; }

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
  shortCardCopy: string | null;
  allergens: string[];
  leadTimeTiers: LeadTimeTier[];
  variants: VolumeVariant[];
  pickupOnly: boolean;
  servesPerUnit: number | null;
  volumeUnitLabel: 'quantity' | 'people';
  maxAdvanceDays: number | null;
}

function tr(field: TranslationObject | null | undefined, locale: string): string {
  if (!field) return '';
  return locale === 'fr' ? (field.fr || field.en || '') : (field.en || '');
}

function getTotalQuantity(product: VolumeProduct, cart: Map<string, number>): number {
  if (product.variants.length === 0) return cart.get(product.id) ?? 0;
  return product.variants.reduce((sum, v) => sum + (cart.get(v.id) ?? 0), 0);
}

function getLeadTimeDays(tiers: LeadTimeTier[], totalQuantity: number): number {
  const applicable = tiers.filter((t) => t.minQuantity <= totalQuantity).sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
}

function getEarliestDate(leadTimeDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + leadTimeDays);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateValue(dateStr: string): DateValue | null {
  if (!dateStr) return null;
  try { return parseDate(dateStr); } catch { return null; }
}

function formatDateHuman(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

interface CartGroup {
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  basePrice: number;
  allergens: string[];
  volumeUnitLabel: 'quantity' | 'people';
  variants: Array<{ variantId: string; variantLabel: string; quantity: number; shopifyVariantId: string; price: number }>;
  totalQty: number;
  totalPrice: number;
}

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
  const minQty = product.leadTimeTiers.length > 0
    ? product.leadTimeTiers[0].minQuantity
    : product.volumeMinOrderQuantity;
  const belowMin = totalQty > 0 && totalQty < minQty;
  const currentLeadDays = getLeadTimeDays(product.leadTimeTiers, totalQty);

  const [focusedVariantId, setFocusedVariantId] = useState<string | null>(null);

  // Show the focused variant's image, or fall back to product image
  const focusedVariant = product.variants.find((v) => v.id === focusedVariantId);
  const displayImage = (focusedVariant?.image) || product.image;

  const handleVariantQtyChange = (variantId: string, qty: number) => {
    setFocusedVariantId(variantId);
    onQuantityChange(variantId, qty);
  };

  const metaPills: string[] = [];
  if (product.servesPerUnit) {
    metaPills.push(isFr ? `${product.servesPerUnit} portions/u` : `serves ${product.servesPerUnit}`);
  }
  const unitLabel = product.volumeUnitLabel === 'people'
    ? (isFr ? 'pers.' : 'people')
    : '';
  if (minQty > 1) metaPills.push(`min ${minQty}${unitLabel ? ` ${unitLabel}` : ''}`);
  if (product.pickupOnly) metaPills.push(isFr ? 'cueillette seul.' : 'pickup only');

  return (
    <div className="border border-gray-200 rounded-lg p-3 md:flex md:gap-4">
      <div className="flex gap-3 md:w-1/3 md:shrink-0">
        {displayImage ? (
          <div className="shrink-0 rounded overflow-hidden bg-gray-100 w-[112px] h-[140px] md:w-[96px] md:h-[120px] relative">
            <img src={displayImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover object-center" />
          </div>
        ) : (
          <div className="shrink-0 rounded w-[112px] h-[140px] md:w-[96px] md:h-[120px]" style={{ backgroundColor: brandColor }} />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs uppercase tracking-widest leading-tight"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {product.name}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{description}</p>
          )}
          {metaPills.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
              {metaPills.map((pill, i) => (
                <span key={i} className="text-[10px] text-gray-400 tracking-wide"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>{i > 0 && '• '}{pill}</span>
              ))}
            </div>
          )}
          {product.allergens && product.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.allergens.map((a) => (
                <span key={a}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200/60"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>{a}</span>
              ))}
            </div>
          )}
          {product.leadTimeTiers.length > 0 && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {product.leadTimeTiers.slice().sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                  <span key={i}
                    className={`text-[10px] tracking-wide ${totalQty >= tier.minQuantity ? 'text-gray-600 font-medium' : 'text-gray-300'}`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {tier.minQuantity}+ {'\u2192'} {tier.leadTimeDays}{isFr ? 'j' : 'd'}
                  </span>
                ))}
              </div>
              {totalQty >= minQty && totalQty > 0 && (
                <p className="text-[10px] text-gray-500 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {isFr
                    ? `Votre d\u00e9lai actuel : ${currentLeadDays} jour${currentLeadDays > 1 ? 's' : ''}`
                    : `Your current lead time: ${currentLeadDays} day${currentLeadDays > 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          )}
          {belowMin && (
            <p className="text-[11px] text-red-500 mt-1" role="alert">
              {product.volumeUnitLabel === 'people'
                ? (isFr ? `Minimum: ${minQty} pers. (actuel : ${totalQty})` : `Minimum: ${minQty} people (current: ${totalQty})`)
                : (isFr ? `Minimum: ${minQty} (actuel : ${totalQty})` : `Minimum: ${minQty} (current: ${totalQty})`)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 md:mt-0 md:flex-1 md:min-w-0 flex flex-col gap-1.5 md:justify-center">
        {product.variants.length > 0 ? (
          product.variants.map((v) => {
            const variantPrice = v.price ?? product.price;
            const qty = cart.get(v.id) ?? 0;
            return (
              <div key={v.id} className="flex items-center gap-2">
                <label htmlFor={`qty-${v.id}`} className="text-xs text-gray-600 min-w-0 flex-1"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>{tr(v.label, locale)}</label>
                {variantPrice != null && variantPrice > 0 && (
                  <span className="text-xs text-gray-400 shrink-0 tabular-nums"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>${(variantPrice / 100).toFixed(2)}</span>
                )}
                <div className="flex items-center">
                  <button type="button"
                    onClick={() => handleVariantQtyChange(v.id, Math.max(0, qty - 1))}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-50 text-sm leading-none"
                    aria-label={`Decrease ${tr(v.label, locale)} ${product.volumeUnitLabel === 'people' ? 'people' : 'quantity'}`}>&minus;</button>
                  <input id={`qty-${v.id}`} type="number" min={0} inputMode="numeric"
                    value={qty || ''} placeholder="0"
                    onChange={(e) => handleVariantQtyChange(v.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    className="w-10 h-7 text-xs text-center border-y border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`${tr(v.label, locale)} ${product.volumeUnitLabel === 'people' ? 'people' : 'quantity'}`} />
                  <button type="button"
                    onClick={() => handleVariantQtyChange(v.id, qty + 1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-50 text-sm leading-none"
                    aria-label={`Increase ${tr(v.label, locale)} ${product.volumeUnitLabel === 'people' ? 'people' : 'quantity'}`}>+</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2">
            <label htmlFor={`qty-${product.id}`} className="text-xs text-gray-600 flex-1"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>{product.volumeUnitLabel === 'people' ? (isFr ? 'Personnes' : 'People') : V.quantity}</label>
            {product.price != null && product.price > 0 && (
              <span className="text-xs text-gray-400 shrink-0 tabular-nums"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>${(product.price / 100).toFixed(2)}</span>
            )}
            {(() => { const qty = cart.get(product.id) ?? 0; return (
              <div className="flex items-center">
                <button type="button"
                  onClick={() => onQuantityChange(product.id, Math.max(0, qty - 1))}
                  className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-50 text-sm leading-none"
                  aria-label={`Decrease ${product.name} quantity`}>&minus;</button>
                <input id={`qty-${product.id}`} type="number" min={0} inputMode="numeric"
                  value={qty || ''} placeholder="0"
                  onChange={(e) => onQuantityChange(product.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-10 h-7 text-xs text-center border-y border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label={`${product.name} quantity`} />
                <button type="button"
                  onClick={() => onQuantityChange(product.id, qty + 1)}
                  className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-50 text-sm leading-none"
                  aria-label={`Increase ${product.name} quantity`}>+</button>
              </div>
            ); })()}
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeInlineCart({
  groups, totalQuantity, subtotal, fulfillmentDate, fulfillmentTime,
  fulfillmentType, allergenNote, dateWarning, earliestDateStr, maxLeadTimeDays,
  servesEstimate, onDateChange, onTimeChange, onFulfillmentTypeChange, onAllergenNoteChange,
  onCheckout, onRemoveProduct, checkoutLoading, checkoutError,
  locale, hasMinViolation, deliveryDisabled, V, latestDateStr,
}: {
  groups: CartGroup[]; totalQuantity: number; subtotal: number;
  fulfillmentDate: string; fulfillmentTime: string;
  fulfillmentType: 'pickup' | 'delivery'; allergenNote: string;
  dateWarning: string | null; earliestDateStr: string; maxLeadTimeDays: number;
  servesEstimate: number;
  onDateChange: (d: string) => void; onTimeChange: (t: string) => void;
  onFulfillmentTypeChange: (t: 'pickup' | 'delivery') => void;
  onAllergenNoteChange: (n: string) => void;
  onCheckout: () => void; onRemoveProduct: (productId: string) => void;
  checkoutLoading: boolean; checkoutError: string | null;
  locale: string; hasMinViolation: boolean; deliveryDisabled: boolean;
  V: Record<string, string>;
  latestDateStr: string | null;
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);
  const maxDateValue = latestDateStr ? toDateValue(latestDateStr) : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg sticky top-20">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-xs uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}>{V.yourOrder}</h2>
      </div>
      {/* Earliest date summary — mirrors regular order pickup info */}
      {maxLeadTimeDays > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 space-y-1">
          <p className="text-xs text-gray-600 font-medium">
            {V.earliest}{' '}
            <span>{formatDateHuman(earliestDateStr, locale)}</span>
            {' '}
            <span className="text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              ({maxLeadTimeDays}{isFr ? 'j délai' : 'd lead'})
            </span>
          </p>
          {fulfillmentDate && !dateWarning && (
            <p className="text-xs text-gray-600 font-medium">
              {fulfillmentType === 'pickup'
                ? `${isFr ? 'Cueillette' : 'Pickup'}: ${formatDateHuman(fulfillmentDate, locale)}`
                : `${isFr ? 'Livraison' : 'Delivery'}: ${formatDateHuman(fulfillmentDate, locale)}`}
              {' '}✓
            </p>
          )}
        </div>
      )}
      {totalQuantity === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">{V.noItems}</p>
          <p className="text-xs text-gray-300 mt-1">{V.startHint}</p>
        </div>
      ) : (
        <>
          <div className="max-h-[40vh] overflow-y-auto">
            {groups.map((group) => (
              <div key={group.productId} className="px-5 py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{group.productName}</p>
                  {group.totalPrice > 0 && (
                    <span className="text-sm text-gray-900 font-medium shrink-0"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>${(group.totalPrice / 100).toFixed(2)}</span>
                  )}
                </div>
                {group.variants.length > 1 ? (
                  <div className="mt-1 space-y-0.5">
                    {group.variants.map((v) => (
                      <div key={v.variantId} className="flex items-start justify-between gap-2">
                        <span className="text-[11px] text-gray-400 break-words min-w-0"
                          style={{ fontFamily: 'var(--font-diatype-mono)' }}>{v.variantLabel}</span>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0"
                          style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                          {v.quantity} {group.volumeUnitLabel === 'people' ? (isFr ? 'pers.' : 'ppl') : '\u00d7'} ${(v.price / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 min-w-0"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {group.variants[0]?.variantLabel || group.productName}
                      {group.variants[0]?.price > 0 && ` @ $${(group.variants[0].price / 100).toFixed(2)}`}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap shrink-0"
                      style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {group.volumeUnitLabel === 'people' ? `${group.totalQty} ${isFr ? 'pers.' : 'ppl'}` : `\u00d7${group.totalQty}`}
                    </span>
                  </div>
                )}
                <button type="button" onClick={() => onRemoveProduct(group.productId)}
                  className="text-[11px] text-gray-400 underline hover:text-red-500 mt-1"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {isFr ? 'retirer' : 'remove'}
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-gray-200 space-y-4">
            {(() => {
              const allAllergens = Array.from(new Set(groups.flatMap((g) => g.allergens || [])));
              if (allAllergens.length === 0) return null;
              return (
                <div className="rounded-md bg-amber-50 ring-1 ring-amber-200/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-amber-600 mb-1.5"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>{isFr ? 'Contient' : 'Contains'}</p>
                  <div className="flex flex-wrap gap-1">
                    {allAllergens.map((a) => (
                      <span key={a}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-white text-amber-700 ring-1 ring-amber-200/60"
                        style={{ fontFamily: 'var(--font-diatype-mono)' }}>{a}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span>{V.estTotal}</span>
                <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {subtotal > 0 ? `${(subtotal / 100).toFixed(2)}` : '\u2014'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{V.items}</span>
                <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>{totalQuantity}</span>
              </div>
              {servesEstimate > 0 && (
                <p className="text-xs text-gray-500">
                  {isFr ? `Pour environ ${servesEstimate} personnes` : `Serves approx. ${servesEstimate} people`}
                </p>
              )}
              <p className="text-[11px] text-gray-400">{V.taxNote}</p>
            </div>
            <hr className="border-gray-200" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{V.fulfillment}</p>
              <div className="flex rounded overflow-hidden border border-gray-300">
                {(['pickup', 'delivery'] as const).map((type) => (
                  <button key={type} type="button"
                    onClick={() => onFulfillmentTypeChange(type)}
                    disabled={type === 'delivery' && deliveryDisabled}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
                      fulfillmentType === type ? 'bg-[#333112] text-white'
                        : type === 'delivery' && deliveryDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {type === 'pickup' ? V.pickup : V.delivery}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <DatePickerField label={V.date}
                value={toDateValue(fulfillmentDate)}
                minValue={minDateValue ?? today(getLocalTimeZone())}
                maxValue={maxDateValue ?? undefined}
                isDateUnavailable={(date: DateValue) => isSundayUnavailable(date.toDate(getLocalTimeZone()))}
                onChange={(val: DateValue | null) => {
                  if (val) {
                    onDateChange(`${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`);
                  } else { onDateChange(''); }
                }} />
              <p className="text-[11px] text-gray-400 mt-1">
                {isFr ? "Nous n'acceptons pas les commandes traiteur le dimanche" : "We don't take catering orders on Sundays"}
              </p>
            </div>
            {dateWarning && <p className="text-[11px] text-red-500 -mt-2" role="alert">{dateWarning}</p>}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">{V.allergenNote}</label>
              <textarea value={allergenNote} onChange={(e) => onAllergenNoteChange(e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition-colors resize-none bg-transparent"
                placeholder={V.allergenPlaceholder} />
            </div>
            {hasMinViolation && <p className="text-xs text-amber-600">{V.minWarning}</p>}
            {!fulfillmentDate && totalQuantity > 0 && <p className="text-xs text-amber-600">{V.noDateError}</p>}
            {checkoutError && <p className="text-xs text-red-600">{checkoutError}</p>}
            <button onClick={onCheckout}
              disabled={checkoutLoading || !fulfillmentDate || !!dateWarning || hasMinViolation}
              className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {checkoutLoading ? V.loading : V.checkout}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VolumeOrderPageClient({ cmsContent }: { cmsContent?: any }) {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const V = T.volumeOrder;
  const { setVolumeCount } = useOrderItems();

  // CMS-managed title/subtitle with i18n fallback
  const localeContent = isFr ? cmsContent?.fr : cmsContent?.en;
  const pageTitle = localeContent?.title || V.title;
  const pageSubtitle = localeContent?.subtitle || V.subtitle;

  const [products, setProducts] = useState<VolumeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = usePersistedState<Map<string, number>>('rhubarbe:volume:cart', new Map(), mapSerializer);

  useEffect(() => {
    let total = 0;
    cart.forEach((qty) => { total += qty; });
    setVolumeCount(total);
  }, [cart, setVolumeCount]);

  const [fulfillmentDate, setFulfillmentDate] = useState('');
  const [fulfillmentTime, setFulfillmentTime] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [allergenNote, setAllergenNote] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#144437');
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json())
      .then((data) => { if (data.brandColor) setBrandColor(data.brandColor); }).catch(() => {});
  }, []);

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

  // Max advance date — use the smallest maxAdvanceDays across products in cart
  const latestDateStr = useMemo(() => {
    let minAdvance: number | null = null;
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0 && product.maxAdvanceDays) {
        if (minAdvance === null || product.maxAdvanceDays < minAdvance) {
          minAdvance = product.maxAdvanceDays;
        }
      }
    }
    if (minAdvance === null) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minAdvance);
    return toDateString(d);
  }, [products, cart]);

  useEffect(() => {
    if (!fulfillmentDate) { setDateWarning(null); return; }
    if (fulfillmentDate < earliestDateStr) {
      setDateWarning(isFr
        ? `Date trop t\u00f4t \u2014 choisissez le ${earliestDateStr} ou apr\u00e8s`
        : `Date too early \u2014 choose ${earliestDateStr} or later`);
    } else { setDateWarning(null); }
  }, [fulfillmentDate, earliestDateStr, isFr]);

  const handleQuantityChange = useCallback((variantId: string, quantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) next.delete(variantId); else next.set(variantId, quantity);
      return next;
    });
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const next = new Map(prev);
      if (product.variants.length > 0) { for (const v of product.variants) next.delete(v.id); }
      else { next.delete(productId); }
      return next;
    });
  }, [products]);

  const cartGroups = useMemo<CartGroup[]>(() => {
    const groups: CartGroup[] = [];
    for (const product of products) {
      const variants: CartGroup['variants'] = [];
      if (product.variants.length > 0) {
        for (const v of product.variants) {
          const qty = cart.get(v.id) ?? 0;
          if (qty > 0) variants.push({ variantId: v.id, variantLabel: tr(v.label, locale), quantity: qty, shopifyVariantId: v.shopifyVariantId ?? '', price: v.price ?? product.price ?? 0 });
        }
      } else {
        const qty = cart.get(product.id) ?? 0;
        if (qty > 0) variants.push({ variantId: product.id, variantLabel: '', quantity: qty, shopifyVariantId: '', price: product.price ?? 0 });
      }
      if (variants.length > 0) {
        groups.push({ productId: product.id, productName: product.name, shopifyProductId: product.shopifyProductId ?? null, basePrice: product.price ?? 0, allergens: product.allergens || [], volumeUnitLabel: product.volumeUnitLabel ?? 'quantity', variants, totalQty: variants.reduce((s, v) => s + v.quantity, 0), totalPrice: variants.reduce((s, v) => s + v.price * v.quantity, 0) });
      }
    }
    return groups;
  }, [products, cart, locale]);

  const totalQuantity = useMemo(() => cartGroups.reduce((s, g) => s + g.totalQty, 0), [cartGroups]);
  const subtotal = useMemo(() => cartGroups.reduce((s, g) => s + g.totalPrice, 0), [cartGroups]);

  const servesEstimate = useMemo(() => {
    const items: Array<{ quantity: number; servesPerUnit: number | null }> = [];
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0) items.push({ quantity: totalQty, servesPerUnit: product.servesPerUnit });
    }
    return calculateServesEstimate(items);
  }, [products, cart]);

  const hasMinViolation = useMemo(() => {
    return products.some((p) => {
      const qty = getTotalQuantity(p, cart);
      const minQty = p.leadTimeTiers.length > 0 ? p.leadTimeTiers[0].minQuantity : 1;
      return qty > 0 && qty < minQty;
    });
  }, [products, cart]);

  const deliveryDisabled = useMemo(() => {
    return products.some((p) => { const qty = getTotalQuantity(p, cart); return qty > 0 && p.pickupOnly; });
  }, [products, cart]);

  useEffect(() => {
    if (deliveryDisabled && fulfillmentType === 'delivery') setFulfillmentType('pickup');
  }, [deliveryDisabled, fulfillmentType]);

  const checkoutItems = useMemo(() => {
    return cartGroups.flatMap((g) => g.variants.map((v) => ({
      productId: g.productId, productName: g.productName, shopifyProductId: g.shopifyProductId,
      variantId: v.variantId, variantLabel: v.variantLabel || g.productName,
      shopifyVariantId: v.shopifyVariantId, quantity: v.quantity, price: v.price,
    })));
  }, [cartGroups]);

  const handleCheckout = useCallback(async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const isoDate = fulfillmentTime ? `${fulfillmentDate}T${fulfillmentTime}:00` : `${fulfillmentDate}T00:00:00`;
      const res = await fetch('/api/checkout/volume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: checkoutItems, fulfillmentDate: isoDate, fulfillmentType, allergenNote: allergenNote.trim() || null, locale }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data.error || V.checkoutError); return; }
      window.location.href = data.checkoutUrl;
    } catch { setCheckoutError(V.checkoutError); }
    finally { setCheckoutLoading(false); }
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
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>{pageTitle}</h1>
          <p className="text-sm text-gray-500 mb-10 max-w-xl">{pageSubtitle}</p>
          {loading && (
            <CateringCardSkeleton />
          )}
          {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20"><p className="text-sm text-gray-400">{V.noProducts}</p></div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="flex flex-col gap-3">
              {products.map((product) => (
                <VolumeProductCard key={product.id} product={product} locale={locale}
                  cart={cart} onQuantityChange={handleQuantityChange} brandColor={brandColor} V={V} />
              ))}
            </div>
          )}
        </div>
        <div className="hidden lg:block w-80 shrink-0">
          <VolumeInlineCart groups={cartGroups} totalQuantity={totalQuantity} subtotal={subtotal}
            fulfillmentDate={fulfillmentDate} fulfillmentTime={fulfillmentTime}
            fulfillmentType={fulfillmentType} allergenNote={allergenNote}
            dateWarning={dateWarning} earliestDateStr={earliestDateStr}
            maxLeadTimeDays={maxLeadTimeDays} servesEstimate={servesEstimate}
            onDateChange={setFulfillmentDate} onTimeChange={setFulfillmentTime}
            onFulfillmentTypeChange={setFulfillmentType} onAllergenNoteChange={setAllergenNote}
            onCheckout={handleCheckout} onRemoveProduct={handleRemoveProduct}
            checkoutLoading={checkoutLoading} checkoutError={checkoutError}
            locale={locale} hasMinViolation={hasMinViolation} deliveryDisabled={deliveryDisabled} V={V} latestDateStr={latestDateStr} />
        </div>
      </div>

      {/* Mobile cart modal */}
      <MobileCartModal open={showMobileCart} onClose={() => setShowMobileCart(false)}>
        <VolumeInlineCart groups={cartGroups} totalQuantity={totalQuantity} subtotal={subtotal}
          fulfillmentDate={fulfillmentDate} fulfillmentTime={fulfillmentTime}
          fulfillmentType={fulfillmentType} allergenNote={allergenNote}
          dateWarning={dateWarning} earliestDateStr={earliestDateStr}
          maxLeadTimeDays={maxLeadTimeDays} servesEstimate={servesEstimate}
          onDateChange={setFulfillmentDate} onTimeChange={setFulfillmentTime}
          onFulfillmentTypeChange={setFulfillmentType} onAllergenNoteChange={setAllergenNote}
          onCheckout={() => { setShowMobileCart(false); handleCheckout(); }}
          onRemoveProduct={handleRemoveProduct}
          checkoutLoading={checkoutLoading} checkoutError={checkoutError}
          locale={locale} hasMinViolation={hasMinViolation} deliveryDisabled={deliveryDisabled} V={V} latestDateStr={latestDateStr} />
      </MobileCartModal>

      {/* Mobile bottom bar */}
      {totalQuantity > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {totalQuantity} {V.items}{subtotal > 0 && ` · $${(subtotal / 100).toFixed(2)}`}
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
