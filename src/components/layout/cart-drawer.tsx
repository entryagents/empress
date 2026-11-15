"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X, Plus, Minus, Trash2, ShoppingBag, Bike, Store, ArrowRight, Utensils } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatKobo } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/config/site";
import type { ImageKey } from "@/config/images";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    orderMode,
    setOrderMode,
    totalCount,
    totalAmountKobo,
  } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 bg-wine-950/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer content */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-ivory-50 text-wine-900 shadow-lift"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-wine-900/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="size-5 text-wine-700" strokeWidth={1.8} />
                <h2 className="font-serif text-2xl font-medium tracking-tight text-wine-950">
                  Your Order Bag
                </h2>
                <span className="rounded-full bg-champagne-400/30 px-2.5 py-0.5 text-xs font-semibold text-wine-900">
                  {totalCount} {totalCount === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid size-9 place-items-center rounded-full text-wine-800 transition-colors hover:bg-wine-900/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Delivery / Pickup toggle */}
            <div className="border-b border-wine-900/10 bg-ivory-100 p-4">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-ivory-200/60 p-1">
                <button
                  type="button"
                  onClick={() => setOrderMode("delivery")}
                  className={`flex items-center justify-center gap-2 rounded py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    orderMode === "delivery"
                      ? "bg-wine-900 text-ivory-50 shadow-xs"
                      : "text-wine-800 hover:text-wine-950"
                  }`}
                >
                  <Bike className="size-3.5" /> Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMode("pickup")}
                  className={`flex items-center justify-center gap-2 rounded py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    orderMode === "pickup"
                      ? "bg-wine-900 text-ivory-50 shadow-xs"
                      : "text-wine-800 hover:text-wine-950"
                  }`}
                >
                  <Store className="size-3.5" /> Pickup
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-wine-800/70">
                {orderMode === "delivery"
                  ? "Delivered hot and fresh directly to your door."
                  : "Prepared fresh and packaged ready for customer collection."}
              </p>
            </div>

            {/* Body: Items or Empty state */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="grid size-16 place-items-center rounded-full bg-ivory-200 text-wine-700">
                    <ShoppingBag className="size-8" strokeWidth={1.3} />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-light text-wine-950">
                    Your bag is empty
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-wine-800/70">
                    Explore our catalogue of handcrafted shawarma, small chops, grills and specialties.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
                    <ButtonLink
                      href="/menu"
                      variant="primary"
                      size="md"
                      onClick={closeCart}
                    >
                      <Utensils className="size-4" /> Browse Full Menu
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-wine-900/10">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded bg-wine-950">
                        <FoodImage
                          name={(item.product.slug || "shawarma") as ImageKey}
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/menu/${item.product.slug}`}
                              onClick={closeCart}
                              className="font-serif text-base font-medium leading-tight text-wine-950 hover:underline truncate block"
                            >
                              {item.product.name}
                            </Link>

                            {/* Variant info */}
                            {item.variant && (
                              <p className="mt-0.5 text-xs text-wine-700 font-medium">
                                Option: {item.variant.name}
                              </p>
                            )}

                            {/* Add-ons list */}
                            {item.addons && item.addons.length > 0 && (
                              <p className="mt-0.5 text-[0.7rem] text-wine-800/70 truncate">
                                + {item.addons.map((a) => a.name).join(", ")}
                              </p>
                            )}

                            {/* Special instructions */}
                            {item.specialInstructions && (
                              <p className="mt-0.5 text-[0.7rem] text-wine-800/60 italic truncate">
                                Note: &ldquo;{item.specialInstructions}&rdquo;
                              </p>
                            )}

                            <p className="mt-1 font-serif text-sm font-semibold text-wine-900">
                              {formatKobo(item.unitPriceKobo * item.quantity)}
                              {item.quantity > 1 && (
                                <span className="ml-1 text-[0.7rem] text-wine-700 font-normal">
                                  ({formatKobo(item.unitPriceKobo)} each)
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.product.name}`}
                            className="text-wine-600 transition-colors hover:text-red-600 shrink-0 p-1"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded border border-wine-900/20 bg-white px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="text-wine-800 hover:text-wine-950"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="text-wine-800 hover:text-wine-950"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          <span className="text-[0.65rem] text-wine-700/80 uppercase tracking-widest">
                            Fresh to order
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="border-t border-wine-900/10 bg-ivory-100 p-6">
                <div className="mb-3 flex items-center justify-between text-xs text-wine-800/70">
                  <span>Selected Fulfillment:</span>
                  <span className="font-semibold uppercase tracking-wider text-wine-950">
                    {orderMode}
                  </span>
                </div>
                <div className="mb-5 flex items-baseline justify-between border-t border-wine-900/10 pt-3">
                  <div>
                    <span className="font-serif text-lg font-medium text-wine-950">Subtotal</span>
                    <p className="text-[0.7rem] text-wine-700">
                      Taxes &amp; delivery calculated at checkout
                    </p>
                  </div>
                  <span className="font-serif text-xl font-bold text-wine-950">
                    {formatKobo(totalAmountKobo)}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <ButtonLink
                    href={ROUTES.order}
                    variant="gold"
                    size="lg"
                    className="w-full justify-between"
                    onClick={closeCart}
                  >
                    <span>Proceed to Checkout ({orderMode})</span>
                    <ArrowRight className="size-4" />
                  </ButtonLink>
                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href="/menu"
                      onClick={closeCart}
                      className="text-xs text-wine-800 font-medium hover:underline"
                    >
                      + Add more items from menu
                    </Link>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-wine-700/80 transition-colors hover:text-red-700 hover:underline"
                    >
                      Clear bag
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
