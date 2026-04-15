'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
import { useCakeCart } from '@/contexts/CakeCartContext';
import { useT } from '@/lib/i18n/useT';

interface UnifiedCartPanelProps {
  open: boolean;
  onClose: () => void;
}

interface OrderCartItem {
  productId: string; name: string; variantLabel: string | null;
  price: number; quantity: number; image: string | null;
}

interface CateringSnapshot {
  items: Array<{ productName: string; variantLabel: string | null; quantity: number; linePriceCents: number }>;
  subtotalCents: number; fulfillmentDate: string | null; allergenNote: string | null;
}

const TABS = [
  { key: 'weekly',   label: { en: 'Weekly',   fr: 'Hebdo'    }, href: '/order'    },
  { key: 'catering', label: { en: 'Catering', fr: 'Traiteur' }, href: '/catering' },
  { key: 'cake',     label: { en: 'Cake',     fr: 'Gâteaux'  }, href: '/cake'     },
];

export default function UnifiedCartPanel({ open, onClose }: UnifiedCartPanelProps) {
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const { slots, defaultTab } = useCartDrawer();
  const { items: cakeItems, fulfillment: cakeFulfillment } = useCakeCart();
  const { locale } = useT();
  const isFr = locale === 'fr';

  const counts: Record<string, number> = { weekly: orderCount, catering: volumeCount, cake: cakeCount };
  const totalCount = orderCount + volumeCount + cakeCount;

  const [manualTab, setManualTab] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [weeklyItems, setWeeklyItems] = useState<OrderCartItem[]>([]);
  const [cateringSnapshot, setCateringSnapshot] = useState<CateringSnapshot | null>(null);
  const activeTab = manualTab ?? defaultTab;

  // Ref for focus return on close
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) { setManualTab(null); return; }
    setTick((n) => n + 1);
    try { const r = localStorage.getItem('rhubarbe:order:cart'); setWeeklyItems(r ? JSON.parse(r) : []); } catch { setWeeklyItems([]); }
    try { const r = localStorage.getItem('rhubarbe:volume:cart:snapshot'); setCateringSnapshot(r ? JSON.parse(r) : null); } catch { setCateringSnapshot(null); }
    // Focus close button when drawer opens
    setTimeout(() => closeButtonRef.current?.focus(), 50);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const panel = document.getElementById('unified-cart-panel');
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open, activeTab, tick]);

  function renderWeekly() {
    const slot = slots.current['weekly'];
    if (slot) return <div key={tick}>{slot.renderContent()}</div>;
    if (!weeklyItems.length) return (
      <div className="py-8 text-center space-y-3">
        <p className="text-[14px] opacity-60">{isFr ? 'Panier vide' : 'Cart is empty'}</p>
        <Link href="/order" onClick={onClose} className="inline-block px-6 py-2 rounded-full border border-white text-[12px] text-white hover:bg-white/10 transition-colors">
          {isFr ? 'Voir le menu' : 'Browse menu'}
        </Link>
      </div>
    );
    const subtotal = weeklyItems.reduce((s, i) => s + i.price * i.quantity, 0);
    return (
      <div className="space-y-3">
        {weeklyItems.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 py-2">
            {item.image && <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-white/10"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white truncate">{item.name}</p>
              {item.variantLabel && <p className="text-[11px] opacity-70">{item.variantLabel}</p>}
            </div>
            <span className="text-[11px] shrink-0">{item.quantity} × ${(item.price/100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-white pt-3 flex justify-between text-[12px] mb-16">
          <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
          <span className="font-medium">${(subtotal/100).toFixed(2)}</span>
        </div>
        <p className="text-[11px] opacity-60">{isFr ? 'Allez sur la page commande pour choisir votre date.' : 'Go to the order page to select your date.'}</p>
      </div>
    );
  }

  function renderWeeklyFooter() {
    const slot = slots.current['weekly'];
    if (slot) return slot.renderFooter();
    if (!weeklyItems.length) return null;
    return (
      <a href="/order" className="block w-full py-3 rounded-full bg-white text-[#0065B6] text-[14px] font-medium text-center hover:bg-white/90 transition-colors">
        {isFr ? 'Finaliser la commande' : 'Complete order'}
      </a>
    );
  }

  function renderCatering() {
    const slot = slots.current['catering'];
    if (slot) return <div key={tick}>{slot.renderContent()}</div>;
    if (!cateringSnapshot || !cateringSnapshot.items.length) return (
      <div className="py-8 text-center space-y-3">
        <p className="text-[14px] opacity-60">{isFr ? 'Panier vide' : 'Cart is empty'}</p>
        <Link href="/catering" onClick={onClose} className="inline-block px-6 py-2 rounded-full border border-white text-[12px] text-white hover:bg-white/10 transition-colors">
          {isFr ? 'Voir le traiteur' : 'Browse catering'}
        </Link>
      </div>
    );
    return (
      <div className="space-y-3">
        {cateringSnapshot.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-1">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] truncate">{item.productName}</p>
              {item.variantLabel && <p className="text-[11px] opacity-70">{item.variantLabel}</p>}
            </div>
            <span className="text-[11px] shrink-0">{item.quantity} × ${((item.linePriceCents/item.quantity)/100).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-white pt-3 flex justify-between text-[12px] mb-16">
          <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
          <span className="font-medium">${(cateringSnapshot.subtotalCents/100).toFixed(2)}</span>
        </div>
        {cateringSnapshot.fulfillmentDate && <p className="text-[11px] opacity-70">Date: {cateringSnapshot.fulfillmentDate}</p>}
        {cateringSnapshot.allergenNote && <p className="text-[11px] opacity-70">{cateringSnapshot.allergenNote}</p>}
        <p className="text-[11px] opacity-60">{isFr ? 'Allez sur la page traiteur pour modifier ou commander.' : 'Go to the catering page to modify or check out.'}</p>
      </div>
    );
  }

  function renderCateringFooter() {
    const slot = slots.current['catering'];
    if (slot) return slot.renderFooter();
    if (!cateringSnapshot?.items.length) return null;
    return (
      <a href="/catering" className="block w-full py-3 rounded-full bg-white text-[#0065B6] text-[14px] font-medium text-center hover:bg-white/90 transition-colors">
        {isFr ? 'Finaliser la commande' : 'Complete order'}
      </a>
    );
  }

  function renderCake() {
    const slot = slots.current['cake'];
    if (slot) return <div key={tick}>{slot.renderContent()}</div>;
    if (!cakeItems.length) return (
      <div className="py-8 text-center space-y-3">
        <p className="text-[14px] opacity-60">{isFr ? 'Aucun gâteau' : 'No cakes'}</p>
        <Link href="/cake" onClick={onClose} className="inline-block px-6 py-2 rounded-full border border-white text-[12px] text-white hover:bg-white/10 transition-colors">
          {isFr ? 'Voir les gâteaux' : 'Browse cakes'}
        </Link>
      </div>
    );
    const total = cakeItems.reduce((s, i) => s + (i.computedPrice ?? 0), 0);
    return (
      <div className="space-y-3">
        {cakeItems.map((item) => (
          <div key={item.cartId} className="flex items-center gap-3 py-2">
            {item.productImage && <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-white/10"><img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] truncate">{item.productName}</p>
              {item.flavourHandles.length > 0 && <p className="text-[11px] opacity-70">{item.flavourHandles.join(', ')}</p>}
              {item.size && <p className="text-[11px] opacity-70">{item.size} {isFr ? 'invités' : 'guests'}</p>}
            </div>
            {item.computedPrice != null && <span className="text-[11px] shrink-0">${(item.computedPrice/100).toFixed(2)}</span>}
          </div>
        ))}
        {total > 0 && (
          <div className="border-t border-white pt-3 flex justify-between text-[12px] mb-16">
            <span>{isFr ? 'Total estimé' : 'Est. total'}</span>
            <span className="font-medium">${(total/100).toFixed(2)}</span>
          </div>
        )}
        {cakeFulfillment.pickupDate && <p className="text-[11px] opacity-70">Date: {cakeFulfillment.pickupDate}</p>}
        <p className="text-[11px] opacity-60">{isFr ? 'Allez sur la page gâteaux pour modifier ou commander.' : 'Go to the cake page to edit or check out.'}</p>
      </div>
    );
  }

  function renderCakeFooter() {
    const slot = slots.current['cake'];
    if (slot) return slot.renderFooter();
    if (!cakeItems.length) return null;
    return (
      <a href="/cake" className="block w-full py-3 rounded-full bg-white text-[#0065B6] text-[14px] font-medium text-center hover:bg-white/90 transition-colors">
        {isFr ? 'Finaliser la commande' : 'Complete order'}
      </a>
    );
  }

  const renderers: Record<string, { content: () => React.ReactNode; footer: () => React.ReactNode }> = {
    weekly:   { content: renderWeekly,   footer: renderWeeklyFooter   },
    catering: { content: renderCatering, footer: renderCateringFooter },
    cake:     { content: renderCake,     footer: renderCakeFooter     },
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden="true" />}
      <div
        id="unified-cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label={isFr ? 'Panier' : 'Cart'}
        className={`fixed right-0 top-0 h-full w-full md:w-1/2 md:max-w-[50vw] z-[70] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        style={{ backgroundColor: '#0065B6', color: 'white' }}
      >
        {/* Header — tabs replace the Cart(n) heading */}
        <div className="flex items-start justify-between px-6 pt-10 pb-0 shrink-0">
          <div role="tablist" aria-label={isFr ? 'Types de panier' : 'Cart types'} className="flex flex-col md:flex-row" style={{ gap: 20 }}>
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              const count = counts[t.key] ?? 0;
              return (
                <button key={t.key} type="button" role="tab"
                  id={`cart-tab-btn-${t.key}`}
                  aria-selected={isActive} aria-controls={`cart-tab-${t.key}`}
                  onClick={() => setManualTab(t.key)}
                  className="text-[20px] transition-opacity leading-none"
                  style={{ opacity: isActive ? 1 : 0.4 }}>
                  {isFr ? t.label.fr : t.label.en}
                  {count > 0 && <sup style={{ fontSize: 13, marginLeft: 2, verticalAlign: 'super', position: 'relative', top: '-0.1em' }}>({count})</sup>}
                </button>
              );
            })}
          </div>
          <button ref={closeButtonRef} onClick={onClose} className="text-[14px] hover:opacity-70 mt-1"
            aria-label={isFr ? 'Fermer le panier' : 'Close cart'}>close</button>
        </div>

        {/* Content */}
        <div id={`cart-tab-${activeTab}`} role="tabpanel" className="flex-1 overflow-y-auto px-6 pb-4" style={{ paddingTop: 56 }}>
          {renderers[activeTab]?.content()}
        </div>

        {/* Footer */}
        {(() => { const f = renderers[activeTab]?.footer(); return f ? <div className="px-6 py-4 shrink-0">{f}</div> : null; })()}
      </div>
    </>
  );
}
