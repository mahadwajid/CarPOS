import React, { createContext, useContext, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [taxRate, setTaxRate] = useState(0); // fetched from settings later
  const [customer, setCustomer] = useState(null); // { id, name }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} items left in stock`);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock < 1) {
        toast.error('Out of stock');
        return prev;
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        quantity: 1,
        itemDiscount: 0,
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (quantity > item.stock) {
          toast.error(`Only ${item.stock} items left in stock`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountType('fixed');
    setCustomer(null);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discount) / 100;
    }
    return discount;
  }, [subtotal, discount, discountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  const taxAmount = useMemo(() => {
    return (taxableAmount * taxRate) / 100;
  }, [taxableAmount, taxRate]);

  const total = useMemo(() => {
    return taxableAmount + taxAmount;
  }, [taxableAmount, taxAmount]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      discount,
      setDiscount,
      discountType,
      setDiscountType,
      taxRate,
      setTaxRate,
      customer,
      setCustomer,
      subtotal,
      discountAmount,
      taxAmount,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
