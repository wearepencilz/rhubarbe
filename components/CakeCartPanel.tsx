'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useCakeCart, type CakeCartItem } from '@/contexts/CakeCartContext';
import { resolvePricingGridPrice, getTierDetailForSize } from '@/lib/utils/order-helpers';
import type { PricingGridRow, CakeTierDetailEntry } from '@/lib/utils/order-helpers';
import CartFulfillmentSection from '@/components/CartFulfillmentSection';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';

// ── Types (mirrors CakeOrderPageClient) ──

interface TranslationObject { en: string; fr: string; }
interface LeadTimeTier { minPeople: number; leadTimeDays: number; deliveryOnly: boolean; }
interface CakeFlavourEntry {
  handle: string; label: { en: string; fr: string }; active: boolean;
  endDate: string | null; allergens?: string[];
}
interface AddonProduct {
  id: string; name: string; title: { en: string; fr: string };
  image: string | null; cakeDescription: { en: string; fr: string };
  cakeProductType: string | null; cakeMinPeople?: number | null; cakeMaxPeople?: number | null;
  pricingGrid: PricingGridRow[]; cakeFlavourConfig?: CakeFlavourEntry[];
}
interface CakeProduct {
  id: string; name: string; image: string | null; cakeProductType: string | null;
  cakeMinPeople: number; cakeMaxPeople: number | null;
  leadTimeTiers: LeadTimeTier[]; pricingGrid: PricingGridRow[];
  cakeFlavourConfig: CakeFlavourEntry[]; cakeTierDetailConfig: CakeTierDetailEntry[];
  cakeMaxFlavours: number | null; addons: AddonProduct[];
  allergens: string[]; maxAdvanceDays: number | null;
  pricingTiers: Array<{ minPeople: number; priceInCents: number; shopifyVariantId: string }>;
}

// ── Helpers ──

function tr(f: TranslationObject | null | undefined, locale: string) {
  if (!f) return '';
  return locale === 'fr' ? (f.fr || f.en) : (f.en || '');
}
function isGridBased(p: CakeProduct) { return !!p.cakeProductType && p.cakeProductType !== 'wedding-cake-tasting'; }
function isTasting(p: CakeProduct) { return p.cakeProductType === 'wedding-cake-tasting'; }
function isCroquembouche(p: CakeProduct) { return p.cakeProductType === 'croquembouche'; }
const CROQ = 3;

function getAvailableSizes(grid: PricingGridRow[]) {
  const seen = new Set<string>(); const sizes: string[] = [];
  for (const r of grid) { if (!seen.has(r.sizeValue)) { seen.add(r.sizeValue); sizes.push(r.sizeValue); } }
  return sizes;
}
function resolveNearestSize(sizes: string[], input: number): string | null {
  const nums = sizes.map((s) => ({ s, n: parseInt(s) })).filter((x) => !isNaN(x.n)).sort((a, b) => b.n - a.n);
  for (const x of nums) { if (x.n <= input) return x.s; }
  return null;
}
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toDateValue(s: string): DateValue | null {
  if (!s) return null; try { return parseDate(s); } catch { return null; }
}
function formatDateHuman(s: string, locale: string) {
  try { return new Date(s+'T00:00:00').toLocaleDateString(locale==='fr'?'fr-CA':'en-CA',{weekday:'short',month:'short',day:'numeric'}); }
  catch { return s; }
}
function getEarliestDate(days: number) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+days); return d;
}

// ── TierDiagram ──

function TierDiagram({ tierDetail }: { tierDetail: CakeTierDetailEntry }) {
  const diameters = tierDetail.diameters.split('/').map(Number).filter(Boolean);
  if (!diameters.length) return null;
  const max = diameters[0]; const W = 140;
  return (
    <div className="flex flex-col items-center py-2">
      {[...diameters].reverse().map((d, i) => (
        <div key={i} className="rounded-sm mx-auto" style={{ width:`${Math.max((d/max)*W,20)}px`, height:'18px', backgroundColor:'rgba(255,255,255,0.6)', marginBottom: i < diameters.length-1 ? '2px' : 0, borderRadius:'2px' }} />
      ))}
      <div className="mx-auto mt-1 rounded-sm" style={{ width:`${W+10}px`, height:'4px', backgroundColor:'rgba(255,255,255,0.3)' }} />
    </div>
  );
}

// ── Pure price computation (used by both row display and panel total) ──

export function computeItemPrice(item: CakeCartItem, product: CakeProduct): number | null {
  const isGrid = isGridBased(product);
  const isTast = isTasting(product);
  const isCroq = isCroquembouche(product);
  const sizeNum = parseInt(item.size) || 0;
  if (!sizeNum) return isTast && product.pricingGrid.length > 0 ? product.pricingGrid[0].priceInCents : null;

  if (isTast) return product.pricingGrid.length > 0 ? product.pricingGrid[0].priceInCents : null;

  if (!isGrid) return null;

  const lookupSize = isCroq ? sizeNum * CROQ : sizeNum;
  const resolvedSize = resolveNearestSize(getAvailableSizes(product.pricingGrid), lookupSize);
  if (!resolvedSize) return null;

  let base: number | null = null;
  if (isCroq) {
    const h = item.flavourHandles[0] || 'default';
    const r = resolvePricingGridPrice(product.pricingGrid, resolvedSize, h);
    if (r) base = r.priceInCents;
    else {
      const any = product.pricingGrid.find((row) => row.sizeValue === resolvedSize);
      if (any) base = any.priceInCents;
    }
  } else {
    if (!item.flavourHandles.length) return null;
    const r = resolvePricingGridPrice(product.pricingGrid, resolvedSize, item.flavourHandles[0]);
    if (r) base = r.priceInCents;
  }
  if (base == null) return null;

  const addons = product.addons ?? [];
  const regularAddons = addons.filter((a) => a.cakeProductType !== 'sheet-cake');
  const sheetAddons = addons.filter((a) => a.cakeProductType === 'sheet-cake');
  let addonTotal = 0;

  for (const addonId of item.addonIds) {
    const addon = regularAddons.find((a) => a.id === addonId);
    if (!addon) continue;
    const p = resolvePricingGridPrice(addon.pricingGrid, resolvedSize, 'default');
    if (p) addonTotal += p.priceInCents;
  }
  for (const sheetAddon of sheetAddons) {
    if (!item.addonIds.includes(sheetAddon.id)) continue;
    const sheetSize = item.addonSizes[sheetAddon.id];
    if (!sheetSize || !item.sheetCakeFlavour) continue;
    const sr = resolveNearestSize(getAvailableSizes(sheetAddon.pricingGrid), parseInt(sheetSize));
    if (!sr) continue;
    const sp = resolvePricingGridPrice(sheetAddon.pricingGrid, sr, item.sheetCakeFlavour);
    if (sp) addonTotal += sp.priceInCents;
    for (const rid of item.sheetCakeAddonIds) {
      const ra = regularAddons.find((a) => a.id === rid);
      if (!ra) continue;
      const rp = resolvePricingGridPrice(ra.pricingGrid, sr, 'default');
      if (rp) addonTotal += rp.priceInCents;
    }
  }
  return base + addonTotal;
}

// ── Cart Item Row ──

function CakeCartItemRow({ item, product, locale, isFr, onUpdate, onRemove, earliestDateStr }: {
  item: CakeCartItem; product: CakeProduct; locale: string; isFr: boolean;
  onUpdate: (patch: Partial<CakeCartItem>) => void; onRemove: () => void;
  earliestDateStr: string;
}) {
  const isGrid = isGridBased(product);
  const isTast = isTasting(product);
  const isCroq = isCroquembouche(product);
  const sizeNum = parseInt(item.size) || 0;
  const lookupSize = isCroq ? sizeNum * CROQ : sizeNum;
  const resolvedSize = isGrid && item.size ? resolveNearestSize(getAvailableSizes(product.pricingGrid), lookupSize) : null;

  const tastingPrice = isTast && product.pricingGrid.length > 0 ? product.pricingGrid[0].priceInCents : null;
  const tierDetail = useMemo(() => resolvedSize ? getTierDetailForSize(product.cakeTierDetailConfig, resolvedSize) : null, [resolvedSize, product.cakeTierDetailConfig]);

  const gridMinSize = useMemo(() => {
    const sizes = getAvailableSizes(product.pricingGrid).map(Number).filter(Boolean);
    if (!sizes.length) return 0;
    const min = Math.min(...sizes);
    return isCroq ? Math.ceil(min / CROQ) : min;
  }, [product.pricingGrid, isCroq]);

  const gridMaxSize = product.cakeMaxPeople ?? null;
  const belowMin = isGrid && sizeNum > 0 && (isCroq ? sizeNum * CROQ : sizeNum) < (getAvailableSizes(product.pricingGrid).map(Number).filter(Boolean).reduce((a, b) => Math.min(a, b), Infinity) || 0);

  const addons = product.addons ?? [];
  const displayPrice = computeItemPrice(item, product);

  const flavourNames = item.flavourHandles.map((h) => {
    const f = product.cakeFlavourConfig.find((fl) => fl.handle === h);
    return f ? tr(f.label, locale) : h;
  });

  const allergens = useMemo(() => {
    const all = new Set(product.allergens ?? []);
    for (const h of item.flavourHandles) {
      const f = product.cakeFlavourConfig.find((fl) => fl.handle === h);
      f?.allergens?.forEach((a) => all.add(a));
    }
    return Array.from(all);
  }, [product, item.flavourHandles]);

  return (
    <div className="space-y-3 pb-4 border-b border-white last:border-b-0">
      {/* Name + remove */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[16px] font-medium">{product.name}</p>
          {flavourNames.length > 0 && <p className="text-[14px] opacity-80">{flavourNames.join(', ')}</p>}
        </div>
        <button onClick={onRemove} className="text-[14px] hover:opacity-70 shrink-0">{isFr ? 'retirer' : 'remove'}</button>
      </div>

      {/* Size input (grid-based) */}
      {isGrid && (
        <div className="flex flex-col gap-1">
          <label className="text-[14px]">{isFr ? 'Invités' : 'Guests'}</label>
          <input type="number" min={1} value={item.size || ''} placeholder=""
            onChange={(e) => { const v = e.target.value; onUpdate({ size: v === '' ? '' : String(Math.max(0, Math.floor(Number(v)||0))) }); }}
            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none bg-transparent ${belowMin ? 'border-red-300' : 'border-white focus:border-white'}`}
            aria-label={isFr ? 'Invités' : 'Guests'} />
          {belowMin && <p className="text-[12px] text-[#EBE000]">{isFr ? `Minimum ${gridMinSize}` : `Minimum ${gridMinSize}`}</p>}
          {gridMaxSize && sizeNum > gridMaxSize && <p className="text-[12px] text-[#EBE000]">{isFr ? `Maximum ${gridMaxSize}` : `Maximum ${gridMaxSize}`}</p>}
        </div>
      )}

      {/* Tier diagram */}
      {tierDetail && (
        <div className="space-y-1">
          <p className="text-[14px]">{isFr ? `${tierDetail.layers} étage${tierDetail.layers>1?'s':''}: ${tierDetail.diameters} pouces` : `${tierDetail.layers} tier${tierDetail.layers>1?'s':''}: ${tierDetail.diameters} inches`}</p>
          <TierDiagram tierDetail={tierDetail} />
        </div>
      )}

      {/* Tasting fixed price */}
      {isTast && tastingPrice != null && (
        <div className="flex justify-between text-sm font-semibold">
          <span>{isFr ? 'Dégustation' : 'Tasting'}</span>
          <span>${(tastingPrice/100).toFixed(2)}</span>
        </div>
      )}

      {/* Regular add-ons */}
      {isGrid && addons.filter((a) => a.cakeProductType !== 'sheet-cake').length > 0 && (
        <>
          <hr className="border-white" />
          <div className="space-y-2">
            {addons.filter((a) => a.cakeProductType !== 'sheet-cake').map((addon) => {
              const isEnabled = item.addonIds.includes(addon.id);
              let priceCents = 0;
              if (resolvedSize) { const p = resolvePricingGridPrice(addon.pricingGrid, resolvedSize, 'default'); if (p) priceCents = p.priceInCents; }
              return (
                <div key={addon.id} className="flex items-center justify-between gap-2">
                  <p className="text-[14px] flex-1 min-w-0">{tr(addon.title, locale)}</p>
                  {priceCents > 0 && <span className="text-[14px] shrink-0">+${(priceCents/100).toFixed(2)}</span>}
                  <button type="button" disabled={!resolvedSize}
                    onClick={() => onUpdate({ addonIds: isEnabled ? item.addonIds.filter((id) => id !== addon.id) : [...item.addonIds, addon.id] })}
                    className={`px-3 py-1 text-[12px] rounded-full border transition-colors shrink-0 ${!resolvedSize ? 'opacity-30 cursor-not-allowed border-white' : isEnabled ? 'border-white bg-white text-[#0065B6]' : 'border-white hover:bg-white/10'}`}
                    aria-pressed={isEnabled}>
                    {isEnabled ? '✓' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sheet cake add-on */}
      {isGrid && addons.some((a) => a.cakeProductType === 'sheet-cake') && (() => {
        const sheetAddon = addons.find((a) => a.cakeProductType === 'sheet-cake')!;
        const sheetEnabled = item.addonIds.includes(sheetAddon.id);
        const sheetSize = item.addonSizes[sheetAddon.id] || '';
        const sheetResolved = sheetSize ? resolveNearestSize(getAvailableSizes(sheetAddon.pricingGrid), parseInt(sheetSize)) : null;
        const sheetFlavours = (sheetAddon as any).cakeFlavourConfig as CakeFlavourEntry[] | undefined;
        const sheetPrice = (sheetResolved && item.sheetCakeFlavour) ? resolvePricingGridPrice(sheetAddon.pricingGrid, sheetResolved, item.sheetCakeFlavour) : null;
        const regularAddons = addons.filter((a) => a.cakeProductType !== 'sheet-cake');
        return (
          <>
            <hr className="border-white" />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] flex-1">{tr(sheetAddon.title, locale)}</p>
                <button type="button"
                  onClick={() => { const next = sheetEnabled ? item.addonIds.filter((id) => id !== sheetAddon.id) : [...item.addonIds, sheetAddon.id]; onUpdate({ addonIds: next, ...(sheetEnabled ? { sheetCakeAddonIds: [], sheetCakeFlavour: '', addonSizes: { ...item.addonSizes, [sheetAddon.id]: '' } } : {}) }); }}
                  className={`px-3 py-1 text-[12px] rounded-full border transition-colors shrink-0 ${sheetEnabled ? 'border-white bg-white text-[#0065B6]' : 'border-white hover:bg-white/10'}`}
                  aria-pressed={sheetEnabled}>
                  {sheetEnabled ? '✓' : '+'}
                </button>
              </div>
              {sheetEnabled && (
                <div className="space-y-2">
                  {sheetFlavours && sheetFlavours.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-[14px] uppercase tracking-wide">{isFr ? 'Saveur' : 'Flavour'}</span>
                      <select value={item.sheetCakeFlavour} onChange={(e) => onUpdate({ sheetCakeFlavour: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-white rounded bg-transparent text-white focus:outline-none">
                        <option value="">{isFr ? 'Choisir…' : 'Select…'}</option>
                        {sheetFlavours.filter((f) => f.active).map((f) => <option key={f.handle} value={f.handle}>{tr(f.label, locale)}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-[14px] uppercase tracking-wide">{isFr ? 'Invités' : 'Guests'}</span>
                    <input type="number" min={sheetAddon.cakeMinPeople ?? 1} value={sheetSize} placeholder=""
                      onChange={(e) => { const v = e.target.value; onUpdate({ addonSizes: { ...item.addonSizes, [sheetAddon.id]: v === '' ? '' : String(Math.max(0, Math.floor(Number(v)||0))) } }); }}
                      className="w-full px-2 py-1.5 text-xs border border-white rounded bg-transparent text-white focus:outline-none" />
                  </div>
                  {sheetPrice && sheetSize && (
                    <div className="flex justify-between text-[14px]">
                      <span>{sheetSize} {isFr ? 'invités' : 'guests'}</span>
                      <span>${(sheetPrice.priceInCents/100).toFixed(2)}</span>
                    </div>
                  )}
                  {regularAddons.length > 0 && sheetResolved && (
                    <div className="space-y-1.5">
                      {regularAddons.map((addon) => {
                        const isOn = item.sheetCakeAddonIds.includes(addon.id);
                        const ap = resolvePricingGridPrice(addon.pricingGrid, sheetResolved!, 'default');
                        return (
                          <div key={addon.id} className="flex items-center justify-between gap-2">
                            <p className="text-[14px] flex-1">{tr(addon.title, locale)}</p>
                            {ap && <span className="text-[12px] shrink-0">+${(ap.priceInCents/100).toFixed(2)}</span>}
                            <button type="button"
                              onClick={() => onUpdate({ sheetCakeAddonIds: isOn ? item.sheetCakeAddonIds.filter((id) => id !== addon.id) : [...item.sheetCakeAddonIds, addon.id] })}
                              className={`px-3 py-1 text-[12px] rounded-full border transition-colors shrink-0 ${isOn ? 'border-white bg-white text-[#0065B6]' : 'border-white hover:bg-white/10'}`}
                              aria-pressed={isOn}>
                              {isOn ? '✓' : '+'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Price + allergens */}
      {displayPrice != null && (
        <div className="flex justify-between text-[16px]">
          <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
          <span className="font-medium">${(displayPrice/100).toFixed(2)}</span>
        </div>
      )}
      {allergens.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] shrink-0">{isFr ? 'Contient' : 'Contains'}</span>
          {allergens.map((a) => <span key={a} className="px-2 py-0.5 rounded-full text-[12px] border border-white">{a}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Main CakeCartPanel ──

export default function CakeCartPanel({ onCheckout, checkoutLoading, checkoutError, locale }: {
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
  locale: string;
}) {
  const { items, fulfillment, updateItem, removeItem, setFulfillment } = useCakeCart();
  const isFr = locale === 'fr';
  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [deliveryMinForAnyday, setDeliveryMinForAnyday] = useState(200000);
  const [closedPickupDays, setClosedPickupDays] = useState<number[]>([0]);

  useEffect(() => {
    fetch('/api/storefront/cake-products').then((r) => r.json()).then(setProducts).catch(() => {});
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      if (d.deliveryMinForAnyday != null) setDeliveryMinForAnyday(d.deliveryMinForAnyday);
      if (d.closedPickupDays) setClosedPickupDays(d.closedPickupDays);
    }).catch(() => {});
  }, []);

  // Sync computedPrice into context whenever items or products change
  useEffect(() => {
    if (!products.length) return;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const price = computeItemPrice(item, product);
      if (price !== item.computedPrice) updateItem(item.cartId, { computedPrice: price });
    }
  }, [items, products]);

  // Compute max lead time across all items
  const { maxLeadTimeDays, earliestDateStr } = useMemo(() => {
    let max = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const size = parseInt(item.size) || 1;
      const applicable = product.leadTimeTiers.filter((t) => t.minPeople <= size).sort((a, b) => b.minPeople - a.minPeople);
      const days = applicable[0]?.leadTimeDays ?? 0;
      if (days > max) max = days;
    }
    const d = getEarliestDate(max);
    return { maxLeadTimeDays: max, earliestDateStr: toDateString(d) };
  }, [items, products]);

  // Fetch blocked dates
  useEffect(() => {
    if (!items.length) return;
    const from = toDateString(new Date());
    const to = toDateString(new Date(Date.now() + 90 * 86400000));
    fetch(`/api/cake-capacity?from=${from}&to=${to}&leadTime=${maxLeadTimeDays || 7}`)
      .then((r) => r.json()).then((d) => { if (d.blockedDates) setBlockedDates(new Set(d.blockedDates)); }).catch(() => {});
  }, [maxLeadTimeDays, items.length]);

  // Date warning
  const dateWarning = useMemo(() => {
    if (!fulfillment.pickupDate) return null;
    if (fulfillment.pickupDate < earliestDateStr) return isFr ? `Date trop tôt — choisissez le ${earliestDateStr} ou après` : `Date too early — choose ${earliestDateStr} or later`;
    if (blockedDates.has(fulfillment.pickupDate)) return isFr ? 'Cette date est complète' : 'This date is fully booked';
    return null;
  }, [fulfillment.pickupDate, earliestDateStr, blockedDates, isFr]);

  const isDeliveryOnly = useMemo(() => {
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const size = parseInt(item.size) || 1;
      const applicable = product.leadTimeTiers.filter((t) => t.minPeople <= size).sort((a, b) => b.minPeople - a.minPeople);
      if (applicable[0]?.deliveryOnly) return true;
    }
    return false;
  }, [items, products]);

  useEffect(() => {
    if (isDeliveryOnly && fulfillment.fulfillmentType !== 'delivery') setFulfillment({ fulfillmentType: 'delivery' });
  }, [isDeliveryOnly]);

  const totalPrice = useMemo(() =>
    items.reduce((s, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return s;
      return s + (computeItemPrice(item, product) ?? 0);
    }, 0),
  [items, products]);

  const canCheckout = items.length > 0 && !!fulfillment.pickupDate && !dateWarning;

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[16px]">{isFr ? 'Aucun gâteau sélectionné' : 'No cakes selected'}</p>
        <p className="text-[14px] mt-1 opacity-60">{isFr ? 'Choisissez un gâteau pour commencer' : 'Choose a cake to get started'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items */}
      <div className="space-y-4">
        {items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return (
            <CakeCartItemRow key={item.cartId} item={item} product={product} locale={locale} isFr={isFr}
              onUpdate={(patch) => updateItem(item.cartId, patch)}
              onRemove={() => removeItem(item.cartId)}
              earliestDateStr={earliestDateStr} />
          );
        })}
      </div>

      {/* Est total */}
      {totalPrice > 0 && (
        <div className="flex justify-between text-[16px] pt-2 border-t border-white">
          <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
          <span className="font-medium">${(totalPrice / 100).toFixed(2)}</span>
        </div>
      )}

      {/* Earliest pickup */}
      {maxLeadTimeDays > 0 && (
        <p className="text-[16px]">{isFr ? 'Cueillette au plus tôt\u00a0: ' : 'Earliest pickup: '}{formatDateHuman(earliestDateStr, locale)}</p>
      )}

      {/* Shared fulfillment */}
      <CartFulfillmentSection
        locale={locale}
        fulfillmentType={fulfillment.fulfillmentType}
        onFulfillmentTypeChange={(t) => setFulfillment({ fulfillmentType: t })}
        pickupDisabled={isDeliveryOnly}
        showDeliveryAddress
        deliveryAddress={fulfillment.deliveryAddress}
        onDeliveryAddressChange={(a) => setFulfillment({ deliveryAddress: a })}
        date={fulfillment.pickupDate}
        onDateChange={(d) => setFulfillment({ pickupDate: d })}
        dateValue={toDateValue(fulfillment.pickupDate)}
        minDateValue={toDateValue(earliestDateStr) ?? undefined}
        isDateUnavailable={(date: DateValue) => {
          const s = `${date.year}-${String(date.month).padStart(2,'0')}-${String(date.day).padStart(2,'0')}`;
          if (blockedDates.has(s)) return true;
          if (totalPrice >= deliveryMinForAnyday) return false;
          return closedPickupDays.includes(date.toDate(getLocalTimeZone()).getDay());
        }}
        dateWarning={dateWarning}
        noDateError={!fulfillment.pickupDate}
        noDateErrorText={isFr ? 'Veuillez sélectionner une date' : 'Please select a date'}
        dateLabel="Date"
        showEventType
        eventType={fulfillment.eventType}
        onEventTypeChange={(t) => setFulfillment({ eventType: t })}
        specialInstructions={fulfillment.specialInstructions}
        onSpecialInstructionsChange={(s) => setFulfillment({ specialInstructions: s })}
        checkoutError={checkoutError}
      />
    </div>
  );
}
