'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { t, getT } from '@/lib/i18n';
import Image from 'next/image';

export default function CartModal() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem, isLoading } = useCart();
  const { locale } = useLocale();
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const T = getT(locale);

  // Fetch our product records (with translations) whenever the cart opens
  useEffect(() => {
    if (!isCartOpen) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((products: any[]) => {
        const map: Record<string, any> = {};
        for (const p of products) {
          if (p.shopifyProductHandle) map[p.shopifyProductHandle] = p;
        }
        setProductMap(map);
      })
      .catch(() => {});
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const cartLines = cart?.lines.edges.map((edge) => edge.node) || [];
  const isEmpty = cartLines.length === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{T.cart.title}</h2>
          <button onClick={closeCart} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label={T.cart.close}>×</button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEmpty ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{T.cart.empty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartLines.map((line) => {
                const product = productMap[line.merchandise.product.handle];
                const title = product ? t(product, 'title', locale) : line.merchandise.product.title;
                return (
                  <div key={line.id} className="flex gap-4 border-b pb-4">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded">
                      {line.merchandise.image?.url && (
                        <Image src={line.merchandise.image.url} alt={line.merchandise.image.altText || title} fill className="object-cover rounded" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{title}</h3>
                      {line.merchandise.title !== 'Default Title' && (
                        <p className="text-sm text-gray-600">{line.merchandise.title}</p>
                      )}
                      <p className="text-sm font-medium mt-1">
                        ${parseFloat(line.merchandise.price.amount).toFixed(2)} {line.merchandise.price.currencyCode}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(line.id, Math.max(0, line.quantity - 1))} disabled={isLoading} className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50">−</button>
                        <span className="w-8 text-center">{line.quantity}</span>
                        <button onClick={() => updateQuantity(line.id, line.quantity + 1)} disabled={isLoading} className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50">+</button>
                        <button onClick={() => removeItem(line.id)} disabled={isLoading} className="ml-auto text-sm text-red-600 hover:text-red-800 disabled:opacity-50">{T.cart.remove}</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(line.cost.totalAmount.amount).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && cart && (
          <div className="border-t p-6 space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>{T.cart.subtotal}</span>
              <span>${parseFloat(cart.cost.subtotalAmount.amount).toFixed(2)} {cart.cost.subtotalAmount.currencyCode}</span>
            </div>
            <a href={cart.checkoutUrl} className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              {T.cart.checkout}
            </a>
            <p className="text-xs text-gray-500 text-center">{T.cart.taxNote}</p>
          </div>
        )}
      </div>
    </>
  );
}
