'use client';

import { useCart } from '@/contexts/CartContext';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { usePathname } from 'next/navigation';

export default function CartModal() {
  const { cart } = useCart();
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const pathname = usePathname();

  // Show only the current page's count
  let currentCount = 0;
  if (pathname?.startsWith('/order')) currentCount = orderCount;
  else if (pathname?.startsWith('/catering')) currentCount = volumeCount;
  else if (pathname?.startsWith('/cake')) currentCount = cakeCount;
  else {
    const shopifyCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;
    currentCount = shopifyCount;
  }

  if (currentCount <= 0) return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-order-cart'));
  };

  return (
    <button
      onClick={handleClick}
      className="fixed right-0 top-0 h-screen w-[60px] z-[60] flex items-center justify-center cursor-pointer"
      style={{ backgroundColor: '#0065B6' }}
      aria-label={`Open cart (${currentCount} items)`}
    >
      <span className="text-white text-[14px] tracking-wider whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        cart ({currentCount})
      </span>
    </button>
  );
}
