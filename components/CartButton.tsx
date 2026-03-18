'use client';

import { useCart } from '@/contexts/CartContext';

export default function CartButton({ color }: { color?: string }) {
  const { openCart, cart } = useCart();

  const itemCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;

  return (
    <button
      onClick={openCart}
      className="relative hover:opacity-60 transition-opacity pointer-events-auto"
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
      style={{ color }}
    >
      <span className="text-[12px] md:text-[14px] tracking-[0.28px] uppercase leading-none font-[500]"
        style={{ fontFamily: 'var(--font-diatype-mono)' }}>
        Cart{itemCount > 0 ? ` (${itemCount})` : ''}
      </span>
    </button>
  );
}
