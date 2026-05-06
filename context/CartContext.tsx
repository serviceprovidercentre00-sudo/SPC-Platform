// @ts-nocheck
import React, { createContext, useContext, useState } from "react";

const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<any[]>([]);

  const safeParsePrice = (val: any) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    const cleaned = String(val)
      .replace(/,/g, "")
      .replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Naya calculation logic
  const calculateBill = (
    items: any[],
    includeServiceCharge = true,
    baseServicePrice = 0,
  ) => {
    const partsTotal = items.reduce(
      (sum, item) => sum + safeParsePrice(item.price),
      0,
    );
    const serviceTotal = includeServiceCharge
      ? safeParsePrice(baseServicePrice)
      : 0;

    const subTotal = partsTotal + serviceTotal;

    // Fees calculation
    const platformFee = subTotal > 0 ? 20 : 0; // Fixed Fee
    const taxAmount = Math.round(subTotal * 0.1); // 10% Professional Tax
    const grandTotal = subTotal + platformFee + taxAmount;

    return {
      partsTotal,
      serviceTotal,
      subTotal,
      platformFee,
      taxAmount,
      grandTotal,
    };
  };

  const addToCart = (service: any) => {
    setCartItems((prevItems) => {
      const exists = prevItems.find((item) => item.id === service.id);
      if (exists) return prevItems;
      return [
        ...prevItems,
        { ...service, price: safeParsePrice(service.price) },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        safeParsePrice,
        calculateBill,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context)
    return { cartItems: [], addToCart: () => {}, calculateBill: () => ({}) };
  return context;
};
