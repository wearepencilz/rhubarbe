'use client';

import { useCart } from '@/contexts/CartContext';
import { useT } from '@/lib/i18n/useT';

export default function CartButton({ color }: { color?: string }) {
  const { openCart, cart } = useCart();
  const { T } = useT();

  const itemCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;

  return (
    <button
      onClick={openCart}
      className="relative hover:opacity-60 transition-opacity pointer-events-auto"
      aria-label={itemCount > 0 ? T.cart.openWithItems(itemCount) : T.cart.open}
      style={{ color }}
    >
      <span className="text-[12px] md:text-[14px] tracking-[0.28px] uppercase leading-none font-[500]"
        style={{ fontFamily: 'var(--font-diatype-mono)' }}>
        {itemCount > 0 ? T.nav.cartCount(itemCount) : T.nav.cart}
      </span>
    </button>
  );
}
