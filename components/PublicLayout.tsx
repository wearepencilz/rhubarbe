'use client';

import { usePathname } from 'next/navigation';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCart } from '@/contexts/CartContext';

export default function PublicLayout({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const { cart } = useCart();

  let currentCount = 0;
  if (pathname?.startsWith('/order')) currentCount = orderCount;
  else if (pathname?.startsWith('/catering')) currentCount = volumeCount;
  else if (pathname?.startsWith('/cake')) currentCount = cakeCount;
  else currentCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;

  const hasItems = currentCount > 0 && !isAdmin;

  return (
    <div className={hasItems ? 'pr-[60px]' : ''}>
      {!isAdmin && header}
      {children}
      {!isAdmin && footer}
    </div>
  );
}
