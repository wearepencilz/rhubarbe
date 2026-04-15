'use client';

import { useCartDrawer } from '@/contexts/CartDrawerContext';
import UnifiedCartPanel from '@/components/UnifiedCartPanel';

export default function UnifiedCartPanelRoot() {
  const { cartOpen, closeCart } = useCartDrawer();
  return <UnifiedCartPanel open={cartOpen} onClose={closeCart} />;
}
