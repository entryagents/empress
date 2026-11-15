"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, Store, ShoppingBag, Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, products } from "@/data/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/config/site";

export default function OrderPage() {
  const { items, orderMode, setOrderMode, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="min-h-[80vh] bg-ivory-50 pb-24 pt-36 text-wine-900">
        <div className="container-x max-w-xl text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </div>
          <p className="eyebrow mt-6 text-champagne-500">Order Placed (Demonstration)</p>
          <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-wine-950">
            Thank you, {formData.name || "Customer"}!
          </h1>
          <p className="mt-4 text-base leading-relaxed text-wine-800/80">
            Your demonstration order for <strong>{orderMode}</strong> has been logged. In Phase 2, this connects directly to Bach&apos;s Payment API and live order fulfillment.
          </p>

          <div className="mt-8 rounded-[2px] border border-wine-900/10 bg-white p-6 text-left shadow-soft">
            <h3 className="font-serif text-lg font-medium text-wine-950">Order Summary</h3>
            <p className="text-xs text-wine-700">Fulfillment: <span className="uppercase font-semibold">{orderMode}</span></p>
            {formData.phone && <p className="text-xs text-wine-700">Phone: {formData.phone}</p>}
            {orderMode === "delivery" && formData.address && (
              <p className="text-xs text-wine-700">Delivery Address: {formData.address}</p>
            )}
            <ul className="mt-4 divide-y divide-wine-900/10 border-t border-wine-900/10 pt-3">
              {items.map((i) => (
                <li key={i.product.slug} className="flex justify-between py-2 text-sm">
                  <span>{i.quantity}x {i.product.name}</span>
                  <span className="font-serif">{formatPrice(i.product.price)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="gold"
              size="md"
              onClick={() => {
                clearCart();
                setSubmitted(false);
              }}
            >
              Start New Order
            </Button>
            <ButtonLink href={ROUTES.home} variant="outline" size="md">
              Return Home
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[85vh] bg-ivory-50 pb-24 pt-36 text-wine-900">
      <div className="container-x max-w-5xl">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 border-b border-wine-900/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-champagne-500">Order Online</p>
            <h1 className="mt-2 font-serif text-(length:--text-h2) leading-none tracking-tight text-wine-950">
              Your Order Bag
            </h1>
          </div>

          {/* Delivery / Pickup toggle */}
          <div className="inline-flex rounded border border-wine-900/15 bg-white p-1">
            <button
              type="button"
              onClick={() => setOrderMode("delivery")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                orderMode === "delivery"
                  ? "bg-wine-900 text-ivory-50 shadow-xs"
                  : "text-wine-800 hover:text-wine-950"
              }`}
            >
              <Bike className="size-4" /> Delivery
            </button>
            <button
              type="button"
              onClick={() => setOrderMode("pickup")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                orderMode === "pickup"
                  ? "bg-wine-900 text-ivory-50 shadow-xs"
                  : "text-wine-800 hover:text-wine-950"
              }`}
            >
              <Store className="size-4" /> Pickup
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-14 rounded-[2px] border border-wine-900/10 bg-white p-12 text-center shadow-soft">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-ivory-200 text-wine-700">
              <ShoppingBag className="size-8" strokeWidth={1.3} />
            </div>
            <h2 className="mt-4 font-serif text-3xl font-light text-wine-950">
              No items in your bag yet
            </h2>
            <p className="mt-2 max-w-md mx-auto text-sm text-wine-800/80">
              Select dishes below from our initial menu to add them to your order bag.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {products.slice(0, 6).map((p) => (
                <div
                  key={p.slug}
                  className="flex items-center justify-between gap-3 rounded border border-wine-900/10 p-3 hover:border-wine-900/30"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-medium truncate text-wine-950">{p.name}</p>
                    <p className="text-xs text-wine-700 italic">{formatPrice(p.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItem(p)}
                    className="shrink-0 rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            {/* Items Column */}
            <div className="lg:col-span-7">
              <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between border-b border-wine-900/10 pb-4">
                  <h2 className="font-serif text-xl font-medium text-wine-950">
                    Selected Dishes ({items.reduce((s, i) => s + i.quantity, 0)})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-wine-700 hover:text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="divide-y divide-wine-900/10">
                  {items.map(({ product, quantity }) => (
                    <li key={product.slug} className="flex gap-4 py-5">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded bg-wine-950">
                        <FoodImage name={product.image} sizes="80px" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif text-lg font-medium text-wine-950">
                              {product.name}
                            </h3>
                            <p className="text-xs text-wine-700 italic">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(product.slug)}
                            aria-label={`Remove ${product.name}`}
                            className="text-wine-600 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded border border-wine-900/20 bg-ivory-50 px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.slug, -1)}
                              aria-label="Decrease quantity"
                              className="text-wine-800 hover:text-wine-950"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.slug, 1)}
                              aria-label="Increase quantity"
                              className="text-wine-800 hover:text-wine-950"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          <span className="text-xs font-semibold text-wine-950">
                            {product.price.amount
                              ? new Intl.NumberFormat("en-NG", {
                                  style: "currency",
                                  currency: product.price.currency,
                                  maximumFractionDigits: 0,
                                }).format(product.price.amount * quantity)
                              : "To be confirmed"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Customer Details & Checkout Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSubmit}
                className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft"
              >
                <h2 className="font-serif text-xl font-medium text-wine-950">
                  {orderMode === "delivery" ? "Delivery Details" : "Pickup Information"}
                </h2>
                <p className="mt-1 text-xs text-wine-700">
                  Phase 1 demonstration ordering workflow.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amina Bello"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50 px-3.5 py-2.5 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +234 800 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50 px-3.5 py-2.5 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                    />
                  </div>

                  {orderMode === "delivery" && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Street, building/apt, area (e.g. Adeola Odeku St, Victoria Island)"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50 px-3.5 py-2.5 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                      Special Kitchen Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Extra pepper, no onions, cutlery needed"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50 px-3.5 py-2.5 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8 border-t border-wine-900/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-wine-800">Fulfillment</span>
                    <span className="font-semibold uppercase tracking-wider text-wine-950">
                      {orderMode}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-wine-800">Total Items</span>
                    <span className="font-medium text-wine-950">
                      {items.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-wine-900/10 pt-3">
                    <span className="font-serif text-lg font-medium text-wine-950">
                      Estimated Total
                    </span>
                    <span className="font-serif text-xl font-semibold text-wine-950">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        maximumFractionDigits: 0,
                      }).format(items.reduce((sum, i) => sum + (i.product.price.amount || 0) * i.quantity, 0))}
                    </span>
                  </div>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  type="submit"
                  className="mt-6 w-full"
                >
                  Confirm &amp; Place Order ({orderMode})
                </Button>
                <p className="mt-3 text-center text-[0.7rem] text-wine-700/80">
                  Pre-launch demo flow · Real payment integration in Phase 2
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
