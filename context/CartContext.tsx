// @ts-nocheck
import React, { createContext, useContext, useState } from 'react';

// 1. Context banaiye
const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Yahan variable ka naam 'cartItems' rakha hai taaki CartScreen ise pehchan sake
  const [cartItems, setCartItems] = useState<any[]>([]); 

  // Service ko cart mein add karne ke liye
  const addToCart = (service: any) => {
    setCartItems((prevItems) => {
      // Duplicate check: Agar service pehle se hai toh dobara add na karein
      const exists = prevItems.find(item => item.id === service.id);
      if (exists) return prevItems;
      return [...prevItems, service];
    });
    console.log("Service added to Context:", service.name);
  };

  // Cart se item hatane ke liye
  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  // Cart khali karne ke liye
  const clearCart = () => setCartItems([]);

  return (
    // Value mein 'cartItems' hi pass karein
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 2. Custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    console.error("useCart must be used within a CartProvider");
    return { cartItems: [], addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {} };
  }
  return context;
};