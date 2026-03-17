'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, createCart, addToCart as addToCartAPI, updateCartLine, removeFromCart, getCart } from '@/lib/shopify/cart';

interface CartContextType {
  cart: Cart | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_ID_KEY = 'shopify_cart_id';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      const cartId = localStorage.getItem(CART_ID_KEY);
      if (cartId) {
        try {
          const existingCart = await getCart(cartId);
          setCart(existingCart);
        } catch (error) {
          console.error('Failed to load cart:', error);
          localStorage.removeItem(CART_ID_KEY);
        }
      }
    };
    loadCart();
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (variantId: string, quantity: number) => {
    setIsLoading(true);
    try {
      let currentCart = cart;

      // Create cart if it doesn't exist
      if (!currentCart) {
        currentCart = await createCart();
        localStorage.setItem(CART_ID_KEY, currentCart.id);
      }

      // Add item to cart
      const updatedCart = await addToCartAPI(currentCart.id, [
        { merchandiseId: variantId, quantity },
      ]);

      setCart(updatedCart);
      openCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const updatedCart = await updateCartLine(cart.id, lineId, quantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineId: string) => {
    if (!cart) return;

    setIsLoading(true);
    try {
      const updatedCart = await removeFromCart(cart.id, [lineId]);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeItem,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
