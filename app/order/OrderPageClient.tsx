'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';

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
  category: string | null;
  categoryLabel: string | null;
  slug: string;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  allergens: string[];
  serves: string | null;
  translations: any;
}

interface PickupLocation {
  id: string;
  internalName: string;
  publicLabel: { en: string; fr: string };
  address: string;
}

interface Launch {
  id: string;
  title: { en: string; fr: string };
  introCopy: { en: string; fr: string };
  status: string;
  orderOpens: string;
  orderCloses: string;
  pickupDate: string;
  pickupSlots: Array<{ id: string; startTime: string; endTime: string; capacity?: number }>;
  pickupLocation: PickupLocation | null;
  products: LaunchProduct[];
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function formatDatetime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function ProductCard({
  product,
  locale,
  quantity,
  maxQuantity,
  onAdd,
  onRemove,
}: {
  product: LaunchProduct;
  locale: string;
  quantity: number;
  maxQuantity: number | null;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const displayName = product.translations?.fr?.title && locale === 'fr'
    ? product.translations.fr.title
    : product.productName;
  const description = product.translations?.fr?.description && locale === 'fr'
    ? product.translations.fr.description
    : product.description;

  const atMax = maxQuantity != null && quantity >= maxQuantity;
  const soldOut = maxQuantity != null && maxQuantity <= 0;

  return (
    <div className={`group flex flex-col gap-3 ${soldOut ? 'opacity-60' : ''}`}>
      {product.image && (
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
          <img
            src={product.image}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {soldOut ? (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p
                className="text-center text-white text-xs uppercase tracking-widest font-medium"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {locale === 'fr' ? 'Épuisé' : 'Sold out'}
              </p>
            </div>
          ) : (
          /* Quick-add overlay */
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {quantity === 0 ? (
              <button
                onClick={onAdd}
                disabled={atMax}
                className="w-full py-2 bg-white text-black text-xs uppercase tracking-widest font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {locale === 'fr' ? 'Ajouter' : 'Add to order'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onRemove}
                  className="w-8 h-8 bg-white text-black rounded flex items-center justify-center text-lg hover:bg-gray-100"
                >
                  −
                </button>
                <span className="text-white font-medium text-sm min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={onAdd}
                  disabled={atMax}
                  className="w-8 h-8 bg-white text-black rounded flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}
          >
            {displayName}
          </h3>
          {product.price != null && product.price > 0 && (
            <span className="text-sm shrink-0" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              ${(product.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>
        )}
        {/* Mobile quick-add */}
        <div className="mt-2 md:hidden">
          {soldOut ? (
            <p
              className="w-full py-2 text-center text-xs uppercase tracking-widest font-medium text-gray-400"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {locale === 'fr' ? 'Épuisé' : 'Sold out'}
            </p>
          ) : quantity === 0 ? (
            <button
              onClick={onAdd}
              disabled={atMax}
              className="w-full py-2 border border-gray-300 text-xs uppercase tracking-widest font-medium rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {locale === 'fr' ? '+ Ajouter' : '+ Add'}
            </button>
          ) : (
            <div className="flex items-center justify-between border border-gray-300 rounded">
              <button onClick={onRemove} className="px-3 py-2 hover:bg-gray-50 text-lg">−</button>
              <span className="text-sm font-medium">{quantity}{maxQuantity != null ? ` / ${maxQuantity}` : ''}</span>
              <button onClick={onAdd} disabled={atMax} className="px-3 py-2 hover:bg-gray-50 text-lg disabled:opacity-30 disabled:cursor-not-allowed">+</button>
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
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
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
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            {isFr ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            {isFr ? 'Vider et changer' : 'Clear & switch'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineCart({
  items,
  onUpdateQty,
  onRemove,
  locale,
  getMax,
  pickupSlots,
  selectedSlotId,
  onSelectSlot,
  onCheckout,
  checkoutLoading,
  checkoutError,
}: {
  items: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  locale: string;
  getMax: (productId: string) => number | null;
  pickupSlots: Array<{ id: string; startTime: string; endTime: string }>;
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  onCheckout: () => void;
  checkoutLoading: boolean;
  checkoutError: string | null;
}) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFr = locale === 'fr';

  return (
    <div className="bg-white border border-gray-200 rounded-lg sticky top-28">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2
          className="text-xs uppercase tracking-widest text-gray-400"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          {isFr ? 'Votre commande' : 'Your order'}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">{isFr ? 'Aucun article' : 'No items yet'}</p>
          <p className="text-xs text-gray-300 mt-1">{isFr ? 'Cliquez sur un produit pour l\'ajouter' : 'Click a product to add it'}</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="px-5 py-3 flex items-center gap-3">
                {item.image && (
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${(item.price / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => item.quantity <= 1 ? onRemove(item.productId) : onUpdateQty(item.productId, item.quantity - 1)}
                    className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-sm hover:bg-gray-50"
                  >
                    {item.quantity <= 1 ? '×' : '−'}
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  {(() => {
                    const max = getMax(item.productId);
                    const atMax = max != null && item.quantity >= max;
                    return (
                      <button
                        onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                        disabled={atMax}
                        className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-gray-200 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isFr ? 'Sous-total' : 'Subtotal'}</span>
              <span className="font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                ${(subtotal / 100).toFixed(2)}
              </span>
            </div>

            {/* Pickup slot selector */}
            {pickupSlots.length > 0 && (
              <div>
                <label
                  className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {isFr ? 'Créneau de cueillette' : 'Pickup slot'}
                </label>
                <select
                  value={selectedSlotId || ''}
                  onChange={(e) => onSelectSlot(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#333112]"
                >
                  <option value="">{isFr ? 'Choisir un créneau…' : 'Choose a slot…'}</option>
                  {pickupSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} – {slot.endTime}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-gray-400">
              {isFr ? 'Taxes calculées à la caisse' : 'Taxes calculated at checkout'}
            </p>

            {checkoutError && (
              <p className="text-xs text-red-600">{checkoutError}</p>
            )}

            <button
              onClick={onCheckout}
              disabled={checkoutLoading || (pickupSlots.length > 0 && !selectedSlotId)}
              className="w-full py-3 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {checkoutLoading
                ? (isFr ? 'Chargement…' : 'Loading…')
                : (isFr ? 'Passer à la caisse' : 'Checkout')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function OrderPageClient() {
  const { T, locale } = useT();
  const isFr = locale === 'fr';

  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLaunchIdx, setActiveLaunchIdx] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLaunchId, setCartLaunchId] = useState<string | null>(null);
  const [pendingSwitchIdx, setPendingSwitchIdx] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [shopifyStock, setShopifyStock] = useState<Record<string, number | null>>({});

  useEffect(() => {
    fetch('/api/launches/current')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setLaunches(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const launch = launches[activeLaunchIdx] || null;

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
              const lp = launch.products.find((p) => p.productId === item.productId);
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
    for (const p of launch.products) {
      if (p.category) {
        categoryMap.set(p.category, p.categoryLabel || p.category);
      }
    }
  }
  const categories = Array.from(categoryMap.entries()); // [slug, label][]

  const filteredProducts = launch
    ? launch.products.filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
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
  const handleMenuSwitch = (idx: number) => {
    if (idx === activeLaunchIdx) return;
    const targetLaunch = launches[idx];
    if (cart.length > 0 && cartLaunchId && cartLaunchId !== targetLaunch.id) {
      setPendingSwitchIdx(idx);
      return;
    }
    setActiveLaunchIdx(idx);
    setCategoryFilter('all');
  };

  const confirmMenuSwitch = () => {
    if (pendingSwitchIdx === null) return;
    setCart([]);
    setCartLaunchId(launches[pendingSwitchIdx].id);
    setActiveLaunchIdx(pendingSwitchIdx);
    setCategoryFilter('all');
    setPendingSwitchIdx(null);
  };

  const cancelMenuSwitch = () => {
    setPendingSwitchIdx(null);
  };

  // Cart helpers
  const addToCart = (product: LaunchProduct) => {
    if (launch) setCartLaunchId(launch.id);
    const max = getMaxForProduct(product.productId);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        if (max != null && existing.quantity >= max) return prev;
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Don't add if stock is 0
      if (max != null && max <= 0) return prev;
      return [...prev, {
        productId: product.productId,
        name: product.productName,
        price: product.price || 0,
        quantity: 1,
        image: product.image,
      }];
    });
  };

  const getMaxForProduct = (productId: string): number | null => {
    if (!launch) return null;
    const lp = launch.products.find((p) => p.productId === productId);
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

  const getQty = (productId: string) => cart.find((i) => i.productId === productId)?.quantity || 0;

  const handleCheckout = async () => {
    if (!launch || cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError(null);

    const selectedSlot = launch.pickupSlots.find((s) => s.id === selectedSlotId) || null;

    // Build items with Shopify product IDs from launch products
    const items = cart.map((item) => {
      const lp = launch.products.find((p) => p.productId === item.productId);
      return {
        productId: item.productId,
        productName: item.name,
        shopifyProductId: lp?.shopifyProductId || null,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const pickupDateFormatted = formatDate(launch.pickupDate, locale);
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
          launchTitle: isFr ? launch.title.fr : launch.title.en,
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

      // Show confirmation page instead of immediate redirect
      setCheckoutUrl(data.checkoutUrl);
      setShowConfirmation(true);
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
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-screen-lg mx-auto">
        <button
          onClick={() => setShowConfirmation(false)}
          className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 mb-8 flex items-center gap-1"
          style={{ fontFamily: 'var(--font-diatype-mono)' }}
        >
          ← {isFr ? 'Retour au menu' : 'Back to menu'}
        </button>

        <h1
          className="text-2xl uppercase tracking-widest mb-8"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}
        >
          {isFr ? 'Confirmer votre commande' : 'Confirm your order'}
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pickup details */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2
              className="text-xs uppercase tracking-widest text-gray-400 mb-4"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {isFr ? 'Détails de cueillette' : 'Pickup details'}
            </h2>

            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                Menu
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{isFr ? launch.title.fr : launch.title.en}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                {isFr ? 'Date' : 'Date'}
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{formatDate(launch.pickupDate, locale)}</p>
            </div>

            {selectedSlot && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  {isFr ? 'Créneau' : 'Time slot'}
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
              </div>
            )}

            {launch.pickupLocation && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
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
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
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
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {item.quantity} × ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${((item.price * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-sm text-gray-500">{isFr ? 'Sous-total' : 'Subtotal'}</span>
              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
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
            className="inline-block px-10 py-3.5 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-[#333112]/90 transition-colors"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
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
    return (
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#333112]" />
        </div>
      </main>
    );
  }

  if (launches.length === 0) {
    return (
      <main className="pt-32 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        <div className="text-center py-24">
          <p
            className="text-xs uppercase tracking-widest text-gray-400 mb-4"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
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

  return (
    <main className="pt-28 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
      <div className="flex gap-8">
        {/* Left: Menu content (3/4) */}
        <div className="flex-1 min-w-0">
          {/* Menu selector (if multiple) */}
          {launches.length > 1 && (
            <div className="flex gap-2 mb-8 flex-wrap">
              {launches.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => handleMenuSwitch(i)}
                  className={`px-4 py-2 text-xs uppercase tracking-widest rounded transition-colors ${
                    i === activeLaunchIdx
                      ? 'bg-[#333112] text-white'
                      : 'border border-gray-300 text-gray-600 hover:border-[#333112]'
                  }`}
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {isFr ? l.title.fr : l.title.en}
                </button>
              ))}
            </div>
          )}

          {launch && (
            <>
              {/* Menu header */}
              <div className="mb-10">
                <p
                  className="text-xs uppercase tracking-widest text-gray-400 mb-2"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {isFr ? 'Précommande' : 'Preorder'}
                </p>
                <h1
                  className="text-2xl md:text-3xl uppercase tracking-widest mb-4"
                  style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}
                >
                  {isFr ? launch.title.fr : launch.title.en}
                </h1>
                <p className="text-sm text-gray-500 max-w-lg leading-relaxed mb-6">
                  {isFr ? launch.introCopy.fr : launch.introCopy.en}
                </p>

                {/* Menu details bar */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-gray-500 border-t border-b border-gray-200 py-3" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  <div>
                    <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Commander avant' : 'Order by'}</span>
                    <p className="text-gray-700 mt-0.5">{formatDatetime(launch.orderCloses, locale)}</p>
                  </div>
                  <div>
                    <span className="uppercase tracking-widest text-gray-400">{isFr ? 'Cueillette' : 'Pickup'}</span>
                    <p className="text-gray-700 mt-0.5">{formatDate(launch.pickupDate, locale)}</p>
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

              {/* Category filter */}
              {categories.length > 1 && (
                <div className="flex gap-2 mb-8 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-full transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-[#333112] text-white'
                        : 'border border-gray-300 text-gray-500 hover:border-[#333112]'
                    }`}
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}
                  >
                    {isFr ? 'Tout' : 'All'} ({launch.products.length})
                  </button>
                  {categories.map(([slug, label]) => {
                    const count = launch.products.filter((p) => p.category === slug).length;
                    return (
                      <button
                        key={slug}
                        onClick={() => setCategoryFilter(slug)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-full transition-colors ${
                          categoryFilter === slug
                            ? 'bg-[#333112] text-white'
                            : 'border border-gray-300 text-gray-500 hover:border-[#333112]'
                        }`}
                        style={{ fontFamily: 'var(--font-diatype-mono)' }}
                      >
                        {label} ({count})
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
                        style={{ fontFamily: 'var(--font-diatype-mono)' }}
                      >
                        {group.label}
                      </h2>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
                      {group.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          locale={locale}
                          quantity={getQty(product.productId)}
                          maxQuantity={getMaxForProduct(product.productId)}
                          onAdd={() => addToCart(product)}
                          onRemove={() => {
                            const qty = getQty(product.productId);
                            if (qty <= 1) removeFromCart(product.productId);
                            else updateCartQty(product.productId, qty - 1);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: Inline cart (1/4) — hidden on mobile */}
        <div className="hidden lg:block w-80 shrink-0">
          <InlineCart
            items={cart}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            locale={locale}
            getMax={getMaxForProduct}
            pickupSlots={launch?.pickupSlots || []}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
            checkoutError={checkoutError}
          />
        </div>
      </div>

      {/* Mobile pickup slot selector */}
      {cart.length > 0 && launch && launch.pickupSlots.length > 0 && (
        <div className="lg:hidden fixed bottom-[60px] inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <label
            className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            {isFr ? 'Créneau de cueillette' : 'Pickup slot'}
          </label>
          <select
            value={selectedSlotId || ''}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#333112]"
          >
            <option value="">{isFr ? 'Choisir un créneau…' : 'Choose a slot…'}</option>
            {launch.pickupSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.startTime} – {slot.endTime}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mobile cart summary (fixed bottom bar) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          {checkoutError && (
            <p className="text-xs text-red-600 mb-2">{checkoutError}</p>
          )}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">
                {cart.reduce((s, i) => s + i.quantity, 0)} {isFr ? 'articles' : 'items'}
              </span>
              <span className="text-sm text-gray-500 ml-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                ${(cart.reduce((s, i) => s + i.price * i.quantity, 0) / 100).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || (launch != null && launch.pickupSlots.length > 0 && !selectedSlotId)}
              className="px-5 py-2.5 bg-[#333112] text-white text-xs uppercase tracking-widest font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {checkoutLoading
                ? (isFr ? 'Chargement…' : 'Loading…')
                : (isFr ? 'Commander' : 'Checkout')}
            </button>
          </div>
        </div>
      )}

      {/* Menu switch confirmation modal */}
      <MenuSwitchModal
        open={pendingSwitchIdx !== null}
        onConfirm={confirmMenuSwitch}
        onCancel={cancelMenuSwitch}
        targetMenuName={
          pendingSwitchIdx !== null
            ? (isFr ? launches[pendingSwitchIdx].title.fr : launches[pendingSwitchIdx].title.en)
            : ''
        }
        locale={locale}
      />
    </main>
  );
}
