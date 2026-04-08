import React, { createContext, useContext, useState } from 'react';

// 1. Context banaiye
const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]); // 'cartItems' ko 'cart' kar diya taaki confusion na ho

  // Service ko cart mein add karne ke liye
  const addToCart = (service: any) => {
    setCart((prevItems) => [...prevItems, service]);
    console.log("Service added:", service.name);
  };

  // Cart se item hatane ke liye
  const removeFromCart = (id: string) => {
    setCart((prevItems) => prevItems.filter(item => item.id !== id));
  };

  // Cart khali karne ke liye
  const clearCart = () => setCart([]);

  return (
    // Yahan humne 'cart' aur 'addToCart' dono ko pass kiya hai
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 2. Custom hook (isase error check bhi ho jayega)
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    // Agar Provider nahi mila toh ye message dikhega crash hone ki jagah
    console.error("useCart must be used within a CartProvider");
    return { cart: [], addToCart: () => {}, removeFromCart: () => {}, clearCart: () => {} };
  }
  return context;
};