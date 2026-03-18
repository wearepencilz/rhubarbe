'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  variantId: string;
  availability: 'in_stock' | 'preorder' | 'sold_out';
  disabled?: boolean;
  showQuantity?: boolean;
}

export default function AddToCartButton({ variantId, availability, disabled, showQuantity = false }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(variantId, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const isSoldOut = availability === 'sold_out';
  const isDisabled = disabled || isSoldOut || isLoading || isAdding;

  return (
    <div className="space-y-3">
      {showQuantity && !isSoldOut && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors text-lg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
          isSoldOut
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : availability === 'preorder'
            ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            : 'bg-black hover:bg-gray-800 text-white disabled:opacity-50'
        }`}
      >
        {isAdding
          ? 'Adding...'
          : isSoldOut
          ? 'Sold Out'
          : availability === 'preorder'
          ? 'Pre-order Now'
          : 'Add to Cart'}
      </button>
    </div>
  );
}
