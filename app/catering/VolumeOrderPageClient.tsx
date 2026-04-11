'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { usePersistedState, mapSerializer } from '@/lib/hooks/use-persisted-state';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import dynamic from 'next/dynamic';
import { calculateServesEstimate, isSundayUnavailable } from '@/lib/utils/order-helpers';
import { CateringCardSkeleton } from '@/components/ui/OrderPageSkeleton';
import OrderCartPanel from '@/components/OrderCartPanel';

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

interface CateringTypeConfig {
  orderScope: 'variant' | 'order';
  orderMinimum: number;
  variantMinimum: number;
  increment: number;
  unitLabel: 'quantity' | 'people';
  maxAdvanceDays: number | null;
  leadTimeTiers: LeadTimeTier[];
}

interface VolumeProduct {
  id: string;
  name: string;
  title: string | null;
  translations: Record<string, Record<string, string>> | null;
  slug: string;
  image: string | null;
  price: number | null;
  shopifyProductId: string | null;
  volumeDescription: TranslationObject;
  volumeInstructions: TranslationObject;
  shortCardCopy: string | null;
  allergens: string[];
  variants: VolumeVariant[];
  pickupOnly: boolean;
  servesPerUnit: number | null;
  cateringType: string | null;
  cateringDescription: TranslationObject | null;
  cateringEndDate: string | null;
  dietaryTags: string[];
  temperatureTags: string[];
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
  cateringType: string;
  servesPerUnit: number | null;
  variants: Array<{ variantId: string; variantLabel: string; quantity: number; shopifyVariantId: string; price: number }>;
  totalQty: number;
  totalPrice: number;
}

function VolumeProductCard({
  product, locale, cart, onQuantityChange, brandColor, V, typeConfig, typeTotalQty,
}: {
  product: VolumeProduct;
  locale: string;
  cart: Map<string, number>;
  onQuantityChange: (variantId: string, quantity: number) => void;
  brandColor: string;
  V: Record<string, string>;
  typeConfig: CateringTypeConfig;
  typeTotalQty: number;
}) {
  const isFr = locale === 'fr';
  const displayName = (isFr ? product.translations?.fr?.title : null) || product.title || product.name;
  const totalQty = getTotalQuantity(product, cart);
  const increment = typeConfig.increment || 1;

  const isVariantScope = typeConfig.orderScope === 'variant';
  const minForScope = isVariantScope ? typeConfig.variantMinimum : 0;
  function smartIncrement(current: number): number {
    if (isVariantScope && current === 0) return typeConfig.variantMinimum || increment;
    return current + increment;
  }
  function smartDecrement(current: number): number {
    const next = current - increment;
    if (isVariantScope && next < typeConfig.variantMinimum) return 0;
    return next < 0 ? 0 : next;
  }

  const belowMin = isVariantScope
    ? product.variants.some((v) => { const q = cart.get(v.id) ?? 0; return q > 0 && q < typeConfig.variantMinimum; })
    : typeTotalQty > 0 && typeTotalQty < typeConfig.orderMinimum;
  const incrementViolation = isVariantScope
    ? product.variants.some((v) => { const q = cart.get(v.id) ?? 0; return q > 0 && (q - typeConfig.variantMinimum) % increment !== 0; })
    : typeTotalQty > 0 && (typeTotalQty - typeConfig.orderMinimum) % increment !== 0;

  const [focusedVariantId, setFocusedVariantId] = useState<string | null>(null);
  const focusedVariant = product.variants.find((v) => v.id === focusedVariantId);
  const displayImage = focusedVariant?.image || product.image;
  const [hovered, setHovered] = useState(false);

  const handleVariantQtyChange = (variantId: string, qty: number) => {
    setFocusedVariantId(variantId);
    onQuantityChange(variantId, qty);
  };

  const hasItems = totalQty > 0;
  const showOverlay = hasItems || hovered;

  const allergens = product.allergens ?? [];

  return (
    <div className="flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        {/* State 1: Image with black badges */}
        {!showOverlay && (
          <>
            {displayImage ? (
              <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: brandColor }} />
            )}
            {allergens.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-1 z-10">
                {allergens.map((a) => (
                  <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-black border border-black">{a}</span>
                ))}
              </div>
            )}
          </>
        )}
        {/* State 2: Pink overlay with white badges + controls */}
        {showOverlay && (
          <div className="w-full h-full bg-[#D49BCB] flex flex-col justify-between p-4">
            {allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {allergens.map((a) => (
                  <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-white border border-white">{a}</span>
                ))}
              </div>
            ) : <div />}
            <div className="flex flex-col gap-2">
              {hasItems ? (
                <>
                  {product.variants.length > 1 ? (
                    product.variants.map((v) => {
                      const qty = cart.get(v.id) ?? 0;
                      if (qty === 0) return null;
                      return (
                        <div key={v.id} className="flex items-center justify-between rounded-full border border-white overflow-hidden h-10 w-full">
                          <button type="button" onClick={() => onQuantityChange(v.id, smartDecrement(qty))} className="px-4 h-full text-white text-lg hover:bg-white/20">
                            {smartDecrement(qty) === 0 ? '×' : '−'}
                          </button>
                          <span className="text-[16px] text-white font-medium">{qty}</span>
                          <button type="button" onClick={() => onQuantityChange(v.id, smartIncrement(qty))} className="px-4 h-full text-white text-lg hover:bg-white/20">+</button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-between rounded-full border border-white overflow-hidden h-10 w-full">
                      <button type="button" onClick={() => {
                        const vid = product.variants.length > 0 ? product.variants[0].id : product.id;
                        const qty = cart.get(vid) ?? 0;
                        onQuantityChange(vid, smartDecrement(qty));
                      }} className="px-4 h-full text-white text-lg hover:bg-white/20">
                        {smartDecrement(totalQty) === 0 ? '×' : '−'}
                      </button>
                      <span className="text-[16px] text-white font-medium">{totalQty}</span>
                      <button type="button" onClick={() => {
                        const vid = product.variants.length > 0 ? product.variants[0].id : product.id;
                        const qty = cart.get(vid) ?? 0;
                        onQuantityChange(vid, smartIncrement(qty));
                      }} className="px-4 h-full text-white text-lg hover:bg-white/20">+</button>
                    </div>
                  )}
                </>
              ) : product.variants.length === 0 ? (
                <button type="button"
                  onClick={() => onQuantityChange(product.id, smartIncrement(0))}
                  className="w-full h-10 rounded-full border border-white text-[16px] text-white font-medium hover:bg-white/20">
                  {isFr ? '+ Ajouter' : '+ Add'}
                </button>
              ) : (
                <button type="button"
                  onClick={() => handleVariantQtyChange(product.variants[0].id, smartIncrement(0))}
                  className="w-full h-10 rounded-full border border-white text-[16px] text-white font-medium hover:bg-white/20">
                  {isFr ? '+ Ajouter' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col pt-2.5 gap-0.5">
        <h3 className="text-[16px] leading-tight" style={{ fontWeight: 500 }}>
          {displayName}
        </h3>
        {product.price != null && product.price > 0 && (
          <span className="text-[16px] text-gray-500">
            ${(product.price / 100).toFixed(2)}
          </span>
        )}
      </div>

      {/* Mobile-only quantity controls */}
      <div className="md:hidden mt-2">
        {!hasItems && product.variants.length === 0 ? (
          <button type="button"
            onClick={() => onQuantityChange(product.id, smartIncrement(0))}
            className="w-full h-8 border border-gray-300 text-[16px] font-medium hover:bg-gray-50 transition-colors">
            {isFr ? '+ Ajouter' : '+ Add'}
          </button>
        ) : !hasItems && product.variants.length > 0 ? (
          <button type="button"
            onClick={() => handleVariantQtyChange(product.variants[0].id, smartIncrement(0))}
            className="w-full h-8 border border-gray-300 text-[16px] font-medium hover:bg-gray-50 transition-colors">
            {isFr ? '+ Ajouter' : '+ Add'}
          </button>
        ) : (
          <div className="space-y-1.5">
            {product.variants.length > 0 ? (
              product.variants.map((v) => {
                const qty = cart.get(v.id) ?? 0;
                return (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-600 min-w-0 flex-1 truncate">{tr(v.label, locale)}</span>
                    <div className="flex items-center shrink-0">
                      <button type="button" onClick={() => handleVariantQtyChange(v.id, smartDecrement(qty))}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-50 text-xs leading-none">&minus;</button>
                      <input type="number" min={0} inputMode="numeric" value={qty || ''} placeholder="0"
                        onChange={(e) => handleVariantQtyChange(v.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                        className="w-8 h-6 text-[10px] text-center border-y border-gray-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <button type="button" onClick={() => handleVariantQtyChange(v.id, smartIncrement(qty))}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-50 text-xs leading-none">+</button>
                    </div>
                  </div>
                );
              })
            ) : (
              (() => { const qty = cart.get(product.id) ?? 0; return (
                <div className="flex items-center justify-between border border-gray-300 overflow-hidden h-8">
                  <button type="button" onClick={() => onQuantityChange(product.id, smartDecrement(qty))}
                    className="px-3 h-full hover:bg-gray-50 text-sm leading-none">&minus;</button>
                  <span className="text-[16px] font-medium">{qty}</span>
                  <button type="button" onClick={() => onQuantityChange(product.id, smartIncrement(qty))}
                    className="px-3 h-full hover:bg-gray-50 text-sm leading-none">+</button>
                </div>
              ); })()
            )}
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
  onCheckout, onRemoveProduct, onQuantityChange, getTypeConfig, checkoutLoading, checkoutError,
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
  onQuantityChange: (variantId: string, quantity: number) => void;
  getTypeConfig: (group: CartGroup) => CateringTypeConfig;
  checkoutLoading: boolean; checkoutError: string | null;
  locale: string; hasMinViolation: boolean; deliveryDisabled: boolean;
  V: Record<string, string>;
  latestDateStr: string | null;
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);
  const maxDateValue = latestDateStr ? toDateValue(latestDateStr) : undefined;

  return (
    <div>
      {/* Earliest date + allergens — above the line */}
      {maxLeadTimeDays > 0 && (
        <p className="text-[14px] mb-2">
          {isFr ? 'Cueillette au plus tôt\u00a0: ' : 'Earliest pickup: '}{formatDateHuman(earliestDateStr, locale)}
        </p>
      )}
      {totalQuantity > 0 && (() => {
        const allAllergens = Array.from(new Set(groups.flatMap((g) => g.allergens || [])));
        if (allAllergens.length === 0) return null;
        return (
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[14px] shrink-0">{isFr ? 'Contient' : 'Contains'}</p>
            <div className="flex flex-wrap gap-1">
              {allAllergens.map((a) => (
                <span key={a} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] border border-white">{a}</span>
              ))}
            </div>
          </div>
        );
      })()}
      {totalQuantity === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[16px] ">{V.noItems}</p>
          <p className="text-[14px]  mt-1">{V.startHint}</p>
        </div>
      ) : (
        <>
          <div>
            {(() => {
              const TYPE_LABELS: Record<string, Record<string, string>> = {
                brunch: { en: 'Brunch', fr: 'Brunch' },
                lunch: { en: 'Lunch', fr: 'Lunch' },
                dinatoire: { en: 'Dînatoire', fr: 'Dînatoire' },
              };
              const typeOrder = ['brunch', 'lunch', 'dinatoire', ''];
              const byType = new Map<string, CartGroup[]>();
              for (const g of groups) {
                const t = g.cateringType || '';
                if (!byType.has(t)) byType.set(t, []);
                byType.get(t)!.push(g);
              }
              return typeOrder.filter((t) => byType.has(t)).map((type) => {
                const typeGroups = byType.get(type)!;
                const label = TYPE_LABELS[type]?.[locale] ?? (type || (isFr ? 'Autre' : 'Other'));
                return (
                  <div key={type} className="border-b border-white pb-3 mb-3 last:border-b-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[20px] font-medium">{label}</p>
                      {type === 'dinatoire' && (() => {
                        const config = getTypeConfig(typeGroups[0]);
                        const typeTotal = typeGroups.reduce((s, g) => s + g.totalQty, 0);
                        if (typeTotal > 0 && typeTotal < config.orderMinimum) {
                          return <span className="text-[11px]" style={{ color: '#EBE000' }}>
                            {isFr ? `min ${config.orderMinimum}` : `min ${config.orderMinimum}`}
                          </span>;
                        }
                        return null;
                      })()}
                    </div>
                    {(() => {
                      const typeServes = typeGroups.reduce((s, g) => s + g.totalQty * (g.servesPerUnit ?? 0), 0);
                      return typeServes > 0 ? (
                        <p className="text-[12px] mb-2" style={{ opacity: 0.6 }}>
                          {isFr ? `≈ ${typeServes} personnes` : `≈ ${typeServes} people`}
                        </p>
                      ) : null;
                    })()}
                    {typeGroups.map((group) => {
                      const config = getTypeConfig(group);
                      const inc = config.increment || 1;
                      const isVariantScope = config.orderScope === 'variant';
                      const smartInc = (cur: number) => isVariantScope && cur === 0 ? config.variantMinimum || inc : cur + inc;
                      const smartDec = (cur: number) => { const n = cur - inc; return isVariantScope && n < config.variantMinimum ? 0 : n < 0 ? 0 : n; };

                      return group.variants.map((v) => (
                        <div key={v.variantId} className="flex items-center gap-2 py-1">
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] truncate">{group.productName}</span>
                            {group.variants.length > 1 && <span className="text-[11px]  ml-1">{v.variantLabel}</span>}
                          </div>
                          {v.price > 0 && <span className="text-[11px]  shrink-0">${(v.price / 100).toFixed(2)}</span>}
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => onQuantityChange(v.variantId, smartDec(v.quantity))}
                              className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[11px] hover:bg-white/20">
                              {smartDec(v.quantity) === 0 ? '×' : '−'}
                            </button>
                            <span className="text-[13px] w-5 text-center">{v.quantity}</span>
                            <button type="button" onClick={() => onQuantityChange(v.variantId, smartInc(v.quantity))}
                              className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[11px] hover:bg-white/20">+</button>
                          </div>
                        </div>
                      ));
                    })}
                  </div>
                );
              });
            })()}
          </div>
          <div className="space-y-4 pt-6 mt-6 border-t border-white">
            {/* Totals */}
            <div className="space-y-1">
              {servesEstimate > 0 && (
                <p className="text-[14px] ">
                  {isFr ? `Pour environ ${servesEstimate} personnes` : `Serves approx. ${servesEstimate} people`}
                </p>
              )}
            </div>

            {/* Fulfillment toggle */}
            <div>
              <div className="flex gap-2">
                {(['pickup', 'delivery'] as const).map((type) => (
                  <button key={type} type="button"
                    onClick={() => onFulfillmentTypeChange(type)}
                    disabled={type === 'delivery' && deliveryDisabled}
                    className={`flex-1 py-2 text-[14px] rounded-full border transition-colors ${
                      fulfillmentType === type
                        ? 'border-white bg-white text-[#0065B6]'
                        : 'border-white text-white hover:bg-white/10 disabled: disabled:cursor-not-allowed'
                    }`}
                  >
                    {type === 'pickup' ? V.pickup : V.delivery}
                  </button>
                ))}
              </div>
            </div>

            {/* Date — label left, input right */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px]">{isFr ? 'Date de cueillette' : 'Pickup date'}</p>
                  {!fulfillmentDate && totalQuantity > 0 && (
                    <span className="text-[12px]" style={{ color: '#EBE000' }}>{V.noDateError}</span>
                  )}
                </div>
                <p className="text-[11px] mt-1">
                  {isFr ? "Pas de cueillette le dimanche" : "No pickup on Sundays"}
                </p>
              </div>
              <DatePickerField
                value={toDateValue(fulfillmentDate)}
                minValue={minDateValue ?? today(getLocalTimeZone())}
                maxValue={maxDateValue ?? undefined}
                isDateUnavailable={(date: DateValue) => isSundayUnavailable(date.toDate(getLocalTimeZone()))}
                onChange={(val: DateValue | null) => {
                  if (val) {
                    onDateChange(`${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`);
                  } else { onDateChange(''); }
                }} />
            </div>
            {dateWarning && <p className="text-[12px]" style={{ color: "#EBE000" }} role="alert">{dateWarning}</p>}

            {/* Allergen note */}
            <div>
              <label className="text-[14px]  block mb-1">{V.allergenNote}</label>
              <textarea value={allergenNote} onChange={(e) => onAllergenNoteChange(e.target.value)} rows={2}
                className="w-full px-4 py-2 text-[14px] border border-white rounded-lg focus:outline-none transition-colors resize-none bg-transparent text-white placeholder:text-white/30"
                placeholder={V.allergenPlaceholder} />
            </div>

            {checkoutError && <p className="text-[12px] text-red-300">{checkoutError}</p>}
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
  const [typeSettings, setTypeSettings] = useState<Record<string, CateringTypeConfig>>({});

  // Clean up orphaned cart entries when products load
  useEffect(() => {
    if (products.length === 0) return;
    const validIds = new Set<string>();
    for (const p of products) {
      validIds.add(p.id);
      for (const v of p.variants) validIds.add(v.id);
    }
    setCart((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (!validIds.has(key)) { next.delete(key); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [products]);

  const DEFAULT_TYPE_CONFIG: CateringTypeConfig = { orderScope: 'order', orderMinimum: 1, variantMinimum: 0, increment: 1, unitLabel: 'quantity', maxAdvanceDays: null, leadTimeTiers: [] };
  const getTypeConfig = useCallback((product: VolumeProduct): CateringTypeConfig => {
    return typeSettings[product.cateringType ?? ''] ?? DEFAULT_TYPE_CONFIG;
  }, [typeSettings]);

  // Filters — from taxonomy API
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [temperatureFilter, setTemperatureFilter] = useState<string>('');
  const [availableDietaryTags, setAvailableDietaryTags] = useState<string[]>([]);
  const [availableTemperatureTags, setAvailableTemperatureTags] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/settings/taxonomies/cateringDietary')
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; archived?: boolean }> }) => {
        setAvailableDietaryTags((data.values ?? []).filter((d) => !d.archived).map((d) => d.value));
      }).catch(() => {});
    fetch('/api/settings/taxonomies/cateringTemperature')
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; archived?: boolean }> }) => {
        setAvailableTemperatureTags((data.values ?? []).filter((d) => !d.archived).map((d) => d.value));
      }).catch(() => {});
  }, []);

  const TYPE_LABELS: Record<string, Record<string, string>> = {
    brunch: { en: 'Brunch', fr: 'Brunch' },
    lunch: { en: 'Lunch', fr: 'Lunch' },
    dinatoire: { en: 'Dînatoire', fr: 'Dînatoire' },
  };
  const TYPE_ORDER = ['brunch', 'lunch', 'dinatoire'];

  // Filter — dietary/temperature only applies to dinatoire
  const filteredProducts = useMemo(() => {
    return products.filter((p) => !p.cateringEndDate || new Date(p.cateringEndDate) > new Date());
  }, [products]);

  // Only show filter tags that exist on at least one dinatoire product
  const dinatoireProducts = useMemo(() => filteredProducts.filter((p) => p.cateringType === 'dinatoire'), [filteredProducts]);
  const visibleDietaryTags = useMemo(() => availableDietaryTags.filter((tag) => dinatoireProducts.some((p) => p.dietaryTags?.includes(tag))), [availableDietaryTags, dinatoireProducts]);
  const visibleTemperatureTags = useMemo(() => availableTemperatureTags.filter((tag) => dinatoireProducts.some((p) => p.temperatureTags?.includes(tag))), [availableTemperatureTags, dinatoireProducts]);

  const filteredDinatoireProducts = useMemo(() => {
    let result = dinatoireProducts;
    if (dietaryFilter.length > 0) {
      result = result.filter((p) => dietaryFilter.some((tag) => p.dietaryTags?.includes(tag)));
    }
    if (temperatureFilter) {
      result = result.filter((p) => p.temperatureTags?.includes(temperatureFilter));
    }
    return result;
  }, [dinatoireProducts, dietaryFilter, temperatureFilter]);

  // Group by catering type
  const groupedProducts = useMemo(() => {
    const groups: Record<string, VolumeProduct[]> = {};
    for (const type of TYPE_ORDER) groups[type] = [];
    groups['other'] = [];
    for (const p of filteredProducts) {
      const key = p.cateringType && TYPE_ORDER.includes(p.cateringType) ? p.cateringType : 'other';
      if (key === 'dinatoire') continue; // handled separately
      groups[key].push(p);
    }
    groups['dinatoire'] = filteredDinatoireProducts;
    return groups;
  }, [filteredProducts, filteredDinatoireProducts]);

  const hasGroups = useMemo(() => TYPE_ORDER.some((t) => groupedProducts[t].length > 0), [groupedProducts]);

  // Report count — moved after cartGroups declaration
  
  const [fulfillmentDate, setFulfillmentDate] = useState('');
  const [fulfillmentTime, setFulfillmentTime] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [allergenNote, setAllergenNote] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#144437');
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Listen for blue sidebar tab click
  useEffect(() => {
    const handler = () => setShowMobileCart(true);
    window.addEventListener('open-order-cart', handler);
    return () => window.removeEventListener('open-order-cart', handler);
  }, []);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json())
      .then((data) => {
        if (data.brandColor) setBrandColor(data.brandColor);
      }).catch(() => {});
  }, []);

  const { maxLeadTimeDays, earliestDateStr } = useMemo(() => {
    let maxDays = 0;
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0) {
        const config = getTypeConfig(product);
        const days = getLeadTimeDays(config.leadTimeTiers || [], totalQty);
        if (days > maxDays) maxDays = days;
      }
    }
    return { maxLeadTimeDays: maxDays, earliestDateStr: toDateString(getEarliestDate(maxDays)) };
  }, [products, cart, getTypeConfig]);

  // Max advance date — use the smallest maxAdvanceDays across types in cart
  const latestDateStr = useMemo(() => {
    let minAdvance: number | null = null;
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0) {
        const config = getTypeConfig(product);
        if (config.maxAdvanceDays) {
          if (minAdvance === null || config.maxAdvanceDays < minAdvance) {
            minAdvance = config.maxAdvanceDays;
          }
        }
      }
    }
    if (minAdvance === null) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minAdvance);
    return toDateString(d);
  }, [products, cart, getTypeConfig]);

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
        const config = getTypeConfig(product);
        const translatedName = (locale === 'fr' ? product.translations?.fr?.title : null) || product.title || product.name;
        groups.push({ productId: product.id, productName: translatedName, shopifyProductId: product.shopifyProductId ?? null, basePrice: product.price ?? 0, allergens: product.allergens || [], volumeUnitLabel: config.unitLabel ?? 'quantity', cateringType: product.cateringType ?? '', servesPerUnit: product.servesPerUnit, variants, totalQty: variants.reduce((s, v) => s + v.quantity, 0), totalPrice: variants.reduce((s, v) => s + v.price * v.quantity, 0) });
      }
    }
    return groups;
  }, [products, cart, locale]);

  const totalQuantity = useMemo(() => cartGroups.reduce((s, g) => s + g.totalQty, 0), [cartGroups]);
  const subtotal = useMemo(() => cartGroups.reduce((s, g) => s + g.totalPrice, 0), [cartGroups]);

  // Report cart count from valid groups only
  useEffect(() => {
    setVolumeCount(totalQuantity);
    try { localStorage.setItem('rhubarbe:volume:count', String(totalQuantity)); } catch {}
  }, [totalQuantity, setVolumeCount]);

  const servesEstimate = useMemo(() => {
    const items: Array<{ quantity: number; servesPerUnit: number | null }> = [];
    for (const product of products) {
      const totalQty = getTotalQuantity(product, cart);
      if (totalQty > 0) items.push({ quantity: totalQty, servesPerUnit: product.servesPerUnit });
    }
    return calculateServesEstimate(items);
  }, [products, cart]);

  const hasMinViolation = useMemo(() => {
    // Group quantities by catering type for order-scope checks
    const typeTotals = new Map<string, number>();
    for (const p of products) {
      const qty = getTotalQuantity(p, cart);
      if (qty === 0) continue;
      const type = p.cateringType ?? '';
      typeTotals.set(type, (typeTotals.get(type) ?? 0) + qty);
    }

    return products.some((p) => {
      const qty = getTotalQuantity(p, cart);
      if (qty === 0) return false;
      const config = getTypeConfig(p);
      if (config.orderScope === 'variant') {
        return p.variants.some((v) => {
          const q = cart.get(v.id) ?? 0;
          if (q === 0) return false;
          if (q < config.variantMinimum) return true;
          if (config.increment > 0 && (q - config.variantMinimum) % config.increment !== 0) return true;
          return false;
        });
      } else {
        // Order-scope: check total across all products of the same type
        const typeTotal = typeTotals.get(p.cateringType ?? '') ?? 0;
        if (typeTotal < config.orderMinimum) return true;
        return false;
      }
    });
  }, [products, cart, getTypeConfig]);

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
      .then((data: { products: VolumeProduct[]; cateringTypeSettings?: Record<string, CateringTypeConfig> }) => {
        setProducts(data.products ?? data as unknown as VolumeProduct[]);
        if (data.cateringTypeSettings) setTypeSettings(data.cateringTypeSettings);
      })
      .catch(() => setError(V.loadError))
      .finally(() => setLoading(false));
  }, [isFr]);

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div>
        <div>
          {loading && (
            <CateringCardSkeleton />
          )}
          {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20"><p className="text-sm text-gray-400">{V.noProducts}</p></div>
          )}
          {!loading && !error && products.length > 0 && (
            <>
              {/* Brunch & Lunch — side by side on desktop */}
              <div className="md:grid md:grid-cols-2 md:gap-8 mb-12">
              {['brunch', 'lunch'].map((type) => {
                const items = groupedProducts[type];
                if (items.length === 0) return null;
                const config = typeSettings[type];
                const min = config?.orderScope === 'variant' ? config?.variantMinimum : config?.orderMinimum;
                const inc = config?.increment || 1;
                const unit = config?.unitLabel === 'people' ? (isFr ? 'pers.' : 'people') : '';
                const smartInc = (cur: number) => {
                  if (config?.orderScope === 'variant' && cur === 0) return config?.variantMinimum || inc;
                  return cur + inc;
                };
                const smartDec = (cur: number) => {
                  const n = cur - inc;
                  if (config?.orderScope === 'variant' && n < (config?.variantMinimum ?? 0)) return 0;
                  return n < 0 ? 0 : n;
                };
                return (
                  <div key={type}>
                    <h2 className="text-[40px] leading-none mb-2" style={{ color: '#1A3821' }}>
                      {TYPE_LABELS[type]?.[locale] ?? type}
                    </h2>
                    {config && min != null && min > 0 && (
                      <p className="text-[14px] mb-2" style={{ color: 'rgba(26,56,33,0.4)' }}>
                        min {min}{unit ? ` ${unit}` : ''}{inc > 1 ? `, +${inc}` : ''}
                      </p>
                    )}
                    {(() => {
                      const typeServes = items.reduce((s, p) => {
                        const qty = getTotalQuantity(p, cart);
                        return s + qty * (p.servesPerUnit ?? 0);
                      }, 0);
                      return typeServes > 0 ? (
                        <p className="text-[14px] mb-4" style={{ color: 'rgba(26,56,33,0.4)' }}>
                          {isFr ? `≈ ${typeServes} personnes` : `≈ ${typeServes} people`}
                        </p>
                      ) : <div className="mb-4" />;
                    })()}
                    {items.map((product) => {
                      const name = (isFr ? product.translations?.fr?.title : null) || product.title || product.name;
                      const allergens = (product.allergens ?? []);
                      const price = product.price;
                      const hasVariants = product.variants.length > 1;
                      return (
                        <div key={product.id}>
                          {hasVariants ? product.variants.map((v) => {
                            const qty = cart.get(v.id) ?? 0;
                            const vLabel = tr(v.label, locale);
                            return (
                              <div key={v.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[14px]" style={{ color: '#1A3821' }}>{name}</span>
                                  <span className="text-[12px] ml-1.5" style={{ color: 'rgba(26,56,33,0.4)' }}>{vLabel}</span>
                                  {allergens.map((a) => (
                                    <span key={a} className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ml-1.5 border border-gray-200 text-gray-400">{a}</span>
                                  ))}
                                </div>
                                {(v.price ?? price) != null && (v.price ?? price)! > 0 && (
                                  <span className="text-[13px] shrink-0" style={{ color: 'rgba(26,56,33,0.4)' }}>${((v.price ?? price)! / 100).toFixed(2)}</span>
                                )}
                                {qty === 0 ? (
                                  <button type="button" onClick={() => handleQuantityChange(v.id, smartInc(0))}
                                    className="w-[76px] h-6 text-[12px] text-center rounded-full border border-gray-300 hover:border-[#1A3821] transition-colors shrink-0" style={{ color: '#1A3821' }}>
                                    {isFr ? 'ajouter' : 'add'}
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button type="button" onClick={() => handleQuantityChange(v.id, smartDec(qty))}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>
                                      {smartDec(qty) === 0 ? '×' : '−'}
                                    </button>
                                    <span className="text-[13px] font-medium w-4 text-center" style={{ color: '#1A3821' }}>{qty}</span>
                                    <button type="button" onClick={() => handleQuantityChange(v.id, smartInc(qty))}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>+</button>
                                  </div>
                                )}
                              </div>
                            );
                          }) : (() => {
                            const vid = product.variants.length > 0 ? product.variants[0].id : product.id;
                            const qty = cart.get(vid) ?? 0;
                            return (
                              <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[14px]" style={{ color: '#1A3821' }}>{name}</span>
                                  {allergens.map((a) => (
                                    <span key={a} className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ml-1.5 border border-gray-200 text-gray-400">{a}</span>
                                  ))}
                                </div>
                                {price != null && price > 0 && (
                                  <span className="text-[13px] shrink-0" style={{ color: 'rgba(26,56,33,0.4)' }}>${(price / 100).toFixed(2)}</span>
                                )}
                                {qty === 0 ? (
                                  <button type="button" onClick={() => handleQuantityChange(vid, smartInc(0))}
                                    className="w-[76px] h-6 text-[12px] text-center rounded-full border border-gray-300 hover:border-[#1A3821] transition-colors shrink-0" style={{ color: '#1A3821' }}>
                                    {isFr ? 'ajouter' : 'add'}
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button type="button" onClick={() => handleQuantityChange(vid, smartDec(qty))}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>
                                      {smartDec(qty) === 0 ? '×' : '−'}
                                    </button>
                                    <span className="text-[13px] font-medium w-4 text-center" style={{ color: '#1A3821' }}>{qty}</span>
                                    <button type="button" onClick={() => handleQuantityChange(vid, smartInc(qty))}
                                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>+</button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              </div>

              {/* Dînatoire — condensed list rows */}
              {groupedProducts['dinatoire'].length > 0 && (() => {
                const dinatoireConfig = typeSettings['dinatoire'];
                const min = dinatoireConfig?.orderMinimum ?? 3;
                const inc = dinatoireConfig?.increment ?? 1;
                const items = groupedProducts['dinatoire'];

                // Sub-group by temperature then dietary category
                const hotItems = items.filter((p) => p.temperatureTags?.includes('hot') || p.temperatureTags?.includes('chaud'));
                const coldItems = items.filter((p) => p.temperatureTags?.includes('cold') || p.temperatureTags?.includes('froid'));
                const otherItems = items.filter((p) => !hotItems.includes(p) && !coldItems.includes(p));

                const catOrder = ['vegetarian', 'végétarien', 'fish', 'poisson', 'meat', 'viande'];
                const groupByDietary = (list: VolumeProduct[]) => {
                  const groups: { label: string; items: VolumeProduct[] }[] = [];
                  const used = new Set<string>();
                  for (const cat of catOrder) {
                    const matching = list.filter((p) => p.dietaryTags?.some((t) => t.toLowerCase() === cat));
                    if (matching.length === 0) continue;
                    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                    if (used.has(label.toLowerCase())) continue;
                    used.add(label.toLowerCase());
                    groups.push({ label, items: matching });
                  }
                  const ungrouped = list.filter((p) => !groups.some((g) => g.items.includes(p)));
                  if (ungrouped.length > 0) groups.push({ label: isFr ? 'Autre' : 'Other', items: ungrouped });
                  return groups;
                };

                const renderRow = (product: VolumeProduct) => {
                  const name = (isFr ? product.translations?.fr?.title : null) || product.title || product.name;
                  const allergens = (product.allergens ?? []).filter((a) => !['vegetarian', 'végétarien', 'fish', 'poisson', 'meat', 'viande', 'hot', 'cold', 'chaud', 'froid'].includes(a.toLowerCase()));
                  const price = product.price;
                  const vid = product.variants.length > 0 ? product.variants[0].id : product.id;
                  const qty = cart.get(vid) ?? 0;
                  const isHot = product.temperatureTags?.some((t) => ['hot', 'chaud'].includes(t.toLowerCase()));

                  return (
                    <div key={product.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isHot ? 'bg-[#FC260B]' : 'bg-[#0072CA]'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px]" style={{ color: '#1A3821' }}>{name}</span>
                        {allergens.length > 0 && allergens.map((a) => (
                          <span key={a} className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium ml-1.5 border border-gray-200 text-gray-400">{a}</span>
                        ))}
                      </div>
                      {price != null && price > 0 && (
                        <span className="text-[13px] shrink-0" style={{ color: 'rgba(26,56,33,0.4)' }}>${(price / 100).toFixed(2)}</span>
                      )}
                      {qty === 0 ? (
                        <button type="button"
                          onClick={() => handleQuantityChange(vid, dinatoireConfig?.variantMinimum || inc)}
                          className="w-[76px] h-6 text-[12px] text-center rounded-full border border-gray-300 hover:border-[#1A3821] transition-colors" style={{ color: '#1A3821' }}>
                          {isFr ? 'ajouter' : 'add'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button"
                            onClick={() => handleQuantityChange(vid, Math.max(0, qty - inc))}
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>
                            {qty <= inc ? '×' : '−'}
                          </button>
                          <span className="text-[13px] font-medium w-4 text-center" style={{ color: '#1A3821' }}>{qty}</span>
                          <button type="button"
                            onClick={() => handleQuantityChange(vid, qty + inc)}
                            className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-[14px] hover:bg-gray-100 transition-colors" style={{ color: '#1A3821' }}>+</button>
                        </div>
                      )}
                    </div>
                  );
                };

                const renderSection = (label: string, productList: VolumeProduct[]) => {
                  if (productList.length === 0) return null;
                  const subgroups = groupByDietary(productList);
                  return (
                    <div className="mb-6">
                      <div className="text-[11px] font-medium uppercase tracking-wider mb-3 pb-1.5 border-b border-gray-200" style={{ color: 'rgba(26,56,33,0.4)' }}>
                        {label}
                      </div>
                      {subgroups.map((sg) => (
                        <div key={sg.label} className="mb-3">
                          <p className="text-[12px] font-medium mb-1" style={{ color: 'rgba(26,56,33,0.5)' }}>{sg.label}</p>
                          {sg.items.map(renderRow)}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div key="dinatoire" className="mb-12">
                    <h2 className="text-[40px] leading-none mb-2" style={{ color: '#1A3821' }}>
                      {TYPE_LABELS['dinatoire']?.[locale] ?? 'Dînatoire'}
                    </h2>
                    <p className="text-[14px] mb-2" style={{ color: 'rgba(26,56,33,0.4)' }}>
                      min {min}{inc > 1 ? `, +${inc}` : ''}
                      {(() => {
                        const dinatoireTotal = items.reduce((s, p) => s + getTotalQuantity(p, cart), 0);
                        if (dinatoireTotal > 0 && dinatoireTotal < min) {
                          return <span className="ml-3 text-[14px]" style={{ color: '#FC260B' }}>
                            {isFr ? `sélectionnez au moins ${min}` : `select at least ${min}`}
                          </span>;
                        }
                        return null;
                      })()}
                    </p>
                    {(() => {
                      const typeServes = items.reduce((s, p) => {
                        const qty = getTotalQuantity(p, cart);
                        return s + qty * (p.servesPerUnit ?? 0);
                      }, 0);
                      return typeServes > 0 ? (
                        <p className="text-[14px] mb-4" style={{ color: 'rgba(26,56,33,0.4)' }}>
                          {isFr ? `≈ ${typeServes} personnes` : `≈ ${typeServes} people`}
                        </p>
                      ) : <div className="mb-4" />;
                    })()}

                    {/* Filters — temperature hidden on desktop, dietary only */}
                    <div className="flex flex-wrap items-baseline gap-8 mb-6">
                      {/* Temperature filters — hidden on md+ (hot/cold shown side by side instead) */}
                      <div className="md:hidden flex flex-wrap items-center gap-2">
                        {visibleTemperatureTags.map((tag) => {
                          const isActive = temperatureFilter === tag;
                          return (
                            <button key={tag} type="button"
                              onClick={() => setTemperatureFilter((prev) => prev === tag ? '' : tag)}
                              className={`px-3 py-1 text-[12px] rounded-full border transition-colors ${isActive ? 'bg-[#1A3821] text-white border-[#1A3821]' : 'border-gray-300 text-gray-500 hover:border-[#1A3821]'}`}>
                              {tag}
                            </button>
                          );
                        })}
                        {visibleTemperatureTags.length > 0 && visibleDietaryTags.length > 0 && (
                          <span className="text-gray-300">|</span>
                        )}
                      </div>
                      {visibleDietaryTags.map((tag) => {
                        const isActive = dietaryFilter.includes(tag);
                        const count = dinatoireProducts.filter((p) => p.dietaryTags?.includes(tag)).length;
                        return (
                          <button key={tag} type="button"
                            onClick={() => setDietaryFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                            className="text-[36px] leading-none transition-colors"
                            style={{ color: isActive ? '#1A3821' : 'rgba(26,56,33,0.4)' }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#D49BCB'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                          >
                            {tag}<sup className="text-[14px] ml-[2px]">{count}</sup>
                          </button>
                        );
                      })}
                      {(dietaryFilter.length > 0 || temperatureFilter) && (
                        <button type="button" onClick={() => { setDietaryFilter([]); setTemperatureFilter(''); }}
                          className="text-[12px] text-gray-400 hover:text-gray-600">clear</button>
                      )}
                    </div>

                    {/* Desktop: hot left, cold right */}
                    <div className="hidden md:grid md:grid-cols-2 md:gap-8">
                      <div>
                        {hotItems.length > 0 && renderSection(isFr ? 'Bouchées chaudes' : 'Hot bites', hotItems)}
                      </div>
                      <div>
                        {coldItems.length > 0 && renderSection(isFr ? 'Bouchées froides' : 'Cold bites', coldItems)}
                      </div>
                    </div>
                    {/* Mobile: stacked */}
                    <div className="md:hidden">
                      {hotItems.length > 0 && renderSection(isFr ? 'Bouchées chaudes' : 'Hot bites', hotItems)}
                      {coldItems.length > 0 && renderSection(isFr ? 'Bouchées froides' : 'Cold bites', coldItems)}
                    </div>
                    {otherItems.length > 0 && renderSection(
                      hotItems.length === 0 && coldItems.length === 0
                        ? (TYPE_LABELS['dinatoire']?.[locale] ?? 'Dînatoire')
                        : (isFr ? 'Autre' : 'Other'),
                      otherItems
                    )}
                  </div>
                );
              })()}

              {/* Ungrouped products */}
              {groupedProducts['other'].length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {groupedProducts['other'].map((product) => (
                    <VolumeProductCard key={product.id} product={product} locale={locale}
                      cart={cart} onQuantityChange={handleQuantityChange} brandColor={brandColor} V={V} typeConfig={getTypeConfig(product)} typeTotalQty={getTotalQuantity(product, cart)} />
                  ))}
                </div>
              )}
              {filteredProducts.length === 0 && products.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">{isFr ? 'Aucun produit ne correspond aux filtres.' : 'No products match the selected filters.'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Catering cart slide-in panel */}
      <OrderCartPanel open={showMobileCart} onClose={() => setShowMobileCart(false)} title={isFr ? 'Votre panier' : 'Your cart'} itemCount={totalQuantity}
        footer={totalQuantity > 0 ? (
          <button onClick={() => { setShowMobileCart(false); handleCheckout(); }}
            disabled={checkoutLoading || !fulfillmentDate || !!dateWarning || hasMinViolation} data-checkout
            className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[16px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6">
            <span>{checkoutLoading ? V.loading : V.checkout}</span>
            <span>{subtotal > 0 ? `$${(subtotal / 100).toFixed(2)}` : ''}</span>
          </button>
        ) : undefined}>
        <VolumeInlineCart groups={cartGroups} totalQuantity={totalQuantity} subtotal={subtotal}
          fulfillmentDate={fulfillmentDate} fulfillmentTime={fulfillmentTime}
          fulfillmentType={fulfillmentType} allergenNote={allergenNote}
          dateWarning={dateWarning} earliestDateStr={earliestDateStr}
          maxLeadTimeDays={maxLeadTimeDays} servesEstimate={servesEstimate}
          onDateChange={setFulfillmentDate} onTimeChange={setFulfillmentTime}
          onFulfillmentTypeChange={setFulfillmentType} onAllergenNoteChange={setAllergenNote}
          onCheckout={() => { setShowMobileCart(false); handleCheckout(); }}
          onRemoveProduct={handleRemoveProduct}
          onQuantityChange={handleQuantityChange}
          getTypeConfig={(g: CartGroup) => typeSettings[g.cateringType] ?? DEFAULT_TYPE_CONFIG}
          checkoutLoading={checkoutLoading} checkoutError={checkoutError}
          locale={locale} hasMinViolation={hasMinViolation} deliveryDisabled={deliveryDisabled} V={V} latestDateStr={latestDateStr} />
      </OrderCartPanel>
    </main>
  );
}
