'use client';

import Link from 'next/link';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCart } from '@/contexts/CartContext';

export default function SiteNav() {
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const { cart } = useCart();
  const cartCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;

  const menuStyle = {
    fontFamily: 'var(--font-solar-display)',
    color: '#1A3821',
    fontSize: '16px',
  } as const;

  const items = [
    { href: '/order', label: 'menu', count: orderCount },
    { href: '/catering', label: 'catering', count: volumeCount },
    { href: '/cake', label: 'cakes', count: cakeCount },
    { href: '/stories', label: 'stories', count: 0 },
  ];

  return (
    <nav className="flex items-center gap-6 lowercase leading-none" style={menuStyle}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="hover:opacity-60 transition-opacity relative">
          {item.label}
          {item.count > 0 && (
            <sup className="text-[10px] opacity-50 ml-[1px]">({item.count})</sup>
          )}
        </Link>
      ))}
    </nav>
  );
}
