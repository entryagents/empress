"use client";

import { MotionConfig } from "motion/react";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/layout/cart-drawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </MotionConfig>
  );
}
