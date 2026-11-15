"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Product, ProductVariant, ProductAddon } from "@/types/catalogue";
import { calculateItemPrice } from "@/types/catalogue";

export interface CartItem {
  id: string; // unique key combining product, variant and addons
  product: Product;
  variant?: ProductVariant;
  addons?: ProductAddon[];
  specialInstructions?: string;
  quantity: number;
  unitPriceKobo: number;
}

export interface AddItemOptions {
  variant?: ProductVariant;
  addons?: ProductAddon[];
  specialInstructions?: string;
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  orderMode: "delivery" | "pickup";
  setOrderMode: (mode: "delivery" | "pickup") => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmountKobo: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "empress_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [orderMode, setOrderMode] = useState<"delivery" | "pickup">("delivery");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage quota
    }
  }, [items]);

  const addItem = (product: Product, options?: AddItemOptions) => {
    const variant = options?.variant;
    const addons = options?.addons || [];
    const instructions = options?.specialInstructions?.trim() || "";
    const qty = options?.quantity && options.quantity > 0 ? options.quantity : 1;

    const addonKey = addons
      .map((a) => a.id)
      .sort()
      .join("_");
    const itemKey = `${product.id || product.slug}-${variant?.id || "base"}-${addonKey || "none"}-${instructions ? encodeURIComponent(instructions.slice(0, 20)) : "clean"}`;

    const unitPriceKobo = calculateItemPrice(product.base_price_kobo, variant, addons);

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemKey);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          variant,
          addons,
          specialInstructions: instructions || undefined,
          quantity: qty,
          unitPriceKobo,
        },
      ];
    });
    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId && i.product.slug !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId || item.product.slug === itemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountKobo = items.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        orderMode,
        setOrderMode,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmountKobo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
