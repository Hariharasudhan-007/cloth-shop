import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'tl_shopping_cart_v1';
const FREE_SHIPPING_THRESHOLD = 100.0;
const STANDARD_SHIPPING_FEE = 10.0;

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product || product.stock <= 0) {
      showToast(`Sorry, "${product?.name || 'this item'}" is currently out of stock.`, 'error');
      return false;
    }

    let addedSuccessfully = true;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product_id === product.id);

      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          showToast(
            `Cannot add more. You have ${existingItem.quantity} in your cart, and only ${product.stock} remain in stock.`,
            'error'
          );
          addedSuccessfully = false;
          return prevCart;
        }

        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          stock: product.stock // refresh stock snapshot
        };
        return updatedCart;
      } else {
        if (quantity > product.stock) {
          showToast(`Only ${product.stock} units available in stock.`, 'error');
          addedSuccessfully = false;
          return prevCart;
        }

        return [
          ...prevCart,
          {
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image_url: product.image_url,
            category_name: product.category_name,
            stock: product.stock,
            quantity
          }
        ];
      }
    });

    if (addedSuccessfully) {
      showToast(`Added "${product.name}" to your cart.`, 'success');
      setIsCartOpen(true);
    }

    return addedSuccessfully;
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product_id === productId) {
          if (newQuantity > item.stock) {
            showToast(`Only ${item.stock} units available in stock.`, 'error');
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product_id === productId);
      if (item) {
        showToast(`Removed "${item.name}" from cart.`, 'info');
      }
      return prevCart.filter((i) => i.product_id !== productId);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const cartTotal = cartSubtotal + shippingFee;
  const freeShippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartCount,
        cartSubtotal,
        shippingFee,
        cartTotal,
        freeShippingProgress,
        freeShippingRemaining,
        FREE_SHIPPING_THRESHOLD
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
