'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCakeCart } from '@/contexts/CakeCartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { getActivePricingTier } from '@/lib/utils/order-helpers';
import type { PricingGridRow, CakeTierDetailEntry } from '@/lib/utils/order-helpers';
import { getDefaultFlavourSelection } from '@/lib/utils/cake-rules';
import { ProductGridSkeleton } from '@/components/ui/OrderPageSkeleton';

// ── Types ──

interface TranslationObject { en: string; fr: string; }
interface LeadTimeTier { minPeople: number; leadTimeDays: number; deliveryOnly: boolean; }
interface PricingTier { minPeople: number; priceInCents: number; shopifyVariantId: string; }
interface CakeFlavourEntry {
  handle: string; label: { en: string; fr: string }; active: boolean;
  endDate: string | null; allergens?: string[]; sortOrder: number;
  description: { en: string; fr: string } | null; pricingTierGroup: string | null;
}
interface AddonProduct {
  id: string; name: string; title: { en: string; fr: string }; image: string | null;
  cakeDescription: { en: string; fr: string }; cakeProductType: string | null;
  cakeMinPeople?: number | null; cakeMaxPeople?: number | null; pricingGrid: PricingGridRow[];
}
interface CakeProduct {
  id: string; name: string; slug: string; image: string | null; price: number | null;
  shopifyProductId: string | null; cakeDescription: TranslationObject;
  cakeFlavourNotes: TranslationObject | null; cakeInstructions: TranslationObject;
  cakeMinPeople: number; cakeMaxPeople: number | null; shortCardCopy: string | null;
  allergens: string[]; leadTimeTiers: LeadTimeTier[]; pricingTiers: PricingTier[];
  serves: string | null; cakeProductType: string | null;
  cakeFlavourConfig: CakeFlavourEntry[]; cakeTierDetailConfig: CakeTierDetailEntry[];
  cakeMaxFlavours: number | null; pricingGrid: PricingGridRow[];
  addons: AddonProduct[]; maxAdvanceDays: number | null;
}

// ── Helpers ──

function tr(f: TranslationObject | null | undefined, locale: string) {
  if (!f) return ''; return locale === 'fr' ? (f.fr || f.en) : (f.en || '');
}
function isGridBased(p: CakeProduct) { return !!p.cakeProductType && p.cakeProductType !== 'wedding-cake-tasting'; }
function isTasting(p: CakeProduct) { return p.cakeProductType === 'wedding-cake-tasting'; }
function isLegacy(p: CakeProduct) { return !p.cakeProductType; }
function isCroquembouche(p: CakeProduct) { return p.cakeProductType === 'croquembouche'; }
function isAddonProduct(p: CakeProduct, all: CakeProduct[]) { return all.some((x) => x.addons?.some((a) => a.id === p.id)); }

function getAvailableSizes(grid: PricingGridRow[]) {
  const seen = new Set<string>(); const sizes: string[] = [];
  for (const r of grid) { if (!seen.has(r.sizeValue)) { seen.add(r.sizeValue); sizes.push(r.sizeValue); } }
  return sizes;
}
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getEarliestDate(days: number) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+days); return d;
}

// ── FlavourDropdown ──

function FlavourDropdown({ product, locale, selectedFlavourHandles, onToggleFlavour, earliestDateStr, overlayMode = false }: {
  product: CakeProduct; locale: string; selectedFlavourHandles: string[];
  onToggleFlavour: (h: string) => void; earliestDateStr: string; overlayMode?: boolean;
}) {
  const isFr = locale === 'fr';
  const isMulti = isCroquembouche(product) || isTasting(product);
  const maxFlavours = product.cakeMaxFlavours ?? 3;
  const available = product.cakeFlavourConfig.filter((f) => !f.endDate || f.endDate >= earliestDateStr);

  if (isMulti) {
    const atLimit = selectedFlavourHandles.length >= maxFlavours;
    return (
      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
        <p className={`text-[12px] uppercase tracking-wide ${overlayMode ? 'text-white' : ''}`}>
          {isFr ? `Saveurs (max ${maxFlavours})` : `Flavours (max ${maxFlavours})`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {available.filter((f) => f.handle !== 'custom').map((f) => {
            const isSel = selectedFlavourHandles.includes(f.handle);
            const disabled = !isSel && atLimit;
            return (
              <button key={f.handle} type="button" disabled={disabled}
                onClick={() => { if (!disabled) onToggleFlavour(f.handle); }}
                className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${overlayMode
                  ? isSel ? 'bg-white text-[#0065B6] border-white' : disabled ? 'border-white/30 text-white/30 cursor-not-allowed' : 'border-white text-white hover:bg-white/20'
                  : isSel ? 'bg-[#333112] text-white border-[#333112]' : disabled ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}>
                {tr(f.label, locale)}
              </button>
            );
          })}
        </div>
        {atLimit && <p className={`text-[12px] ${overlayMode ? 'text-white/70' : ''}`}>{isFr ? `Maximum ${maxFlavours} atteint` : `Max ${maxFlavours} reached`}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
      <p className={`text-[12px] uppercase tracking-wide ${overlayMode ? 'text-white' : ''}`}>{isFr ? 'Saveur' : 'Flavour'}</p>
      <div className="flex flex-wrap gap-1.5">
        {available.map((f) => {
          const isSel = selectedFlavourHandles[0] === f.handle;
          return (
            <button key={f.handle} type="button" onClick={() => onToggleFlavour(f.handle)}
              className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${overlayMode
                ? isSel ? 'bg-white text-[#0065B6] border-white' : 'border-white text-white hover:bg-white/20'
                : isSel ? 'bg-[#333112] text-white border-[#333112]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {tr(f.label, locale)}{f.handle === 'custom' ? (isFr ? ' — contactez-nous' : ' — contact us') : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CakeProductCard ──

function CakeProductCard({ product, locale, brandColor, earliestDateStr }: {
  product: CakeProduct; locale: string; brandColor: string; earliestDateStr: string;
}) {
  const isFr = locale === 'fr';
  const { addItem, items, openCart: _openCart } = useCakeCart() as any;
  const { openCart } = useCartDrawer();
  const isMulti = isCroquembouche(product) || isTasting(product);
  const maxFlavours = product.cakeMaxFlavours ?? 3;

  const [hovered, setHovered] = useState(false);
  const [localFlavours, setLocalFlavours] = useState<string[]>(() =>
    getDefaultFlavourSelection(product.cakeFlavourConfig, isMulti, earliestDateStr)
  );

  const showOverlay = hovered;
  const hasFlavours = (isGridBased(product) || isTasting(product)) && product.cakeFlavourConfig.length > 0;
  const flavourReady = !hasFlavours || localFlavours.length > 0;

  const allergens = product.allergens ?? [];
  const tastingPrice = isTasting(product) && product.pricingGrid.length > 0 ? product.pricingGrid[0].priceInCents : null;
  const description = tr(product.cakeDescription, locale);
  const flavourNotes = tr(product.cakeFlavourNotes, locale);

  // Default size: min from pricing grid
  const defaultSize = useMemo(() => {
    if (!isGridBased(product) || !product.pricingGrid.length) return '';
    const sizes = getAvailableSizes(product.pricingGrid).map(Number).filter(Boolean);
    if (!sizes.length) return '';
    const min = Math.min(...sizes);
    return isCroquembouche(product) ? String(Math.ceil(min / 3)) : String(min);
  }, [product]);

  const handleToggle = (handle: string) => {
    setLocalFlavours((prev) => {
      if (isMulti) {
        if (prev.includes(handle)) return prev.filter((h) => h !== handle);
        if (prev.length >= maxFlavours) return prev;
        return [...prev, handle];
      }
      return prev.includes(handle) ? [] : [handle];
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!flavourReady) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      cakeProductType: product.cakeProductType,
      flavourHandles: localFlavours,
      size: defaultSize,
      addonIds: [],
      addonSizes: {},
      sheetCakeAddonIds: [],
      sheetCakeFlavour: '',
      computedPrice: null,
    });
    openCart('cake');
  };

  return (
    <div className="flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="aspect-[4/5] overflow-hidden relative">
        {!showOverlay && (
          <>
            {product.image
              ? <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ backgroundColor: brandColor }} />}
            {allergens.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-1 z-10">
                {allergens.map((a) => <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-black border border-black">{a}</span>)}
              </div>
            )}
          </>
        )}
        {showOverlay && (
          <div className="w-full h-full bg-[#0065B6] flex flex-col justify-between p-4">
            <div>
              {allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {allergens.map((a) => <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-white border border-white">{a}</span>)}
                </div>
              )}
              {hasFlavours && (
                <FlavourDropdown product={product} locale={locale}
                  selectedFlavourHandles={localFlavours} onToggleFlavour={handleToggle}
                  earliestDateStr={earliestDateStr} overlayMode />
              )}
            </div>
            <button type="button" onClick={handleAddToCart}
              className={`w-full h-10 rounded-full border border-white text-[16px] text-white font-medium flex items-center justify-center transition-colors ${flavourReady ? 'hover:bg-white/10' : 'opacity-40 cursor-default'}`}>
              {flavourReady ? (isFr ? 'Ajouter au panier' : 'Add to cart') : (isFr ? 'Choisir une saveur' : 'Choose a flavour')}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 pt-2.5">
        <h3 className="text-[16px]" style={{ fontWeight: 500, color: '#1A3821' }}>{product.name}</h3>
        <div className="flex items-center gap-2 text-[16px]" style={{ color: '#1A3821' }}>
          {tastingPrice != null && <span>${(tastingPrice/100).toFixed(2)}</span>}
          {product.serves && <span>{isFr ? `Pour ${product.serves}` : `Serves ${product.serves}`}</span>}
        </div>
        {flavourNotes && <p className="text-[16px] text-gray-500 italic">{flavourNotes}</p>}
        {description && <p className="text-[16px] text-gray-500 leading-relaxed line-clamp-3">{description}</p>}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CakeOrderPageClient({ cmsContent }: { cmsContent?: any }) {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const { items, products: ctxProducts } = useCakeCart();
  const { setDefaultTab } = useCartDrawer();
  const { setCakeCount } = useOrderItems();

  const [products, setProducts] = useState<CakeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#144437');

  useEffect(() => { setDefaultTab('cake'); }, []);

  useEffect(() => {
    const count = items.length;
    setCakeCount(count);
    try { localStorage.setItem('rhubarbe:cake:count', String(count)); window.dispatchEvent(new Event('rhubarbe:count-updated')); } catch {}
  }, [items, setCakeCount]);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => { if (d.brandColor) setBrandColor(d.brandColor); }).catch(() => {});
  }, []);

  // Use products from context instead of fetching independently
  useEffect(() => {
    if (ctxProducts.length > 0) {
      setProducts(ctxProducts as CakeProduct[]);
      setLoading(false);
    }
  }, [ctxProducts]);

  const earliestDateStr = useMemo(() => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+7);
    return toDateString(d);
  }, []);

  const displayProducts = useMemo(() => products.filter((p) => !isAddonProduct(p, products)), [products]);

  return (
    <main className="pt-20 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto">
      {loading && <ProductGridSkeleton />}
      {error && <div className="text-center py-20"><p className="text-sm text-red-600">{error}</p></div>}
      {!loading && !error && (
        <>
          <h1 className="leading-none mb-20" style={{ fontSize: 48, color: '#1A3821', paddingTop: 80 }}>
            {isFr ? 'Gâteaux' : 'Cakes'}
            <sup style={{ fontSize: 24, verticalAlign: 'super', position: 'relative', top: '-0.2em', marginLeft: 2 }}>
              ({displayProducts.length})
            </sup>
          </h1>
          {displayProducts.length === 0
            ? <p className="text-[16px] text-center py-20">{T.cakeOrder?.noProducts || 'No products available'}</p>
            : <div className="grid grid-cols-1 md:grid-cols-3" style={{ columnGap: 24, rowGap: 56 }}>
                {displayProducts.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 }}>
                    <CakeProductCard product={p} locale={locale} brandColor={brandColor} earliestDateStr={earliestDateStr} />
                  </motion.div>
                ))}
              </div>
          }
        </>
      )}
    </main>
  );
}
