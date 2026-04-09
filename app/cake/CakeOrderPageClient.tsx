'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { parseDate, getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';
import dynamic from 'next/dynamic';
import { getActivePricingTier, resolvePricingGridPrice, getTierDetailForSize } from '@/lib/utils/order-helpers';
import type { PricingGridRow, CakeTierDetailEntry } from '@/lib/utils/order-helpers';
import MobileCartModal from '@/components/ui/MobileCartModal';
import { ProductGridSkeleton } from '@/components/ui/OrderPageSkeleton';

const DatePickerField = dynamic(() => import('@/components/ui/DatePickerField'), { ssr: false });

// ── Types ──

interface TranslationObject {
  en: string;
  fr: string;
}

interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
  deliveryOnly: boolean;
}

interface PricingTier {
  minPeople: number;
  priceInCents: number;
  shopifyVariantId: string;
}

interface CakeFlavourEntry {
  handle: string;
  label: { en: string; fr: string };
  description: { en: string; fr: string } | null;
  pricingTierGroup: string | null;
  sortOrder: number;
  active: boolean;
  endDate: string | null;
  allergens?: string[];
}

interface AddonProduct {
  id: string;
  name: string;
  title: { en: string; fr: string };
  image: string | null;
  cakeDescription: { en: string; fr: string };
  cakeProductType: string | null;
  pricingGrid: PricingGridRow[];
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
  cakeMaxPeople: number | null;
  shortCardCopy: string | null;
  allergens: string[];
  leadTimeTiers: LeadTimeTier[];
  pricingTiers: PricingTier[];
  serves: string | null;
  // New fields for grid-based products
  cakeProductType: string | null;
  cakeFlavourConfig: CakeFlavourEntry[];
  cakeTierDetailConfig: CakeTierDetailEntry[];
  cakeMaxFlavours: number | null;
  pricingGrid: PricingGridRow[];
  addons: AddonProduct[];
  maxAdvanceDays: number | null;
}

// ── Cart persistence types ──

interface PersistedCart {
  productId: string;
  selectedFlavourHandles: string[];
  selectedSize: string;
  addonIds: string[];
  addonSizes?: Record<string, string>;
  sheetCakeAddonIds?: string[];
  sheetCakeFlavour?: string;
  computedPrice: number | null;
}

const CART_STORAGE_KEY = 'rhubarbe:cake:cart';

function saveCart(cart: PersistedCart | null) {
  try {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch {}
}

function loadCart(): PersistedCart | null {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Helpers ──

function isGridBased(product: CakeProduct): boolean {
  return !!product.cakeProductType && product.cakeProductType !== 'wedding-cake-tasting';
}

function isTasting(product: CakeProduct): boolean {
  return product.cakeProductType === 'wedding-cake-tasting';
}

function isLegacy(product: CakeProduct): boolean {
  return !product.cakeProductType;
}

function isCroquembouche(product: CakeProduct): boolean {
  return product.cakeProductType === 'croquembouche';
}

const CROQ_CHOUX_PER_GUEST = 3;

/** Check if a product is only used as an addon (linked by another product) */
function isAddonProduct(product: CakeProduct, allProducts: CakeProduct[]): boolean {
  return allProducts.some((p) => p.addons?.some((a) => a.id === product.id));
}

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

function getActiveLeadTimeTier(tiers: LeadTimeTier[], numberOfPeople: number): LeadTimeTier | null {
  const applicable = tiers
    .filter((t) => t.minPeople <= numberOfPeople)
    .sort((a, b) => b.minPeople - a.minPeople);
  return applicable[0] ?? null;
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

/** Derive distinct size options from a pricing grid */
function getAvailableSizes(grid: PricingGridRow[]): string[] {
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const row of grid) {
    if (!seen.has(row.sizeValue)) {
      seen.add(row.sizeValue);
      sizes.push(row.sizeValue);
    }
  }
  return sizes;
}

/**
 * Find the best matching size tier: largest numeric sizeValue that is ≤ the input number.
 * Returns the matching sizeValue string, or null if none applies.
 */
function resolveNearestSize(availableSizes: string[], inputValue: number): string | null {
  const numericSizes = availableSizes
    .map((s) => ({ str: s, num: parseInt(s) }))
    .filter((s) => !isNaN(s.num))
    .sort((a, b) => b.num - a.num); // descending
  for (const size of numericSizes) {
    if (size.num <= inputValue) return size.str;
  }
  return null;
}


// ── Flavour Dropdown Component (inside card) ──

function FlavourDropdown({
  product, locale, selectedFlavourHandles, onToggleFlavour, earliestDateStr,
}: {
  product: CakeProduct;
  locale: string;
  selectedFlavourHandles: string[];
  onToggleFlavour: (handle: string) => void;
  earliestDateStr: string;
}) {
  const isFr = locale === 'fr';
  const isMulti = isCroquembouche(product) || isTasting(product);
  const maxFlavours = product.cakeMaxFlavours ?? 3;

  // Filter out flavours whose endDate (minus lead time) makes them unorderable
  const availableFlavours = product.cakeFlavourConfig.filter((f) => {
    if (!f.endDate) return true;
    return f.endDate >= earliestDateStr;
  });

  if (isMulti) {
    // Multi-select for croquembouche: show checkboxes in a compact list
    const atLimit = selectedFlavourHandles.length >= maxFlavours;
    return (
      <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {isFr ? `Saveurs (max ${maxFlavours})` : `Flavours (max ${maxFlavours})`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableFlavours.filter((f) => f.handle !== 'custom').map((flavour) => {
            const isSelected = selectedFlavourHandles.includes(flavour.handle);
            const disabled = !isSelected && atLimit;
            return (
              <button
                key={flavour.handle}
                type="button"
                onClick={() => { if (!disabled) onToggleFlavour(flavour.handle); }}
                disabled={disabled}
                className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-[#333112] text-white border-[#333112]'
                    : disabled
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {tr(flavour.label, locale)}
              </button>
            );
          })}
        </div>
        {atLimit && (
          <p className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {isFr ? `Maximum ${maxFlavours} atteint` : `Max ${maxFlavours} reached`}
          </p>
        )}
      </div>
    );
  }

  // Single-select dropdown for XXL / wedding cakes
  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <select
        value={selectedFlavourHandles[0] || ''}
        onChange={(e) => onToggleFlavour(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#333112] bg-white text-gray-700"
        style={{ fontFamily: 'var(--font-diatype-mono)' }}
      >
        {availableFlavours.map((flavour) => (
          <option key={flavour.handle} value={flavour.handle}>
            {tr(flavour.label, locale)}
            {flavour.handle === 'custom' ? (isFr ? ' — contactez-nous' : ' — contact us') : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Tier Diagram Component ──

function TierDiagram({ tierDetail }: { tierDetail: CakeTierDetailEntry }) {
  const diameters = tierDetail.diameters.split('/').map(Number).filter(Boolean);
  if (diameters.length === 0) return null;

  // Diameters are listed largest-to-smallest (e.g., "12/9/6" = bottom 12", middle 9", top 6")
  // Render bottom-to-top visually: reverse so smallest is at top
  const layers = [...diameters]; // already largest first
  const maxDiameter = layers[0];
  const containerWidth = 140; // px

  return (
    <div className="flex flex-col items-center py-2">
      {/* Render smallest (top) first, largest (bottom) last */}
      {[...layers].reverse().map((d, i) => {
        const widthPx = Math.max((d / maxDiameter) * containerWidth, 20);
        return (
          <div
            key={i}
            className="rounded-sm mx-auto"
            style={{
              width: `${widthPx}px`,
              height: '18px',
              backgroundColor: '#333112',
              marginBottom: i < layers.length - 1 ? '2px' : '0',
              borderRadius: '2px',
            }}
          />
        );
      })}
      {/* Base plate */}
      <div
        className="mx-auto mt-1 rounded-sm"
        style={{
          width: `${containerWidth + 10}px`,
          height: '4px',
          backgroundColor: '#333112',
          opacity: 0.4,
        }}
      />
    </div>
  );
}


// ── Product Card ──

function CakeProductCard({
  product, locale, isSelected, onSelect, brandColor, numberOfPeople, C,
  selectedFlavourHandles, onToggleFlavour, earliestDateStr,
}: {
  product: CakeProduct;
  locale: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  brandColor: string;
  numberOfPeople: number;
  C: Record<string, any>;
  selectedFlavourHandles: string[];
  onToggleFlavour: (handle: string) => void;
  earliestDateStr: string;
}) {
  const description = tr(product.cakeDescription, locale);
  const flavourNotes = tr(product.cakeFlavourNotes, locale);
  const isFr = locale === 'fr';

  // Price display: legacy uses pricing tiers, tasting uses fixed price, grid-based shows nothing on card
  const activeTier = isLegacy(product) ? getActivePricingTier(product.pricingTiers, numberOfPeople) : null;
  const tastingPrice = isTasting(product) && product.pricingGrid.length > 0
    ? product.pricingGrid[0].priceInCents
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className={`group flex flex-col text-left transition-all rounded-lg border border-gray-200 ${
        isSelected
          ? 'ring-2 ring-[#333112] ring-offset-2'
          : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
      }`}
      aria-pressed={isSelected}
      aria-label={`${product.name}${isSelected ? ` (${C.selected})` : ''}`}
    >
      {product.image ? (
        <div className="p-2 pb-0">
          <div className="aspect-[4/5] overflow-hidden bg-gray-100 rounded-md relative">
            <img src={product.image} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {isSelected && (
              <div className="absolute top-2 right-2 bg-[#333112] text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {C.selected}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2 pb-0">
          <div className="aspect-[4/5] rounded-md relative" style={{ backgroundColor: brandColor }}>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-[#333112] text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {C.selected}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 px-2 pt-3 pb-3">
        <h3 className="text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
          {product.name}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {activeTier && (
            <span>${(activeTier.priceInCents / 100).toFixed(2)}</span>
          )}
          {tastingPrice != null && (
            <span>${(tastingPrice / 100).toFixed(2)}</span>
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

        {/* Flavour dropdown (inside card, only when selected) */}
        {isSelected && (isGridBased(product) || isTasting(product)) && product.cakeFlavourConfig.length > 0 && (
          <FlavourDropdown
            product={product}
            locale={locale}
            selectedFlavourHandles={selectedFlavourHandles}
            onToggleFlavour={onToggleFlavour}
            earliestDateStr={earliestDateStr}
          />
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
  locale, belowMin, isDeliveryOnly, C,
  // New props for grid-based products
  selectedFlavourHandles, selectedSize, onSizeChange,
  resolvedSize,
  gridPrice, tierDetail, addons, enabledAddonIds, onToggleAddon, addonSizes, onAddonSizeChange, sheetCakeAddonIds, onToggleSheetAddon, sheetCakeFlavour, onSheetCakeFlavourChange,
  gridMinSize, gridMaxSize, blockedDates, latestDateStr,
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
  isDeliveryOnly: boolean;
  C: Record<string, any>;
  // New props
  selectedFlavourHandles: string[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  resolvedSize: string;
  gridPrice: { priceInCents: number; shopifyVariantId: string | null } | null;
  tierDetail: CakeTierDetailEntry | null;
  addons: AddonProduct[];
  enabledAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
  addonSizes: Record<string, string>;
  onAddonSizeChange: (addonId: string, size: string) => void;
  sheetCakeAddonIds: string[];
  onToggleSheetAddon: (addonId: string) => void;
  sheetCakeFlavour: string;
  onSheetCakeFlavourChange: (handle: string) => void;
  gridMinSize: number;
  gridMaxSize: number | null;
  blockedDates: Set<string>;
  latestDateStr: string | null;
}) {
  const isFr = locale === 'fr';
  const minDateValue = toDateValue(earliestDateStr);
  const maxDateValue = latestDateStr ? toDateValue(latestDateStr) : undefined;
  const [headcountTouched, setHeadcountTouched] = useState(false);

  const isDateUnavailable = useCallback((date: DateValue) => {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return blockedDates.has(dateStr);
  }, [blockedDates]);

  const isGridProduct = selectedProduct ? isGridBased(selectedProduct) : false;
  const isTastingProduct = selectedProduct ? isTasting(selectedProduct) : false;
  const isLegacyProduct = selectedProduct ? isLegacy(selectedProduct) : false;
  const isCroq = selectedProduct ? isCroquembouche(selectedProduct) : false;

  const availableSizes = useMemo(() => {
    if (!selectedProduct || !isGridProduct) return [];
    return getAvailableSizes(selectedProduct.pricingGrid);
  }, [selectedProduct, isGridProduct]);

  const sizeLabel = isFr ? 'Invités' : 'Guests';

  // For legacy products: min people from pricing tiers
  const minPeople = selectedProduct?.pricingTiers?.length
    ? selectedProduct.pricingTiers.slice().sort((a, b) => a.minPeople - b.minPeople)[0].minPeople
    : 1;
  const headcountValid = numberOfPeople >= minPeople;

  // Compute the effective price to display
  const displayPrice = isGridProduct ? gridPrice?.priceInCents ?? null : calculatedPrice;

  // Compute addon total
  // Add-ons are priced per-cake: once at main cake tier, once at sheet cake tier
  const addonTotal = useMemo(() => {
    if (!selectedProduct || enabledAddonIds.length === 0) return 0;
    let total = 0;

    const sheetCakeAddons: AddonProduct[] = [];
    const regularAddons: AddonProduct[] = [];
    for (const addonId of enabledAddonIds) {
      const addon = addons.find((a) => a.id === addonId);
      if (!addon) continue;
      if (addon.cakeProductType === 'sheet-cake') sheetCakeAddons.push(addon);
      else regularAddons.push(addon);
    }

    // Regular add-ons at main cake tier
    if (resolvedSize) {
      for (const addon of regularAddons) {
        const price = resolvePricingGridPrice(addon.pricingGrid, resolvedSize, 'default');
        if (price) total += price.priceInCents;
      }
    }

    // Each sheet cake: its own price + regular add-ons at sheet cake tier
    for (const sheetAddon of sheetCakeAddons) {
      const sheetSize = addonSizes[sheetAddon.id];
      if (!sheetSize || !sheetCakeFlavour) continue;
      const sheetResolved = resolveNearestSize(getAvailableSizes(sheetAddon.pricingGrid), parseInt(sheetSize));
      if (!sheetResolved) continue;
      const sheetPrice = resolvePricingGridPrice(sheetAddon.pricingGrid, sheetResolved, sheetCakeFlavour);
      if (sheetPrice) total += sheetPrice.priceInCents;
      // Add-ons at sheet cake tier
      for (const addonId of sheetCakeAddonIds) {
        const addon = regularAddons.find((a) => a.id === addonId);
        if (!addon) continue;
        const price = resolvePricingGridPrice(addon.pricingGrid, sheetResolved, 'default');
        if (price) total += price.priceInCents;
      }
    }

    return total;
  }, [selectedProduct, enabledAddonIds, sheetCakeAddonIds, sheetCakeFlavour, resolvedSize, addons, addonSizes]);

  // Selected flavour names and allergens for display
  const selectedFlavourNames = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedFlavourHandles
      .map((h) => selectedProduct.cakeFlavourConfig.find((f) => f.handle === h))
      .filter(Boolean)
      .map((f) => tr(f!.label, locale));
  }, [selectedProduct, selectedFlavourHandles, locale]);

  const selectedFlavourAllergens = useMemo(() => {
    if (!selectedProduct) return [];
    const all = new Set<string>();
    for (const h of selectedFlavourHandles) {
      const f = selectedProduct.cakeFlavourConfig.find((fl) => fl.handle === h);
      f?.allergens?.forEach((a) => all.add(a));
    }
    // Also include product-level allergens
    selectedProduct.allergens?.forEach((a) => all.add(a));
    return Array.from(all);
  }, [selectedProduct, selectedFlavourHandles]);

  const aboveMax = gridMaxSize != null && parseInt(selectedSize) > gridMaxSize;

  // Can checkout?
  const canCheckout = useMemo(() => {
    if (!selectedProduct || !pickupDate || !!dateWarning || belowMin || aboveMax) return false;
    if (isTastingProduct) return true;
    if (isGridProduct) {
      // Croquembouche can checkout with just size (flavours are optional metadata)
      if (isCroq) return !!gridPrice && !!selectedSize;
      return !!gridPrice && selectedFlavourHandles.length > 0 && !!selectedSize;
    }
    // Legacy
    return calculatedPrice != null;
  }, [selectedProduct, pickupDate, dateWarning, belowMin, aboveMax, isTastingProduct, isGridProduct, isCroq, gridPrice, selectedFlavourHandles, selectedSize, calculatedPrice]);

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
        <div className="px-5 py-4 space-y-4">
          {/* 1. Cake name + remove */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{selectedProduct.name}</p>
              <button onClick={onRemove}
                className="text-[11px] text-gray-400 underline hover:text-red-500 shrink-0"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {isFr ? 'retirer' : 'remove'}
              </button>
            </div>
            {/* Show selected flavour names */}
            {selectedFlavourNames.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {selectedFlavourNames.join(', ')}
              </p>
            )}
            {selectedFlavourAllergens.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {isFr ? 'peut contenir' : 'may contain'}: {selectedFlavourAllergens.join(', ')}
              </p>
            )}
          </div>

          {/* 2a. Legacy: Headcount input → resolved price */}
          {isLegacyProduct && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  {C.numberOfPeople}
                </label>
                <input type="number" min={1}
                  value={numberOfPeople || ''}
                  placeholder=""
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { onNumberOfPeopleChange(0); return; }
                    onNumberOfPeopleChange(Math.max(0, Math.floor(Number(raw) || 0)));
                  }}
                  onBlur={() => {
                    setHeadcountTouched(true);
                    if (numberOfPeople < 1) onNumberOfPeopleChange(1);
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none transition-colors bg-transparent ${
                    headcountTouched && belowMin ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                  }`}
                  aria-label={C.numberOfPeople} />
                {headcountTouched && belowMin && (
                  <p className="text-xs text-red-500 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {isFr ? `Minimum ${minPeople} personnes` : `Minimum ${minPeople} people`}
                  </p>
                )}
              </div>

              {calculatedPrice != null ? (
                <div className="flex justify-between text-sm font-semibold">
                  <span>{numberOfPeople} {C.numberOfPeopleShort}</span>
                  <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${(calculatedPrice / 100).toFixed(2)}
                  </span>
                </div>
              ) : belowMin ? null : (
                selectedProduct.pricingTiers.length === 0
                  ? <p className="text-xs text-gray-400">{C.noPricing}</p>
                  : null
              )}
            </>
          )}

          {/* 2b. Grid-based: Number input → resolved price */}
          {isGridProduct && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  {sizeLabel}
                </label>
                <input
                  type="number"
                  min={1}
                  value={selectedSize || ''}
                  placeholder=""
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') { onSizeChange(''); return; }
                    onSizeChange(String(Math.max(0, Math.floor(Number(raw) || 0))));
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none transition-colors bg-transparent ${
                    belowMin ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-gray-900'
                  }`}
                  aria-label={sizeLabel}
                />
                {belowMin && (
                  <p className="text-xs text-red-500 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {isFr ? `Minimum ${gridMinSize}` : `Minimum ${gridMinSize}`}
                  </p>
                )}
                {gridMaxSize && parseInt(selectedSize) > gridMaxSize && (
                  <p className="text-xs text-red-500 mt-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {isFr ? `Maximum ${gridMaxSize}` : `Maximum ${gridMaxSize}`}
                  </p>
                )}
              </div>

              {/* Resolved price — show for croquembouche even without flavour, and for others with flavour */}
              {gridPrice && selectedSize && (isCroq || selectedFlavourHandles.length > 0) && (
                <div className="flex justify-between text-sm font-semibold">
                  <span>{selectedSize} {sizeLabel.toLowerCase()}</span>
                  <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${(gridPrice.priceInCents / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Tier detail display */}
              {tierDetail && (
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-600" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {isFr
                      ? `${tierDetail.layers} étage${tierDetail.layers > 1 ? 's' : ''}: ${tierDetail.diameters} pouces`
                      : `${tierDetail.layers} tier${tierDetail.layers > 1 ? 's' : ''}: ${tierDetail.diameters} inches`}
                  </p>
                  <TierDiagram tierDetail={tierDetail} />
                </div>
              )}
            </>
          )}

          {/* 2c. Tasting: fixed price display */}
          {isTastingProduct && selectedProduct.pricingGrid.length > 0 && (
            <div className="flex justify-between text-sm font-semibold">
              <span>{isFr ? 'Dégustation' : 'Tasting'}</span>
              <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                ${(selectedProduct.pricingGrid[0].priceInCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Add-ons for main cake (non-sheet-cake only) */}
          {isGridProduct && addons.filter((a) => a.cakeProductType !== 'sheet-cake').length > 0 && (
            <>
              <hr className="border-gray-200" />
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {isFr ? 'Options' : 'Add-ons'}
                </p>
                {addons.filter((a) => a.cakeProductType !== 'sheet-cake').map((addon) => {
                  const isEnabled = enabledAddonIds.includes(addon.id);
                  let priceCents = 0;
                  if (resolvedSize) {
                    const p = resolvePricingGridPrice(addon.pricingGrid, resolvedSize, 'default');
                    if (p) priceCents = p.priceInCents;
                  }
                  return (
                    <div key={addon.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">{tr(addon.title, locale)}</p>
                        {priceCents > 0 && (
                          <p className="text-[11px] text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>+${(priceCents / 100).toFixed(2)}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => onToggleAddon(addon.id)} disabled={!resolvedSize}
                        className={`relative w-9 h-5 rounded-full transition-colors ${!resolvedSize ? 'bg-gray-200 cursor-not-allowed' : isEnabled ? 'bg-[#333112]' : 'bg-gray-300'}`}
                        aria-label={`${isEnabled ? 'Remove' : 'Add'} ${tr(addon.title, locale)}`} aria-pressed={isEnabled}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Sheet cake section */}
          {isGridProduct && addons.some((a) => a.cakeProductType === 'sheet-cake') && (() => {
            const sheetAddon = addons.find((a) => a.cakeProductType === 'sheet-cake')!;
            const sheetEnabled = enabledAddonIds.includes(sheetAddon.id);
            const sheetSize = addonSizes[sheetAddon.id] || '';
            const sheetResolved = sheetSize ? resolveNearestSize(getAvailableSizes(sheetAddon.pricingGrid), parseInt(sheetSize)) : null;
            const sheetFlavourHandle = sheetCakeFlavour || '';
            const sheetPrice = (sheetResolved && sheetFlavourHandle)
              ? resolvePricingGridPrice(sheetAddon.pricingGrid, sheetResolved, sheetFlavourHandle)
              : null;
            const regularAddons = addons.filter((a) => a.cakeProductType !== 'sheet-cake');

            // Available flavours from the sheet cake's config
            const sheetFlavours = (sheetAddon as any).cakeFlavourConfig as Array<{ handle: string; label: { en: string; fr: string }; active: boolean }> | undefined;

            // Sheet cake subtotal
            let sheetSubtotal = sheetPrice?.priceInCents ?? 0;
            if (sheetResolved) {
              for (const rid of sheetCakeAddonIds) {
                const ra = regularAddons.find((a) => a.id === rid);
                if (!ra) continue;
                const rp = resolvePricingGridPrice(ra.pricingGrid, sheetResolved, 'default');
                if (rp) sheetSubtotal += rp.priceInCents;
              }
            }

            return (
              <>
                <hr className="border-gray-200" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {tr(sheetAddon.title, locale)}
                    </p>
                    <button type="button" onClick={() => onToggleAddon(sheetAddon.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${sheetEnabled ? 'bg-[#333112]' : 'bg-gray-300'}`}
                      aria-label={`${sheetEnabled ? 'Remove' : 'Add'} ${tr(sheetAddon.title, locale)}`} aria-pressed={sheetEnabled}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sheetEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {sheetEnabled && (
                    <div className="space-y-2 pl-1 border-l-2 border-gray-100 ml-1">
                      {/* Flavour selector */}
                      {sheetFlavours && sheetFlavours.length > 0 && (
                        <div className="pl-2">
                          <label className="text-[11px] text-gray-500 uppercase tracking-wide">{isFr ? 'Saveur' : 'Flavour'}</label>
                          <select value={sheetFlavourHandle}
                            onChange={(e) => onSheetCakeFlavourChange(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-transparent mt-0.5">
                            <option value="">{isFr ? 'Choisir…' : 'Select…'}</option>
                            {sheetFlavours.filter((f) => f.active).map((f) => (
                              <option key={f.handle} value={f.handle}>{tr(f.label, locale)}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Guests input */}
                      <div className="pl-2">
                        <label className="text-[11px] text-gray-500 uppercase tracking-wide">{isFr ? 'Invités' : 'Guests'}</label>
                        <input type="number" min={1} value={sheetSize} placeholder=""
                          onChange={(e) => { const raw = e.target.value; onAddonSizeChange(sheetAddon.id, raw === '' ? '' : String(Math.max(0, Math.floor(Number(raw) || 0)))); }}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-gray-900 bg-transparent mt-0.5"
                          aria-label={`${tr(sheetAddon.title, locale)} guests`} />
                      </div>

                      {/* Sheet cake price */}
                      {sheetPrice && sheetSize && (
                        <div className="flex justify-between text-xs text-gray-600 pl-2">
                          <span>{sheetSize} {isFr ? 'invités' : 'guests'}</span>
                          <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>${(sheetPrice.priceInCents / 100).toFixed(2)}</span>
                        </div>
                      )}

                      {/* Add-ons for sheet cake */}
                      {regularAddons.length > 0 && sheetResolved && (
                        <div className="space-y-1.5 pl-2">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">{isFr ? 'Options' : 'Add-ons'}</p>
                          {regularAddons.map((addon) => {
                            const isOn = sheetCakeAddonIds.includes(addon.id);
                            const ap = resolvePricingGridPrice(addon.pricingGrid, sheetResolved!, 'default');
                            return (
                              <div key={addon.id} className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] text-gray-600">{tr(addon.title, locale)}</p>
                                  {ap && <p className="text-[10px] text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>+${(ap.priceInCents / 100).toFixed(2)}</p>}
                                </div>
                                <button type="button" onClick={() => onToggleSheetAddon(addon.id)}
                                  className={`relative w-8 h-4 rounded-full transition-colors ${isOn ? 'bg-[#333112]' : 'bg-gray-300'}`}
                                  aria-label={`${isOn ? 'Remove' : 'Add'} ${tr(addon.title, locale)} for sheet cake`} aria-pressed={isOn}>
                                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sheet subtotal */}
                      {sheetSubtotal > 0 && (
                        <div className="flex justify-between text-xs font-medium text-gray-700 pl-2 pt-1 border-t border-gray-100">
                          <span>{tr(sheetAddon.title, locale)}</span>
                          <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>${(sheetSubtotal / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Addon total */}
          {addonTotal > 0 && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>{isFr ? 'Options' : 'Add-ons'}</span>
              <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                +${(addonTotal / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Grand total for grid products */}
          {isGridProduct && gridPrice && (
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
              <span>{C.estTotal}</span>
              <span style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                ${((gridPrice.priceInCents + addonTotal) / 100).toFixed(2)}
              </span>
            </div>
          )}

          <p className="text-[11px] text-gray-400">{C.taxNote}</p>

          {/* 3. Fulfillment toggle → address if delivery */}
          <hr className="border-gray-200" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {isFr ? 'Cueillette / Livraison' : 'Fulfillment'}
            </p>
            <div className="flex rounded overflow-hidden border border-gray-300">
              {(['pickup', 'delivery'] as const).map((type) => (
                <button key={type} type="button"
                  onClick={() => onFulfillmentTypeChange(type)}
                  disabled={type === 'pickup' && isDeliveryOnly}
                  className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors ${
                    fulfillmentType === type ? 'bg-[#333112] text-white'
                      : type === 'pickup' && isDeliveryOnly ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {type === 'pickup' ? (isFr ? 'Cueillette' : 'Pickup') : (isFr ? 'Livraison' : 'Delivery')}
                </button>
              ))}
            </div>
          </div>

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

          {/* 4. Event date */}
          <div>
            <DatePickerField
              label={C.date}
              value={toDateValue(pickupDate)}
              minValue={minDateValue ?? today(getLocalTimeZone())}
              maxValue={maxDateValue ?? undefined}
              isDateUnavailable={isDateUnavailable}
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
          {pickupDate && !dateWarning && (
            <p className="text-xs text-gray-600 font-medium -mt-2">
              {fulfillmentType === 'pickup'
                ? `${isFr ? 'Cueillette' : 'Pickup'}: ${formatDateHuman(pickupDate, locale)}`
                : `${isFr ? 'Livraison' : 'Delivery'}: ${formatDateHuman(pickupDate, locale)}`}
            </p>
          )}

          {/* 5. Event type — only after valid headcount (legacy) or size selected (grid) */}
          {((isLegacyProduct && headcountValid) || isGridProduct || isTastingProduct) && (
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
          )}

          {/* 6. Notes */}
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

          {/* Errors */}
          {!pickupDate && (
            <p className="text-xs text-amber-600">{C.noDateError}</p>
          )}
          {checkoutError && (
            <p className="text-xs text-red-600">{checkoutError}</p>
          )}

          {/* 7. Checkout */}
          <button onClick={() => {
            setHeadcountTouched(true);
            onCheckout();
          }}
            disabled={checkoutLoading || !canCheckout}
            className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            {checkoutLoading ? C.loading : C.checkout}
          </button>
        </div>
      )}
    </div>
  );
}


// ── Main Page Component ──

export default function CakeOrderPageClient({ cmsContent }: { cmsContent?: any }) {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const C = T.cakeOrder;
  const { setCakeCount } = useOrderItems();

  // CMS-managed title/subtitle with i18n fallback
  const localeContent = isFr ? cmsContent?.fr : cmsContent?.en;
  const pageTitle = localeContent?.title || C.title;
  const pageSubtitle = localeContent?.subtitle || C.subtitle;

  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);

  // New state for grid-based products
  const [selectedFlavourHandles, setSelectedFlavourHandles] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [enabledAddonIds, setEnabledAddonIds] = useState<string[]>([]);
  const [addonSizes, setAddonSizes] = useState<Record<string, string>>({});
  const [sheetCakeAddonIds, setSheetCakeAddonIds] = useState<string[]>([]);
  const [sheetCakeFlavour, setSheetCakeFlavour] = useState(''); // regular add-ons enabled for sheet cake

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
  const [cartRestored, setCartRestored] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

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

  // ── Legacy price calculation ──
  const matchedTier = useMemo(() => {
    if (!selectedProduct || !isLegacy(selectedProduct)) return null;
    return getPriceFromTiers(selectedProduct.pricingTiers, numberOfPeople);
  }, [selectedProduct, numberOfPeople]);

  const calculatedPrice = matchedTier?.priceInCents ?? null;

  // ── Grid-based price resolution ──
  const resolvedSize = useMemo(() => {
    if (!selectedProduct || !isGridBased(selectedProduct)) return null;
    if (!selectedSize) return null;
    const inputNum = parseInt(selectedSize);
    if (isNaN(inputNum) || inputNum < 1) return null;
    // Croquembouche: customer enters guests, grid uses choux (guests × 3)
    const lookupValue = isCroquembouche(selectedProduct) ? inputNum * CROQ_CHOUX_PER_GUEST : inputNum;
    return resolveNearestSize(getAvailableSizes(selectedProduct.pricingGrid), lookupValue);
  }, [selectedProduct, selectedSize]);

  const gridPrice = useMemo(() => {
    if (!selectedProduct || !isGridBased(selectedProduct)) return null;
    if (!resolvedSize) return null;

    // For croquembouche: all flavours share the same price per size, so resolve by size alone
    // Try the first selected handle, then fall back to any handle at that size, then 'default'
    if (isCroquembouche(selectedProduct)) {
      const handle = selectedFlavourHandles[0] || 'default';
      const result = resolvePricingGridPrice(selectedProduct.pricingGrid, resolvedSize, handle);
      if (result) return result;
      // Fallback: find any row at this size
      const anyRow = selectedProduct.pricingGrid.find((r) => r.sizeValue === resolvedSize);
      if (anyRow) return { priceInCents: anyRow.priceInCents, shopifyVariantId: anyRow.shopifyVariantId };
      return null;
    }

    // For XXL / wedding: need both size and flavour
    if (selectedFlavourHandles.length === 0) return null;
    return resolvePricingGridPrice(selectedProduct.pricingGrid, resolvedSize, selectedFlavourHandles[0]);
  }, [selectedProduct, resolvedSize, selectedFlavourHandles]);

  // ── Tier detail for resolved size ──
  const tierDetail = useMemo(() => {
    if (!selectedProduct || !resolvedSize) return null;
    return getTierDetailForSize(selectedProduct.cakeTierDetailConfig, resolvedSize);
  }, [selectedProduct, resolvedSize]);

  // Lead time based on selected product and number of people
  const { maxLeadTimeDays, earliestDateStr, isDeliveryOnly } = useMemo(() => {
    if (!selectedProduct) return { maxLeadTimeDays: 0, earliestDateStr: toDateString(new Date()), isDeliveryOnly: false };
    // For grid-based products, use the selected size as the "people" count for lead time
    const effectivePeople = isGridBased(selectedProduct) ? (parseInt(resolvedSize || '0') || 1) : numberOfPeople;
    const activeTierLT = getActiveLeadTimeTier(selectedProduct.leadTimeTiers, effectivePeople);
    const days = activeTierLT?.leadTimeDays ?? 0;
    return { maxLeadTimeDays: days, earliestDateStr: toDateString(getEarliestDate(days)), isDeliveryOnly: activeTierLT?.deliveryOnly ?? false };
  }, [selectedProduct, numberOfPeople, selectedSize]);

  // Fetch blocked dates for cake capacity — re-fetch when lead time changes
  useEffect(() => {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const lt = maxLeadTimeDays || 7;
    fetch(`/api/cake-capacity?from=${from}&to=${to}&leadTime=${lt}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.blockedDates) setBlockedDates(new Set(data.blockedDates));
      })
      .catch(() => {});
  }, [maxLeadTimeDays]);

  // Max advance date based on product setting and selected flavour end dates
  const latestDateStr = useMemo(() => {
    let latest: string | null = null;

    // Product-level max advance days
    if (selectedProduct?.maxAdvanceDays) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + selectedProduct.maxAdvanceDays);
      latest = toDateString(d);
    }

    // Flavour end dates — use the earliest endDate among selected flavours
    if (selectedProduct && selectedFlavourHandles.length > 0) {
      for (const handle of selectedFlavourHandles) {
        const flavour = selectedProduct.cakeFlavourConfig.find((f) => f.handle === handle);
        if (flavour?.endDate) {
          if (!latest || flavour.endDate < latest) {
            latest = flavour.endDate;
          }
        }
      }
    }

    return latest;
  }, [selectedProduct, selectedFlavourHandles]);

  // Validate date against lead time and capacity
  useEffect(() => {
    if (!pickupDate) { setDateWarning(null); return; }
    if (pickupDate < earliestDateStr) {
      setDateWarning(
        isFr
          ? `Date trop tôt — choisissez le ${earliestDateStr} ou après`
          : `Date too early — choose ${earliestDateStr} or later`,
      );
    } else if (blockedDates.has(pickupDate)) {
      setDateWarning(
        isFr
          ? 'Cette date est complète — capacité de production atteinte'
          : 'This date is fully booked — production capacity reached',
      );
    } else if (latestDateStr && pickupDate > latestDateStr) {
      setDateWarning(
        isFr
          ? `Date trop tardive — choisissez le ${latestDateStr} ou avant`
          : `Date too late — choose ${latestDateStr} or earlier`,
      );
    } else {
      setDateWarning(null);
    }
  }, [pickupDate, earliestDateStr, isFr, blockedDates, latestDateStr]);

  // Clear date if it becomes invalid when people count changes
  useEffect(() => {
    if (pickupDate && pickupDate < earliestDateStr) {
      setPickupDate('');
    }
  }, [earliestDateStr]);

  // Clear selected flavours that have expired (endDate before earliest possible date)
  useEffect(() => {
    if (!selectedProduct || selectedFlavourHandles.length === 0) return;
    const stillValid = selectedFlavourHandles.filter((handle) => {
      const flavour = selectedProduct.cakeFlavourConfig.find((f) => f.handle === handle);
      if (!flavour?.endDate) return true;
      return flavour.endDate >= earliestDateStr;
    });
    if (stillValid.length !== selectedFlavourHandles.length) {
      setSelectedFlavourHandles(stillValid);
    }
  }, [earliestDateStr, selectedProduct]);

  // Force delivery when active tier is delivery only
  useEffect(() => {
    if (isDeliveryOnly && fulfillmentType !== 'delivery') {
      setFulfillmentType('delivery');
    }
  }, [isDeliveryOnly]);

  const belowMin = useMemo(() => {
    if (!selectedProduct) return false;
    if (isGridBased(selectedProduct)) {
      if (selectedProduct.pricingGrid.length === 0) return false;
      const sizes = getAvailableSizes(selectedProduct.pricingGrid).map(Number).filter(Boolean);
      if (sizes.length === 0) return false;
      const minSize = Math.min(...sizes);
      const inputNum = parseInt(selectedSize);
      if (isNaN(inputNum) || inputNum <= 0) return false;
      // Croquembouche: compare guest input × 3 against choux grid min
      const compareValue = isCroquembouche(selectedProduct) ? inputNum * CROQ_CHOUX_PER_GUEST : inputNum;
      return compareValue < minSize;
    }
    // Legacy
    if (selectedProduct.pricingTiers.length === 0) return false;
    const minFromTiers = selectedProduct.pricingTiers[0].minPeople;
    return numberOfPeople < minFromTiers;
  }, [selectedProduct, numberOfPeople, selectedSize]);

  // Grid minimum for display
  const gridMinSize = useMemo(() => {
    if (!selectedProduct || !isGridBased(selectedProduct)) return 0;
    const sizes = getAvailableSizes(selectedProduct.pricingGrid).map(Number).filter(Boolean);
    if (sizes.length === 0) return 0;
    const min = Math.min(...sizes);
    // Croquembouche: show min in guest units
    return isCroquembouche(selectedProduct) ? Math.ceil(min / CROQ_CHOUX_PER_GUEST) : min;
  }, [selectedProduct]);

  // Grid maximum for display (from cakeMaxPeople)
  const gridMaxSize = useMemo(() => {
    if (!selectedProduct?.cakeMaxPeople) return null;
    return selectedProduct.cakeMaxPeople;
  }, [selectedProduct]);

  // ── Flavour toggle handler ──
  const handleToggleFlavour = useCallback((handle: string) => {
    if (!selectedProduct) return;
    const isMulti = isCroquembouche(selectedProduct) || isTasting(selectedProduct);
    const maxFlavours = selectedProduct.cakeMaxFlavours ?? 3;

    setSelectedFlavourHandles((prev) => {
      if (isMulti) {
        // Multi-select: toggle on/off, respect max
        if (prev.includes(handle)) {
          return prev.filter((h) => h !== handle);
        }
        if (prev.length >= maxFlavours) return prev;
        return [...prev, handle];
      } else {
        // Radio: single select
        if (prev.includes(handle)) return [];
        return [handle];
      }
    });
  }, [selectedProduct]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId((prev) => {
      if (prev === productId) return null;
      const product = products.find((p) => p.id === productId);
      if (product) {
        // Reset grid state
        setEnabledAddonIds([]);

        // Auto-select first flavour for grid-based products (not croquembouche)
        if ((isGridBased(product) || isTasting(product)) && product.cakeFlavourConfig.length > 0) {
          const roughEarliest = toDateString(getEarliestDate(product.leadTimeTiers[0]?.leadTimeDays ?? 0));
          const firstActive = product.cakeFlavourConfig.find((f) => f.active && f.handle !== 'custom' && (!f.endDate || f.endDate >= roughEarliest));
          setSelectedFlavourHandles(firstActive ? [firstActive.handle] : []);
        } else {
          setSelectedFlavourHandles([]);
        }

        // Auto-set size to minimum from pricing grid or legacy tiers
        if (isGridBased(product) && product.pricingGrid.length > 0) {
          const sizes = getAvailableSizes(product.pricingGrid).map(Number).filter(Boolean);
          const minSize = sizes.length > 0 ? Math.min(...sizes) : 0;
          setSelectedSize(minSize > 0 ? String(minSize) : '');
        } else {
          setSelectedSize('');
          if (isLegacy(product) && product.pricingTiers.length > 0) {
            const minPeople = product.pricingTiers
              .slice()
              .sort((a, b) => a.minPeople - b.minPeople)[0].minPeople;
            setNumberOfPeople(minPeople);
          }
        }
      }
      return productId;
    });
  }, [products]);

  const handleRemove = useCallback(() => {
    setSelectedProductId(null);
    setSelectedFlavourHandles([]);
    setSelectedSize('');
    setEnabledAddonIds([]);
    saveCart(null);
  }, []);

  const handleSizeChange = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleToggleAddon = useCallback((addonId: string) => {
    setEnabledAddonIds((prev) => {
      const removing = prev.includes(addonId);
      if (removing) {
        // If removing a sheet cake, clear its related state
        const addon = (selectedProduct?.addons || []).find((a) => a.id === addonId);
        if (addon?.cakeProductType === 'sheet-cake') {
          setSheetCakeAddonIds([]);
          setSheetCakeFlavour('');
          setAddonSizes((s) => { const next = { ...s }; delete next[addonId]; return next; });
        }
        return prev.filter((id) => id !== addonId);
      }
      return [...prev, addonId];
    });
  }, [selectedProduct]);

  // ── Cart persistence: save on state changes ──
  useEffect(() => {
    if (!cartRestored) return;
    if (!selectedProductId) {
      saveCart(null);
      return;
    }
    const effectivePrice = selectedProduct && isGridBased(selectedProduct)
      ? (gridPrice?.priceInCents ?? null)
      : calculatedPrice;

    saveCart({
      productId: selectedProductId,
      selectedFlavourHandles,
      selectedSize,
      addonIds: enabledAddonIds,
      addonSizes,
      sheetCakeAddonIds,
      sheetCakeFlavour,
      computedPrice: effectivePrice,
    });
  }, [selectedProductId, selectedFlavourHandles, selectedSize, enabledAddonIds, addonSizes, sheetCakeAddonIds, sheetCakeFlavour, gridPrice, calculatedPrice, cartRestored, selectedProduct]);

  // ── Cart persistence: restore on page load ──
  useEffect(() => {
    if (products.length === 0) return;
    if (cartRestored) return;

    const saved = loadCart();
    setCartRestored(true);
    if (!saved) return;

    const product = products.find((p) => p.id === saved.productId);
    if (!product) return;

    setSelectedProductId(saved.productId);
    setSelectedFlavourHandles(saved.selectedFlavourHandles || []);
    setSelectedSize(saved.selectedSize || '');
    setEnabledAddonIds(saved.addonIds || []);
    setAddonSizes(saved.addonSizes || {});
    setSheetCakeAddonIds(saved.sheetCakeAddonIds || []);
    setSheetCakeFlavour(saved.sheetCakeFlavour || '');

    if (isLegacy(product) && product.pricingTiers.length > 0) {
      const minPeople = product.pricingTiers
        .slice()
        .sort((a, b) => a.minPeople - b.minPeople)[0].minPeople;
      setNumberOfPeople(minPeople);
    }
  }, [products, cartRestored]);

  const handleCheckout = useCallback(async () => {
    if (!selectedProduct) return;

    // Determine price and variant based on product type
    let shopifyVariantId: string | null = null;
    let price: number | null = null;
    let sizeValue: string | undefined;
    let flavourHandle: string | undefined;

    if (isTasting(selectedProduct)) {
      // Tasting: fixed price from first grid entry
      if (selectedProduct.pricingGrid.length === 0) return;
      price = selectedProduct.pricingGrid[0].priceInCents;
      shopifyVariantId = selectedProduct.pricingGrid[0].shopifyVariantId;
    } else if (isGridBased(selectedProduct)) {
      // Grid-based: resolve from grid
      if (!gridPrice || !resolvedSize) return;
      // Croquembouche can proceed without flavour selection (all same price)
      if (!isCroquembouche(selectedProduct) && selectedFlavourHandles.length === 0) return;
      price = gridPrice.priceInCents;
      shopifyVariantId = gridPrice.shopifyVariantId;
      sizeValue = resolvedSize;
      flavourHandle = isCroquembouche(selectedProduct)
        ? (selectedFlavourHandles[0] || 'default')
        : selectedFlavourHandles[0];
    } else {
      // Legacy
      if (calculatedPrice == null || !matchedTier) return;
      price = calculatedPrice;
      shopifyVariantId = matchedTier.shopifyVariantId;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const items: any[] = [{
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        shopifyProductId: selectedProduct.shopifyProductId ?? '',
        variantId: selectedProduct.id,
        variantLabel: isGridBased(selectedProduct)
          ? `${selectedSize} ${isFr ? 'invités' : 'guests'}`
          : `${matchedTier?.minPeople ?? numberOfPeople} ${C.numberOfPeopleShort}`,
        shopifyVariantId: shopifyVariantId ?? '',
        sizeValue,
        flavourHandle,
        quantity: 1,
        price,
      }];

      // Add addon items — each add-on is priced individually per cake tier
      if (isGridBased(selectedProduct) && enabledAddonIds.length > 0) {
        const sheetCakeIds: string[] = [];
        const regularAddonIds: string[] = [];
        for (const addonId of enabledAddonIds) {
          const addon = (selectedProduct.addons || []).find((a) => a.id === addonId);
          if (!addon) continue;
          if (addon.cakeProductType === 'sheet-cake') sheetCakeIds.push(addonId);
          else regularAddonIds.push(addonId);
        }

        // Regular add-ons at main cake tier
        for (const addonId of regularAddonIds) {
          const addon = (selectedProduct.addons || []).find((a) => a.id === addonId)!;
          const addonResolved = resolvePricingGridPrice(addon.pricingGrid, resolvedSize!, 'default');
          if (!addonResolved) continue;
          items.push({
            productId: addon.id, productName: addon.name, shopifyProductId: '',
            variantId: addon.id, variantLabel: addon.name,
            shopifyVariantId: addonResolved.shopifyVariantId ?? '',
            sizeValue: resolvedSize, flavourHandle: 'default', quantity: 1,
            price: addonResolved.priceInCents, isAddon: true,
          });
        }

        // Sheet cake add-ons + regular add-ons at sheet cake tier
        for (const sheetId of sheetCakeIds) {
          const sheetAddon = (selectedProduct.addons || []).find((a) => a.id === sheetId)!;
          const sheetSize = addonSizes[sheetId];
          if (!sheetSize) continue;
          const sheetResolved = resolveNearestSize(getAvailableSizes(sheetAddon.pricingGrid), parseInt(sheetSize));
          if (!sheetResolved) continue;

          // Sheet cake itself
          const sheetPrice = resolvePricingGridPrice(sheetAddon.pricingGrid, sheetResolved, sheetCakeFlavour || 'default');
          if (sheetPrice) {
            items.push({
              productId: sheetAddon.id, productName: sheetAddon.name, shopifyProductId: '',
              variantId: sheetAddon.id, variantLabel: `${sheetSize} ${isFr ? 'invités' : 'guests'}`,
              shopifyVariantId: sheetPrice.shopifyVariantId ?? '',
              sizeValue: sheetResolved, flavourHandle: sheetCakeFlavour || 'default', quantity: 1,
              price: sheetPrice.priceInCents, isAddon: true,
            });
          }

          // Regular add-ons at sheet cake tier (independently toggled)
          for (const addonId of sheetCakeAddonIds) {
            const addon = (selectedProduct.addons || []).find((a) => a.id === addonId);
            if (!addon) continue;
            const addonPrice = resolvePricingGridPrice(addon.pricingGrid, sheetResolved, 'default');
            if (!addonPrice) continue;
            items.push({
              productId: addon.id, productName: addon.name, shopifyProductId: '',
              variantId: `${addon.id}-sheet`, variantLabel: `${addon.name} (${isFr ? 'gâteau feuille' : 'sheet cake'})`,
              shopifyVariantId: addonPrice.shopifyVariantId ?? '',
              sizeValue: sheetResolved, flavourHandle: 'default', quantity: 1,
              price: addonPrice.priceInCents, isAddon: true,
            });
          }
        }
      }

      const res = await fetch('/api/checkout/cake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          pickupDate: `${pickupDate}T00:00:00`,
          numberOfPeople: isGridBased(selectedProduct) ? parseInt(selectedSize) || 0 : numberOfPeople,
          eventType,
          specialInstructions: specialInstructions.trim() || null,
          fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() || null : null,
          locale,
          calculatedPrice: price,
          selectedFlavours: selectedFlavourHandles,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || C.checkoutError);
        return;
      }
      // Clear cart on successful checkout
      saveCart(null);
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutError(C.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedProduct, gridPrice, calculatedPrice, matchedTier, selectedSize, resolvedSize, selectedFlavourHandles, enabledAddonIds, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, deliveryAddress, locale, isFr]);

  useEffect(() => {
    fetch('/api/storefront/cake-products')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: CakeProduct[]) => setProducts(data))
      .catch(() => setError(C.loadError))
      .finally(() => setLoading(false));
  }, [isFr]);

  // Shared sidebar props
  const sidebarProps = {
    selectedProduct,
    numberOfPeople,
    calculatedPrice,
    pickupDate,
    eventType,
    specialInstructions,
    fulfillmentType,
    deliveryAddress,
    dateWarning,
    earliestDateStr,
    maxLeadTimeDays,
    onDateChange: setPickupDate,
    onNumberOfPeopleChange: setNumberOfPeople,
    onEventTypeChange: setEventType,
    onSpecialInstructionsChange: setSpecialInstructions,
    onFulfillmentTypeChange: setFulfillmentType,
    onDeliveryAddressChange: setDeliveryAddress,
    onRemove: handleRemove,
    checkoutLoading,
    checkoutError,
    locale,
    belowMin,
    isDeliveryOnly,
    C,
    selectedFlavourHandles,
    selectedSize,
    onSizeChange: handleSizeChange,
    resolvedSize: resolvedSize ?? '',
    gridPrice,
    tierDetail,
    addons: selectedProduct?.addons ?? [],
    enabledAddonIds,
    onToggleAddon: handleToggleAddon,
    addonSizes,
    onAddonSizeChange: (addonId: string, size: string) => setAddonSizes((prev) => ({ ...prev, [addonId]: size })),
    sheetCakeAddonIds,
    onToggleSheetAddon: (addonId: string) => setSheetCakeAddonIds((prev) => prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]),
    sheetCakeFlavour,
    onSheetCakeFlavourChange: setSheetCakeFlavour,
    gridMinSize,
    gridMaxSize,
    blockedDates,
    latestDateStr,
  };

  // Mobile bottom bar price
  const mobilePrice = useMemo(() => {
    if (!selectedProduct) return null;
    if (isGridBased(selectedProduct)) return gridPrice?.priceInCents ?? null;
    if (isTasting(selectedProduct) && selectedProduct.pricingGrid.length > 0) return selectedProduct.pricingGrid[0].priceInCents;
    return calculatedPrice;
  }, [selectedProduct, gridPrice, calculatedPrice]);

  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex gap-8">
        {/* Left: Products */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mb-10 max-w-xl">
            {pageSubtitle}
          </p>

          {loading && (
            <ProductGridSkeleton />
          )}
          {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400">{C.noProducts}</p>
            </div>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4">
              {products.filter((p) => !isAddonProduct(p, products)).map((product) => {
                const isSelected = selectedProductId === product.id;
                return (
                  <CakeProductCard key={product.id} product={product} locale={locale}
                    isSelected={isSelected}
                    onSelect={handleSelectProduct} brandColor={brandColor}
                    numberOfPeople={numberOfPeople} C={C}
                    selectedFlavourHandles={isSelected ? selectedFlavourHandles : []}
                    onToggleFlavour={handleToggleFlavour}
                    earliestDateStr={earliestDateStr} />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <CakeInlineCart
            {...sidebarProps}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile cart modal */}
      <MobileCartModal open={showMobileCart} onClose={() => setShowMobileCart(false)}>
        <CakeInlineCart
          {...sidebarProps}
          onCheckout={() => { setShowMobileCart(false); handleCheckout(); }}
        />
      </MobileCartModal>

      {/* Mobile bottom bar */}
      {selectedProduct && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {selectedProduct.name}{mobilePrice != null && ` · $${(mobilePrice / 100).toFixed(2)}`}
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
