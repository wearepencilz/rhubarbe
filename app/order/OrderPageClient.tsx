'use client';

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useWeeklyCart } from '@/contexts/WeeklyCartContext';
import { generatePickupDays, isPickupDayDisabled } from '@/lib/utils/order-helpers';
import { OrderPageSkeleton } from '@/components/ui/OrderPageSkeleton';
import { useCartDrawer } from '@/contexts/CartDrawerContext';

interface LaunchProduct {
  id: string;
  productId: string;
  productName: string;
  sortOrder: number;
  minQuantityOverride: number | null;
  maxQuantityOverride: number | null;
  image: string | null;
  price: number | null;
  description: string | null;
  shortCardCopy: string | null;
  category: string | null;
  categoryLabel: string | null;
  slug: string;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  allergens: string[];
  serves: string | null;
  nextAvailableDate: string | null;
  translations: any;
  variantType: 'none' | 'flavour' | 'size';
  variants: Array<{
    id: string;
    label: string;
    labelFr?: string;
    price?: number;
    shopifyVariantId?: string;
    available: boolean;
    sortOrder: number;
  }>;
}

interface PickupLocation {
  id: string;
  internalName: string;
  publicLabel: { en: string; fr: string };
  address: string;
  disabledPickupDays?: number[];
}

interface Launch {
  id: string;
  slug: string | null;
  title: { en: string; fr: string };
  introCopy: { en: string; fr: string };
  status: string;
  orderOpens: string;
  orderCloses: string;
  orderingOpen: boolean;
  pickupDate: string;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  pickupSlots: Array<{ id: string; startTime: string; endTime: string; capacity?: number }>;
  pickupLocation: PickupLocation | null;
  products: LaunchProduct[];
}

interface CartItem {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  shopifyVariantId: string | null;
  allergens: string[];
}

/** Parse an ISO/timestamp string into a local Date, avoiding UTC day-shift. */
function toLocalDate(iso: string): Date {
  const dateOnly = iso.split('T')[0];
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso: string, locale: string) {
  try {
    return toLocalDate(iso).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

function formatDatetime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

/** Format a pickup range like "Sat, Apr 18 – Mon, 21" or fall back to single date. */
function formatPickupRange(launch: Launch, locale: string): string {
  const { pickupWindowStart, pickupWindowEnd, pickupDate } = launch;
  if (!pickupWindowStart || !pickupWindowEnd) return formatDate(pickupDate, locale);
  const loc = locale === 'fr' ? 'fr-CA' : 'en-CA';
  const start = toLocalDate(pickupWindowStart);
  const end = toLocalDate(pickupWindowEnd);
  if (start.getTime() === end.getTime()) return formatDate(pickupWindowStart, locale);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const startStr = start.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(loc, { weekday: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  }
  const startStr = start.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function ProductCard({
  product,
  locale,
  quantity,
  maxQuantity,
  onAdd,
  onRemove,
  selectedVariantId,
  onSelectVariant,
}: {
  product: LaunchProduct;
  locale: string;
  quantity: number;
  maxQuantity: number | null;
  onAdd: () => void;
  onRemove: () => void;
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
}) {
  const displayName = product.translations?.fr?.title && locale === 'fr'
    ? product.translations.fr.title
    : product.productName;
  const shortCopy = product.translations?.fr?.shortCardCopy && locale === 'fr'
    ? product.translations.fr.shortCardCopy
    : product.shortCardCopy;
  const description = product.translations?.fr?.description && locale === 'fr'
    ? product.translations.fr.description
    : product.description;

  const isFr = locale === 'fr';
  const atMax = maxQuantity != null && quantity >= maxQuantity;
  const soldOut = maxQuantity != null && maxQuantity <= 0;

  const hasVariants = product.variantType !== 'none' && product.variants.length > 1;
  const availableVariants = product.variants.filter((v) => v.available);
  const activeVariant = hasVariants
    ? product.variants.find((v) => v.id === selectedVariantId) || availableVariants[0] || null
    : null;

  // Resolve display price: variant price overrides base price
  const displayPrice = activeVariant?.price ?? product.price;
  const hasItems = quantity > 0;
  const [hovered, setHovered] = useState(false);
  const showOverlay = (hasItems || hovered) && !soldOut;
  const allergens = product.allergens ?? [];

  return (
    <div className={`flex flex-col ${soldOut ? 'opacity-60' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {product.image && (
        <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
          {!showOverlay && (
            <>
              <img src={product.image} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
              {allergens.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-1 z-10">
                  {allergens.map((a) => (
                    <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-black border border-black">{a}</span>
                  ))}
                </div>
              )}
            </>
          )}
          {showOverlay && (
            <div className="w-full h-full bg-[#0065B6] flex flex-col justify-between p-4">
              <div>
                <div className="flex flex-wrap gap-1">
                  {product.serves && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] text-white border border-white">
                      {isFr ? `Pour ${product.serves}` : `Serves ${product.serves}`}
                    </span>
                  )}
                  {allergens.map((a) => (
                    <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] uppercase font-medium text-white border border-white">{a}</span>
                  ))}
                </div>
                {hasVariants && availableVariants.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {availableVariants.map((v) => {
                      const isActive = v.id === (activeVariant?.id);
                      const label = isFr && v.labelFr ? v.labelFr : v.label;
                      return (
                        <button key={v.id} onClick={(e) => { e.stopPropagation(); onSelectVariant(v.id); }}
                          className={`px-3 py-1 text-[10px] rounded-full border transition-colors ${isActive ? 'border-white bg-white text-[#0065B6]' : 'border-white text-white hover:bg-white/20'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                {quantity === 0 ? (
                  <button onClick={onAdd} disabled={atMax || (hasVariants && !activeVariant)}
                    className="w-full h-10 rounded-full border border-white text-[16px] text-white font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isFr ? '+ Ajouter' : '+ Add'}
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-full border border-white overflow-hidden h-10 w-full">
                    <button onClick={onRemove} className="px-4 h-full text-white text-lg hover:bg-white/20">−</button>
                    <span className="text-[16px] text-white font-medium">{quantity}{maxQuantity != null ? ` / ${maxQuantity}` : ''}</span>
                    <button onClick={onAdd} disabled={atMax} className="px-4 h-full text-white text-lg hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-center text-white text-[16px] font-medium">{isFr ? 'Épuisé' : 'Sold out'}</p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 pt-2.5 gap-1">
        <h3 className="text-[16px] leading-tight" style={{ fontWeight: 500, color: '#1A3821' }}>
          {displayName}
        </h3>
        <div className="flex items-center justify-between text-[16px]">
          {displayPrice != null && displayPrice > 0 && (
            <span style={{ color: '#1A3821' }}>${(displayPrice / 100).toFixed(2)}</span>
          )}
        </div>
        {shortCopy && (
          <p className="text-[16px] text-gray-500 leading-relaxed line-clamp-2">{shortCopy}</p>
        )}

        {/* Mobile-only controls */}
        <div className="md:hidden mt-2 space-y-2">
          {hasVariants && availableVariants.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {availableVariants.map((v) => {
                const isActive = v.id === (activeVariant?.id);
                const label = isFr && v.labelFr ? v.labelFr : v.label;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelectVariant(v.id)}
                    className={`px-3 py-1.5 text-[16px] rounded-full border transition-colors ${
                      isActive
                        ? 'border-[#333112] bg-[#333112] text-white'
                        : 'border-gray-300 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          {soldOut ? (
            <p className="w-full h-10 flex items-center justify-center text-[16px] font-medium text-gray-400">
              {isFr ? 'Épuisé' : 'Sold out'}
            </p>
          ) : quantity === 0 ? (
            <button
              onClick={onAdd}
              disabled={atMax || (hasVariants && !activeVariant)}
              className="w-full h-10 rounded-full border border-gray-300 text-[16px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFr ? '+ Ajouter' : '+ Add'}
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-full border border-gray-300 overflow-hidden h-10">
              <button onClick={onRemove} className="px-4 h-full hover:bg-gray-50 text-lg">−</button>
              <span className="text-[16px] font-medium">{quantity}{maxQuantity != null ? ` / ${maxQuantity}` : ''}</span>
              <button onClick={onAdd} disabled={atMax} className="px-4 h-full hover:bg-gray-50 text-lg disabled:opacity-30 disabled:cursor-not-allowed">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuSwitchModal({
  open,
  onConfirm,
  onCancel,
  targetMenuName,
  locale,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  targetMenuName: string;
  locale: string;
}) {
  const isFr = locale === 'fr';
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <h3
          className="text-sm uppercase tracking-widest mb-3"
         
        >
          {isFr ? 'Changer de menu?' : 'Switch menu?'}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {isFr
            ? `Votre panier sera vidé si vous passez au menu « ${targetMenuName} ». Les articles de différents menus ne peuvent pas être combinés.`
            : `Your cart will be cleared if you switch to "${targetMenuName}". Items from different menus cannot be combined.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 text-xs uppercase tracking-widest font-medium rounded hover:bg-gray-50 transition-colors"
           
          >
            {isFr ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors"
           
          >
            {isFr ? 'Vider et changer' : 'Clear & switch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPageClient({ initialSlug }: { initialSlug?: string } = {}) {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const { setOrderCount } = useOrderItems();
  const { cart, setCart, cartLaunchId, setCartLaunchId, selectedSlotId, setSelectedSlotId, selectedPickupDay, setSelectedPickupDay, launches: contextLaunches, activeLaunchIdx, setActiveLaunchIdx, loading: contextLoading } = useWeeklyCart();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pendingSwitchIdx, setPendingSwitchIdx] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [shopifyStock, setShopifyStock] = useState<Record<string, number | null>>({});
  const { openCart, setDefaultTab } = useCartDrawer();

  // Use launches from context (already fetched)
  const launches = contextLaunches;
  const loading = contextLoading;

  useEffect(() => { setDefaultTab('weekly'); }, []);
  // Report cart count to nav
  useEffect(() => {
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    setOrderCount(total);
    try { localStorage.setItem('rhubarbe:order:count', String(total)); window.dispatchEvent(new Event('rhubarbe:count-updated')); } catch {}
  }, [cart, setOrderCount]);

  // Handle URL slug → active launch index
  useEffect(() => {
    if (!initialSlug || !launches.length) return;
    const idx = launches.findIndex((l) => l.slug === initialSlug);
    if (idx >= 0) setActiveLaunchIdx(idx);
  }, [initialSlug, launches]);

  const launch = launches[activeLaunchIdx] || null;

  // Compute available pickup days for range menus, filtering out location closed days
  const availablePickupDays = (() => {
    if (!launch || !launch.pickupWindowStart || !launch.pickupWindowEnd) return [];
    const allDays = generatePickupDays(launch.pickupWindowStart, launch.pickupWindowEnd, launch.pickupDate);
    if (allDays.length <= 1) return [];
    const disabledDays = launch.pickupLocation?.disabledPickupDays ?? [];
    return allDays.filter((day) => !isPickupDayDisabled(new Date(day + 'T00:00:00'), disabledDays));
  })();

  // Fetch live Shopify inventory for the active launch's products
  useEffect(() => {
    if (!launch) return;
    const shopifyIds = launch.products
      .map((p) => p.shopifyProductId)
      .filter((id): id is string => !!id);
    if (shopifyIds.length === 0) return;

    const uniqueIds = [...new Set(shopifyIds)];
    fetch(`/api/shopify/inventory?ids=${encodeURIComponent(uniqueIds.join(','))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.inventory) setShopifyStock(data.inventory);
      })
      .catch(() => {});

    // Refresh inventory every 30s while the page is open
    const interval = setInterval(() => {
      fetch(`/api/shopify/inventory?ids=${encodeURIComponent(uniqueIds.join(','))}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.inventory) {
            setShopifyStock(data.inventory);
            // Clamp cart quantities if stock dropped below current qty
            setCart((prev) => prev.map((item) => {
              const baseId = item.productId.includes('::') ? item.productId.split('::')[0] : item.productId;
              const lp = launch.products.find((p) => p.productId === baseId);
              if (!lp?.shopifyProductId) return item;
              const stock = data.inventory[lp.shopifyProductId];
              if (stock === null || stock === undefined) return item;
              const cmsMax = lp.maxQuantityOverride;
              const effectiveMax = cmsMax !== null ? Math.min(cmsMax, stock) : stock;
              if (item.quantity > effectiveMax) {
                return { ...item, quantity: Math.max(effectiveMax, 0) };
              }
              return item;
            }).filter((item) => item.quantity > 0));
          }
        })
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [launch?.id]);

  // Collect unique categories from current launch products
  const categoryMap = new Map<string, string>();
  if (launch) {
    for (const p of launch.products || []) {
      if (p.category) {
        categoryMap.set(p.category, p.categoryLabel || p.category);
      }
    }
  }
  const categories = Array.from(categoryMap.entries()); // [slug, label][]

  const filteredProducts = launch
    ? (launch.products || []).filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
    : [];

  // Group filtered products by category for sectioned display
  const groupedProducts = (() => {
    if (!launch) return [];
    const groups: { slug: string; label: string; products: LaunchProduct[] }[] = [];
    const seen = new Set<string>();
    for (const p of filteredProducts) {
      const slug = p.category || '__uncategorized';
      if (!seen.has(slug)) {
        seen.add(slug);
        groups.push({
          slug,
          label: p.categoryLabel || p.category || (isFr ? 'Autres' : 'Other'),
          products: filteredProducts.filter((fp) => (fp.category || '__uncategorized') === slug),
        });
      }
    }
    return groups;
  })();

  // Menu switch handler — warns if cart has items from a different menu
  // Update browser URL to reflect the active menu slug
  const updateUrlForLaunch = (launch: Launch) => {
    const slug = launch.slug;
    const newPath = slug ? `/order/${slug}` : '/order';
    if (window.location.pathname !== newPath) {
      window.history.replaceState(null, '', newPath);
    }
  };

  const handleMenuSwitch = (idx: number) => {
    if (idx === activeLaunchIdx) return;
    const targetLaunch = launches[idx];
    if (cart.length > 0 && cartLaunchId && cartLaunchId !== targetLaunch.id) {
      setPendingSwitchIdx(idx);
      return;
    }
    setActiveLaunchIdx(idx);
    setCategoryFilter('all');
    updateUrlForLaunch(targetLaunch);
  };

  const confirmMenuSwitch = () => {
    if (pendingSwitchIdx === null) return;
    setCart([]);
    setCartLaunchId(launches[pendingSwitchIdx].id);
    setActiveLaunchIdx(pendingSwitchIdx);
    setCategoryFilter('all');
    updateUrlForLaunch(launches[pendingSwitchIdx]);
    setPendingSwitchIdx(null);
  };

  const cancelMenuSwitch = () => {
    setPendingSwitchIdx(null);
  };

  // Cart helpers
  const addToCart = (product: LaunchProduct) => {
    if (launch) setCartLaunchId(launch.id);
    const max = getMaxForProduct(product.productId);

    const hasVariants = product.variantType !== 'none' && product.variants.length > 1;
    const availableVariants = product.variants.filter((v) => v.available);
    const activeVariant = hasVariants
      ? product.variants.find((v) => v.id === selectedVariants[product.productId]) || availableVariants[0] || null
      : null;

    const price = activeVariant?.price ?? product.price ?? 0;
    const variantLabel = activeVariant
      ? (locale === 'fr' && activeVariant.labelFr ? activeVariant.labelFr : activeVariant.label)
      : null;

    // Cart key combines product + variant
    const cartKey = activeVariant ? `${product.productId}::${activeVariant.id}` : product.productId;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === cartKey);
      if (existing) {
        if (max != null && existing.quantity >= max) return prev;
        return prev.map((i) =>
          i.productId === cartKey ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (max != null && max <= 0) return prev;
      return [...prev, {
        productId: cartKey,
        variantId: activeVariant?.id || null,
        variantLabel,
        name: product.productName,
        price,
        quantity: 1,
        image: product.image,
        shopifyVariantId: activeVariant?.shopifyVariantId || null,
        allergens: product.allergens || [],
      }];
    });
  };

  const getBaseProductId = (id: string) => id.includes('::') ? id.split('::')[0] : id;

  const getMaxForProduct = (productId: string): number | null => {
    if (!launch) return null;
    const baseId = getBaseProductId(productId);
    const lp = launch.products.find((p) => p.productId === baseId);
    const cmsMax = lp?.maxQuantityOverride ?? null;

    // Check Shopify inventory for this product
    const shopifyId = lp?.shopifyProductId;
    const stock = shopifyId ? shopifyStock[shopifyId] : undefined;

    // stock === null means unlimited (not tracked), undefined means unknown
    if (stock === undefined || stock === null) return cmsMax;

    // Enforce the lower of CMS max and Shopify stock
    if (cmsMax === null) return stock > 0 ? stock : 0;
    return Math.min(cmsMax, stock);
  };

  const updateCartQty = (productId: string, qty: number) => {
    const max = getMaxForProduct(productId);
    const clamped = max != null ? Math.min(qty, max) : qty;
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: clamped } : i))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const getQty = (productId: string) => {
    // Sum quantities across all variants of this product
    return cart
      .filter((i) => i.productId === productId || i.productId.startsWith(`${productId}::`))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const getCartKey = (productId: string) => {
    const product = launch?.products.find((p) => p.productId === productId);
    if (!product) return productId;
    const hasVariants = product.variantType !== 'none' && product.variants.length > 1;
    if (!hasVariants) return productId;
    const activeVariantId = selectedVariants[productId] || product.variants.find((v: any) => v.available)?.id;
    return activeVariantId ? `${productId}::${activeVariantId}` : productId;
  };

  const handleCheckout = async () => {
    if (!launch || cart.length === 0) return;

    // Require a pickup slot when the launch defines slots
    if (launch.pickupSlots.length > 0 && !selectedSlotId) {
      setCheckoutError(
        isFr
          ? 'Veuillez sélectionner un créneau de cueillette.'
          : 'Please select a pickup slot.',
      );
      return;
    }

    // Require a pickup day when the launch has a range
    if (availablePickupDays.length > 1 && !selectedPickupDay) {
      setCheckoutError(
        isFr
          ? 'Veuillez sélectionner un jour de cueillette.'
          : 'Please select a pickup day.',
      );
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    const selectedSlot = launch.pickupSlots.find((s) => s.id === selectedSlotId) || null;

    // Build items with Shopify product IDs from launch products
    const items = cart.map((item) => {
      // Extract base product ID (strip variant suffix)
      const baseProductId = item.productId.includes('::') ? item.productId.split('::')[0] : item.productId;
      const lp = launch.products.find((p) => p.productId === baseProductId);
      return {
        productId: baseProductId,
        productName: item.name,
        shopifyProductId: lp?.shopifyProductId || null,
        shopifyVariantId: item.shopifyVariantId || null,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // Use selected pickup day if available, otherwise format the range or single date
    const pickupDateFormatted = selectedPickupDay
      ? formatDate(selectedPickupDay, locale)
      : launch.pickupWindowStart && launch.pickupWindowEnd
        ? formatPickupRange(launch, locale)
        : formatDate(launch.pickupDate, locale);
    const locationName = launch.pickupLocation
      ? (isFr ? launch.pickupLocation.publicLabel.fr : launch.pickupLocation.publicLabel.en)
      : '';
    const locationAddress = launch.pickupLocation?.address || '';

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          launchId: launch.id,
          launchTitle: isFr ? launch.title?.fr : launch.title?.en,
          pickupDate: pickupDateFormatted,
          pickupLocationName: locationName,
          pickupLocationAddress: locationAddress,
          pickupSlot: selectedSlot ? { startTime: selectedSlot.startTime, endTime: selectedSlot.endTime } : undefined,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || (isFr ? 'Erreur lors de la création de la commande' : 'Failed to create checkout'));
        return;
      }

      // Redirect straight to Shopify checkout
      // (Confirmation page code kept below, commented out, in case we want to re-enable)
      window.location.href = data.checkoutUrl;
    } catch {
      setCheckoutError(isFr ? 'Erreur réseau. Veuillez réessayer.' : 'Network error. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Confirmation screen ──
  if (showConfirmation && launch && checkoutUrl) {
    const selectedSlot = launch.pickupSlots.find((s) => s.id === selectedSlotId) || null;
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const locationName = launch.pickupLocation
      ? (isFr ? launch.pickupLocation.publicLabel.fr : launch.pickupLocation.publicLabel.en)
      : '';
    const locationAddress = launch.pickupLocation?.address || '';

    return (
      <main className="pt-20 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto">
        <button
          onClick={() => setShowConfirmation(false)}
          className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 mb-8 flex items-center gap-1"
         
        >
          ← {isFr ? 'Retour au menu' : 'Back to menu'}
        </button>

        <h1
          className="text-2xl uppercase tracking-widest mb-8"
          style={{ fontWeight: 500 }}
        >
          {isFr ? 'Confirmer votre commande' : 'Confirm your order'}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pickup details */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2
              className="text-xs uppercase tracking-widest text-gray-400 mb-4"
             
            >
              {isFr ? 'Détails de cueillette' : 'Pickup details'}
            </h2>

            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Menu
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{isFr ? launch.title?.fr : launch.title?.en}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">
                {isFr ? 'Date' : 'Date'}
              </p>
              <p className="text-sm text-gray-900 mt-0.5">
                {selectedPickupDay ? formatDate(selectedPickupDay, locale) : formatPickupRange(launch, locale)}
              </p>
            </div>

            {selectedSlot && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">
                  {isFr ? 'Créneau' : 'Time slot'}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
              </div>
            )}

            {launch.pickupLocation && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">
                  {isFr ? 'Lieu' : 'Location'}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{locationName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{locationAddress}</p>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="space-y-4">
            <h2
              className="text-xs uppercase tracking-widest text-gray-400 mb-4"
             
            >
              {isFr ? 'Articles' : 'Items'}
            </h2>

            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-3">
                  {item.image && (
                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.variantLabel && item.name.includes(' — ') ? item.name.split(' — ')[0] : item.name}
                    </p>
                    {item.variantLabel && (
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">
                        {item.variantLabel}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {item.quantity} × ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-sm text-gray-500">{isFr ? 'Sous-total' : 'Subtotal'}</span>
              <span className="text-sm font-medium">
                ${(subtotal / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {isFr ? 'Taxes calculées à l\'étape suivante' : 'Taxes calculated at next step'}
            </p>
          </div>
        </div>

        {/* Proceed to payment */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <a
            href={checkoutUrl}
            onClick={() => {
              // Save order details for the thank-you page
              try {
                sessionStorage.setItem('rhubarbe_order', JSON.stringify({
                  menu: isFr ? launch.title?.fr : launch.title?.en,
                  pickupDate: selectedPickupDay ? formatDate(selectedPickupDay, locale) : formatPickupRange(launch, locale),
                  pickupLocation: locationName + (locationAddress ? ` — ${locationAddress}` : ''),
                  pickupSlot: selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : '',
                  items: cart.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                  subtotal,
                }));
              } catch {}
            }}
            className="inline-block px-10 py-3.5 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors"
           
          >
            {isFr ? 'Procéder au paiement' : 'Proceed to payment'}
          </a>
          <p className="text-xs text-gray-400">
            {isFr ? 'Vous serez redirigé vers notre page de paiement sécurisée' : 'You\'ll be redirected to our secure payment page'}
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <OrderPageSkeleton variant="grid" />;
  }

  // Check if all launches are preview-only (ordering not yet open)
  const allPreview = launches.length > 0 && launches.every((l) => !l.orderingOpen);

  if (launches.length === 0) {
    return (
      <main className="pt-20 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="text-center py-24">
          <p
            className="text-xs uppercase tracking-widest text-gray-400 mb-4"
           
          >
            {isFr ? 'Aucun menu disponible' : 'No menus available'}
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {isFr
              ? 'Revenez bientôt — notre prochain menu sera annoncé sous peu.'
              : 'Check back soon — our next menu will be announced shortly.'}
          </p>
        </div>
      </main>
    );
  }

  // Whether the currently selected launch allows ordering
  const currentOrderingOpen = launch?.orderingOpen ?? false;

  return (
    <main className="pt-20 pb-10 px-4 md:px-8 max-w-[1600px] mx-auto">
          {/* Menu selector (if multiple) */}
          {launches.length > 1 && (
            <div className="flex flex-col md:flex-row md:items-baseline" style={{ paddingTop: 80, gap: '16px', marginBottom: 32 }}>
              {launches.map((l, i) => {
                const isActive = i === activeLaunchIdx;
                const count = (l.products || []).length;
                return (
                  <button
                    key={l.id}
                    onClick={() => handleMenuSwitch(i)}
                    className="text-[48px] leading-none transition-colors"
                    style={{ color: isActive ? '#1A3821' : 'rgba(26,56,33,0.4)' }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#D49BCB'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                  >
                    {isFr ? l.title?.fr : l.title?.en}
                    <sup style={{ fontSize: 14, marginLeft: 2, verticalAlign: 'super', position: 'relative', top: '-0.2em', opacity: isActive ? 1 : 1 }}>({count})</sup>
                  </button>
                );
              })}
            </div>
          )}

          {launch && (
            <>
              {/* Menu title (single launch) */}
              {launches.length <= 1 && (
                <h1 className="leading-none mb-8" style={{ fontSize: 48, color: '#1A3821', paddingTop: 80 }}>
                  {isFr ? launch.title?.fr : launch.title?.en}
                  <sup style={{ fontSize: 14, marginLeft: 2, verticalAlign: 'super', position: 'relative', top: '-0.2em' }}>({(launch.products || []).length})</sup>
                </h1>
              )}

              {/* Menu details bar */}
              <div className="mb-10">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-500 py-3">
                  <div>
                    <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Commander avant' : 'Order by'}</span>
                    <p className="text-gray-700 mt-0.5">{formatDatetime(launch.orderCloses, locale)}</p>
                  </div>
                  <div>
                    <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Cueillette' : 'Pickup'}</span>
                    <p className="text-gray-700 mt-0.5">{formatPickupRange(launch, locale)}</p>
                  </div>
                  {launch.pickupLocation && (
                    <div>
                      <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Lieu' : 'Location'}</span>
                      <p className="text-gray-700 mt-0.5">
                        {isFr ? launch.pickupLocation.publicLabel.fr : launch.pickupLocation.publicLabel.en}
                      </p>
                    </div>
                  )}
                  {launch.pickupSlots.length > 0 && (
                    <div>
                      <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Créneaux' : 'Slots'}</span>
                      <p className="text-gray-700 mt-0.5">
                        {launch.pickupSlots[0].startTime} – {launch.pickupSlots[launch.pickupSlots.length - 1].endTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordering not yet open banner */}
              {!currentOrderingOpen && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-8">
                  <p
                    className="text-xs uppercase tracking-widest text-amber-700 mb-1"
                   
                  >
                    {isFr ? 'Commandes bientôt disponibles' : 'Ordering opens soon'}
                  </p>
                  <p className="text-sm text-amber-600">
                    {isFr
                      ? `Les commandes ouvrent le ${formatDatetime(launch.orderOpens, locale)}`
                      : `Ordering opens ${formatDatetime(launch.orderOpens, locale)}`}
                  </p>
                </div>
              )}

              {/* Category filter */}
              {categories.length > 1 && (
                <div className="flex items-baseline mb-8" style={{ gap: '32px' }}>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="text-[48px] leading-none transition-colors"
                    style={{ color: categoryFilter === 'all' ? '#1A3821' : 'rgba(26,56,33,0.4)' }}
                    onMouseEnter={(e) => { if (categoryFilter !== 'all') e.currentTarget.style.color = '#D49BCB'; }}
                    onMouseLeave={(e) => { if (categoryFilter !== 'all') e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                  >
                    {isFr ? 'Tout' : 'All'}<sup className="text-[16px] ml-[2px]">{(launch.products || []).length}</sup>
                  </button>
                  {categories.map(([slug, label]) => {
                    const count = (launch.products || []).filter((p) => p.category === slug).length;
                    const isActive = categoryFilter === slug;
                    return (
                      <button
                        key={slug}
                        onClick={() => setCategoryFilter(slug)}
                        className="text-[48px] leading-none transition-colors"
                        style={{ color: isActive ? '#1A3821' : 'rgba(26,56,33,0.4)' }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#D49BCB'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(26,56,33,0.4)'; }}
                      >
                        {label}<sup className="text-[16px] ml-[2px]">{count}</sup>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Product grid — grouped by category */}
              <div className="space-y-12">
                {groupedProducts.map((group) => (
                  <section key={group.slug}>
                    {/* Show category heading when viewing all or when there are multiple groups */}
                    {(categoryFilter === 'all' && categories.length > 0) && (
                      <h2
                        className="text-xs uppercase tracking-widest text-gray-400 mb-5 pb-2 border-b border-gray-100"
                       
                      >
                        {group.label}
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-6">
                      {group.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          locale={locale}
                          quantity={(() => {
                            const cartKey = getCartKey(product.productId);
                            const item = cart.find((i) => i.productId === cartKey);
                            return item?.quantity || 0;
                          })()}
                          maxQuantity={currentOrderingOpen ? getMaxForProduct(product.productId) : 0}
                          onAdd={() => addToCart(product)}
                          onRemove={() => {
                            const cartKey = getCartKey(product.productId);
                            const existing = cart.find((i) => i.productId === cartKey);
                            if (existing) {
                              if (existing.quantity <= 1) removeFromCart(cartKey);
                              else updateCartQty(cartKey, existing.quantity - 1);
                            }
                          }}
                          selectedVariantId={selectedVariants[product.productId] || null}
                          onSelectVariant={(variantId) =>
                            setSelectedVariants((prev) => ({ ...prev, [product.productId]: variantId }))
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

      {/* Menu switch confirmation modal */}
      <MenuSwitchModal
        open={pendingSwitchIdx !== null}
        onConfirm={confirmMenuSwitch}
        onCancel={cancelMenuSwitch}
        targetMenuName={
          pendingSwitchIdx !== null
            ? (isFr ? launches[pendingSwitchIdx].title?.fr : launches[pendingSwitchIdx].title?.en)
            : ''
        }
        locale={locale}
      />

    </main>
  );
}

function OrderCartFooter({ cart, checkoutLoading, isFr, onCheckout }: { cart: { price: number; quantity: number }[]; checkoutLoading: boolean; isFr: boolean; onCheckout: () => void }) {
  if (cart.length === 0) return null;
  return (
    <button onClick={onCheckout} disabled={checkoutLoading} data-checkout
      className="w-full py-3 rounded-full bg-white text-[#0065B6] text-[16px] font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-between px-6">
      <span>{checkoutLoading ? (isFr ? 'Chargement…' : 'Loading…') : (isFr ? 'Passer à la caisse' : 'Checkout')}</span>
      <span>${(cart.reduce((s, i) => s + i.price * i.quantity, 0) / 100).toFixed(2)}</span>
    </button>
  );
}
