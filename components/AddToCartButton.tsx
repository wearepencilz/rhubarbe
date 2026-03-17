'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  variantId: string;
  availability: 'in_stock' | 'preorder' | 'sold_out';
  disabled?: boolean;
}

export default function AddToCartButton({ variantId, availability, disabled }: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(variantId, 1);
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
  );
}
