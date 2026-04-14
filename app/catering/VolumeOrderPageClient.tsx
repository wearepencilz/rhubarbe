'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { usePersistedState, mapSerializer } from '@/lib/hooks/use-persisted-state';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import { calculateServesEstimate, isSundayUnavailable } from '@/lib/utils/order-helpers';
import { CateringCardSkeleton } from '@/components/ui/OrderPageSkeleton';
import CateringHeader from './CateringHeader';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
import OrderCartPanel from '@/components/OrderCartPanel';
import CartFulfillmentSection from '@/components/CartFulfillmentSection';


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
  const tempTag = product.cateringType === 'dinatoire' ? product.temperatureTags?.find((t) => ['hot', 'cold', 'chaud', 'froid'].includes(t.toLowerCase())) : undefined;

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
              <img src={displayImage} alt={displayName} loading="lazy" className="w-full h-full object-cover" />
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
            {tempTag && (
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-black border border-black">{tempTag}</span>
              </div>
            )}
          </>
        )}
        {/* State 2: Pink overlay with white badges + controls */}
        {showOverlay && (
          <div className="w-full h-full bg-[#0065B6] flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <div>
                {allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {allergens.map((a) => (
                      <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-white border border-white">{a}</span>
                    ))}
                  </div>
                )}
                {product.shortCardCopy && (
                  <p className="text-[16px] text-white" style={{ marginTop: allergens.length > 0 ? 16 : 0 }}>{product.shortCardCopy}</p>
                )}
              </div>
              {tempTag && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-white border border-white shrink-0">{tempTag}</span>
              )}
            </div>
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
                  className="w-full h-10 rounded-full bg-white text-[16px] text-[#0065B6] font-medium hover:bg-white/90">
                  {isFr ? 'Ajouter' : 'Add'}
                </button>
              ) : (
                <button type="button"
                  onClick={() => handleVariantQtyChange(product.variants[0].id, smartIncrement(0))}
                  className="w-full h-10 rounded-full bg-white text-[16px] text-[#0065B6] font-medium hover:bg-white/90">
                  {isFr ? 'Ajouter' : 'Add'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col pt-2.5 gap-0.5">
        <h3 className="text-[16px] leading-tight" style={{ fontWeight: 500, color: '#1A3821' }}>
          {displayName}
        </h3>
        {product.price != null && product.price > 0 && (
          <span className="text-[16px]" style={{ color: '#1A3821' }}>
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
            {isFr ? 'Ajouter' : 'Add'}
          </button>
        ) : !hasItems && product.variants.length > 0 ? (
          <button type="button"
            onClick={() => handleVariantQtyChange(product.variants[0].id, smartIncrement(0))}
            className="w-full h-8 border border-gray-300 text-[16px] font-medium hover:bg-gray-50 transition-colors">
            {isFr ? 'Ajouter' : 'Add'}
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
  deliveryMinForAnyday, closedPickupDays,
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
  deliveryMinForAnyday: number;
  closedPickupDays: number[];
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);
  const maxDateValue = latestDateStr ? toDateValue(latestDateStr) : undefined;

  return (
    <div>
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
                brunch: { en: 'Buffet', fr: 'Buffet' },
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
                          {isFr ? `Pour environ ${typeServes} personnes` : `Serves about ${typeServes} people`}
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
            {/* Est total */}
            <div className="flex items-center justify-between text-[16px]">
              <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
              <span className="font-medium">{subtotal > 0 ? `$${(subtotal / 100).toFixed(2)}` : '\u2014'}</span>
            </div>
            {/* Earliest pickup */}
            {maxLeadTimeDays > 0 && (
              <p className="text-[14px]">
                {isFr ? 'Cueillette au plus tôt\u00a0: ' : 'Earliest pickup: '}{formatDateHuman(earliestDateStr, locale)}
              </p>
            )}
            {/* Contains */}
            {(() => {
              const allAllergens = Array.from(new Set(groups.flatMap((g) => g.allergens || [])));
              if (allAllergens.length === 0) return null;
              return (
                <div className="flex items-center gap-3">
                  <p className="text-[14px] shrink-0">{isFr ? 'Contient' : 'Contains'}</p>
                  <div className="flex flex-wrap gap-1">
                    {allAllergens.map((a) => (
                      <span key={a} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] border border-white">{a}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Fulfillment section */}
            <CartFulfillmentSection
              locale={locale}
              fulfillmentType={fulfillmentType}
              onFulfillmentTypeChange={onFulfillmentTypeChange}
              deliveryDisabled={deliveryDisabled}
              date={fulfillmentDate}
              onDateChange={onDateChange}
              dateValue={toDateValue(fulfillmentDate)}
              minDateValue={minDateValue ?? undefined}
              maxDateValue={maxDateValue ?? undefined}
              isDateUnavailable={subtotal >= deliveryMinForAnyday ? undefined : (date: DateValue) => {
                const d = date.toDate(getLocalTimeZone());
                return closedPickupDays.includes(d.getDay());
              }}
              dateWarning={dateWarning}
              noDateError={!fulfillmentDate && totalQuantity > 0}
              noDateErrorText={isFr ? 'Veuillez sélectionner une date' : 'Please select a date'}
              dateLabel="Date"
              dateHint={subtotal >= deliveryMinForAnyday ? undefined : (() => {
                const dayNames = closedPickupDays.map((d) => DAY_LABELS[d]).join(', ');
                return isFr ? `Pas de cueillette le ${dayNames.toLowerCase()}` : `No pickup on ${dayNames}`;
              })()}
              allergenNote={allergenNote}
              onAllergenNoteChange={onAllergenNoteChange}
              allergenLabel={V.allergenNote}
              allergenPlaceholder={V.allergenPlaceholder}
              checkoutError={checkoutError}
            />
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
  const [deliveryMinForAnyday, setDeliveryMinForAnyday] = useState(200000);
  const [closedPickupDays, setClosedPickupDays] = useState<number[]>([0]);

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
  const [activeType, setActiveType] = useState<string>('');
  const [temperatureFilter, setTemperatureFilter] = useState<string[]>([]);
  const [availableDietaryTags, setAvailableDietaryTags] = useState<Array<{ value: string; label: string; fr?: string }>>([]);
  const [availableTemperatureTags, setAvailableTemperatureTags] = useState<Array<{ value: string; label: string; fr?: string }>>([]);

  useEffect(() => {
    fetch('/api/settings/taxonomies/cateringDietary')
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; label: string; archived?: boolean; translations?: { fr?: string } }> }) => {
        setAvailableDietaryTags((data.values ?? []).filter((d) => !d.archived).map((d) => ({ value: d.value, label: d.label, fr: d.translations?.fr })));
      }).catch(() => {});
    fetch('/api/settings/taxonomies/cateringTemperature')
      .then((r) => r.ok ? r.json() : { values: [] })
      .then((data: { values?: Array<{ value: string; label: string; archived?: boolean; translations?: { fr?: string } }> }) => {
        setAvailableTemperatureTags((data.values ?? []).filter((d) => !d.archived).map((d) => ({ value: d.value, label: d.label, fr: d.translations?.fr })));
      }).catch(() => {});
  }, []);

  const TYPE_LABELS: Record<string, Record<string, string>> = {
    brunch: { en: 'Buffet', fr: 'Buffet' },
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
  const visibleDietaryTags = useMemo(() => availableDietaryTags.filter((tag) => dinatoireProducts.some((p) => p.dietaryTags?.includes(tag.value))), [availableDietaryTags, dinatoireProducts]);
  const visibleTemperatureTags = useMemo(() => availableTemperatureTags.filter((tag) => dinatoireProducts.some((p) => p.temperatureTags?.includes(tag.value))), [availableTemperatureTags, dinatoireProducts]);

  const filteredDinatoireProducts = useMemo(() => {
    let result = dinatoireProducts;
    if (dietaryFilter.length > 0) {
      result = result.filter((p) => dietaryFilter.some((tag) => p.dietaryTags?.includes(tag)));
    }
    if (temperatureFilter.length) {
      result = result.filter((p) => temperatureFilter.some((tag) => p.temperatureTags?.includes(tag)));
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

  const headerTypes = useMemo(() => {
    return TYPE_ORDER
      .filter((t) => (t === 'dinatoire' ? dinatoireProducts.length > 0 : (groupedProducts[t]?.length ?? 0) > 0))
      .map((t) => {
        const allItems = t === 'dinatoire' ? dinatoireProducts : (groupedProducts[t] ?? []);
        const subs = visibleDietaryTags
          .filter((tag) => allItems.some((p) => p.dietaryTags?.includes(tag.value)))
          .map((tag) => {
            // Count products matching this dietary tag AND the current temperature filter
            const pool = temperatureFilter.length
              ? allItems.filter((p) => temperatureFilter.some((tf) => p.temperatureTags?.includes(tf)))
              : allItems;
            return { value: tag.value, label: isFr && tag.fr ? tag.fr : tag.label, count: pool.filter((p) => p.dietaryTags?.includes(tag.value)).length };
          });
        return { key: t, label: TYPE_LABELS[t]?.[locale] ?? t, count: allItems.length, subFilters: t === 'dinatoire' && subs.length > 1 ? subs : [], config: typeSettings[t] ?? null };
      });
  }, [groupedProducts, dinatoireProducts, visibleDietaryTags, typeSettings, locale, temperatureFilter]);

  useEffect(() => { if (!activeType && headerTypes.length > 0) setActiveType(headerTypes[0].key); }, [headerTypes, activeType]);

  const activeProducts = useMemo(() => {
    if (!activeType) return [];
    let all = activeType === 'dinatoire' ? dinatoireProducts : (groupedProducts[activeType] ?? []);
    if (dietaryFilter.length) all = all.filter((p) => dietaryFilter.some((tag) => p.dietaryTags?.includes(tag)));
    if (temperatureFilter.length) all = all.filter((p) => temperatureFilter.some((tag) => p.temperatureTags?.includes(tag)));
    return all;
  }, [activeType, groupedProducts, dinatoireProducts, dietaryFilter, temperatureFilter]);

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
      .then((data: any) => {
        setProducts(data.products ?? data as unknown as VolumeProduct[]);
        if (data.cateringTypeSettings) setTypeSettings(data.cateringTypeSettings);
        if (data.deliveryMinForAnyday != null) setDeliveryMinForAnyday(data.deliveryMinForAnyday);
        if (data.closedPickupDays) setClosedPickupDays(data.closedPickupDays);
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
              <CateringHeader
                types={headerTypes}
                activeType={activeType}
                onTypeChange={(t) => { setActiveType(t); setDietaryFilter([]); setTemperatureFilter([]); }}
                activeSubFilter={dietaryFilter}
                onSubFilterChange={setDietaryFilter}
                temperatureFilters={activeType === 'dinatoire' ? visibleTemperatureTags.map((tag) => {
                  // Count products matching this temp tag AND the current dietary filter
                  const pool = dietaryFilter.length
                    ? dinatoireProducts.filter((p) => dietaryFilter.some((d) => p.dietaryTags?.includes(d)))
                    : dinatoireProducts;
                  return {
                    value: tag.value,
                    label: isFr && tag.fr ? tag.fr : tag.label,
                    count: pool.filter((p) => p.temperatureTags?.includes(tag.value)).length,
                  };
                }) : []}
                activeTemperature={temperatureFilter}
                onTemperatureChange={setTemperatureFilter}
                hasMinViolation={(() => {
                  if (!activeType) return false;
                  const config = typeSettings[activeType];
                  if (!config) return false;
                  const typeProducts = activeType === 'dinatoire' ? dinatoireProducts : (groupedProducts[activeType] ?? []);
                  const typeTotal = typeProducts.reduce((s, p) => s + getTotalQuantity(p, cart), 0);
                  if (typeTotal === 0) return false;
                  if (config.orderScope === 'order') return typeTotal < config.orderMinimum;
                  if (config.orderScope === 'variant') {
                    return typeProducts.some((p) => p.variants.some((v) => {
                      const q = cart.get(v.id) ?? 0;
                      return q > 0 && q < config.variantMinimum;
                    }));
                  }
                  return false;
                })()}
                locale={locale}
              />
              {/* Active type products */}
              {activeProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">{isFr ? 'Aucun produit ne correspond aux filtres.' : 'No products match the selected filters.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ columnGap: 24, rowGap: 56 }}>
                  {activeProducts.map((product) => (
                    <VolumeProductCard key={product.id} product={product} locale={locale}
                      cart={cart} onQuantityChange={handleQuantityChange} brandColor={brandColor} V={V}
                      typeConfig={getTypeConfig(product)}
                      typeTotalQty={getTotalQuantity(product, cart)} />
                  ))}
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
          locale={locale} hasMinViolation={hasMinViolation} deliveryDisabled={deliveryDisabled} V={V} latestDateStr={latestDateStr}
          deliveryMinForAnyday={deliveryMinForAnyday} closedPickupDays={closedPickupDays} />
      </OrderCartPanel>
    </main>
  );
}
