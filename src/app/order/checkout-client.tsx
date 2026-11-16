"use client";

import { useState, useEffect, useId, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  Store,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Tag,
  AlertCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Building,
  Navigation,
  Info,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatKobo } from "@/types/catalogue";
import type { DeliveryZone, CartItemInput, CustomerCheckoutInput, PricingSummary } from "@/types/order";
import { validateCartAction, submitCheckoutOrderAction, applyCouponAction } from "./actions";
import { DEFAULT_PICKUP_LOCATION } from "@/lib/order/config";

interface Props {
  deliveryZones: DeliveryZone[];
}

export function CheckoutClient({ deliveryZones }: Props) {
  const router = useRouter();
  const {
    items,
    orderMode,
    setOrderMode,
    updateQuantity,
    removeItem,
    clearCart,
    totalCount,
  } = useCart();

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kitchenNotes, setKitchenNotes] = useState("");

  // Nigerian Delivery State
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  // Pickup State
  const [pickupInstructions, setPickupInstructions] = useState("");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  // Server-calculated pricing
  const [pricing, setPricing] = useState<PricingSummary>({
    currency: "NGN",
    subtotalKobo: 0,
    deliveryFeeKobo: 0,
    discountKobo: 0,
    totalKobo: 0,
  });

  // Client idempotency key for this checkout attempt generated on client mount
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  }, []);

  // Transform cart context items to DTO
  const cartInputItems: CartItemInput[] = items.map((i) => ({
    productId: i.product.id || i.product.slug,
    variantId: i.variant?.id,
    addonIds: i.addons?.map((a) => a.id),
    quantity: i.quantity,
    specialInstructions: i.specialInstructions,
  }));

  // Server re-validation whenever cart items, fulfilment method, zone, or coupon changes
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    startTransition(async () => {
      const res = await validateCartAction(
        cartInputItems,
        orderMode,
        orderMode === "delivery" ? selectedZoneId : undefined,
        appliedCouponCode
      );

      if (isMounted) {
        if (res.success && res.result) {
          setPricing(res.result.pricing);
          setWarnings(res.result.warnings || []);
          if (!res.result.isValid) {
            setErrorMsg(res.result.errors.join(" "));
          } else {
            setErrorMsg(null);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [items, orderMode, selectedZoneId, appliedCouponCode]);

  const activeZone = deliveryZones.find((z) => z.id === selectedZoneId);

  // Handle Coupon Application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponFeedback(null);
    const res = await applyCouponAction(couponCode, pricing.subtotalKobo);
    if (res.success && res.isValid && res.coupon) {
      setAppliedCouponCode(res.coupon.code);
      setCouponFeedback({
        success: true,
        message: `Privilege code ${res.coupon.code} applied: save ${formatKobo(res.discountKobo)}!`,
      });
    } else {
      setCouponFeedback({
        success: false,
        message: res.reason || "Invalid privilege code.",
      });
      setAppliedCouponCode(undefined);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(undefined);
    setCouponCode("");
    setCouponFeedback(null);
  };

  // Handle Checkout Submission
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const checkoutData: CustomerCheckoutInput = {
      full_name: fullName,
      email,
      phone,
      fulfillment_type: orderMode,
      address:
        orderMode === "delivery"
          ? {
              state: activeZone?.state || "Lagos",
              city: activeZone?.city || "Lagos",
              area: area || activeZone?.name || "Lagos",
              street_address: streetAddress,
              building_number: buildingNumber || undefined,
              landmark: landmark || undefined,
              additional_instructions: deliveryInstructions || undefined,
            }
          : undefined,
      delivery_zone_id: orderMode === "delivery" ? selectedZoneId : undefined,
      pickup_instructions: orderMode === "pickup" ? pickupInstructions || undefined : undefined,
      special_instructions: kitchenNotes || undefined,
      coupon_code: appliedCouponCode,
      idempotency_key: idempotencyKey,
    };

    try {
      const res = await submitCheckoutOrderAction(cartInputItems, checkoutData);
      if (res.success && res.orderReference) {
        // Clear local cart
        clearCart();
        // Route to secure order confirmation page
        router.push(
          `/order/confirmation?ref=${res.orderReference}&token=${res.accessToken || ""}`
        );
      } else {
        setErrorMsg(res.error || "Unable to complete order creation. Please review your details.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[90vh] bg-ivory-100/60 pb-28 pt-36 text-wine-950 font-sans">
      <div className="container-x max-w-6xl">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Menu
        </Link>

        {/* Page Title & Fulfilment Switcher */}
        <div className="mt-4 flex flex-col justify-between gap-4 border-b border-wine-900/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-champagne-600">
              Seamless Ordering &amp; Delivery
            </p>
            <h1 className="mt-1 font-serif text-3xl font-light tracking-tight text-wine-950 sm:text-4xl">
              Checkout &amp; Order Bag
            </h1>
          </div>

          {/* Fulfilment Switcher */}
          <div className="inline-flex rounded border border-wine-900/15 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setOrderMode("delivery")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                orderMode === "delivery"
                  ? "bg-wine-900 text-ivory-50 shadow-xs"
                  : "text-wine-800 hover:text-wine-950"
              }`}
            >
              <Bike className="size-3.5 text-champagne-400" />
              Delivery
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
              <Store className="size-3.5 text-champagne-400" />
              Pickup
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-[2px] border border-wine-900/10 bg-white p-12 text-center shadow-soft">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-ivory-200 text-wine-800">
              <ShoppingBag className="size-8" strokeWidth={1.3} />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-light text-wine-950">
              Your bag is currently empty
            </h2>
            <p className="mt-2 text-sm text-wine-800/80">
              Select dishes from our freshly updated digital menu to begin your order.
            </p>
            <div className="mt-6">
              <Link
                href="/menu"
                className="inline-flex items-center rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800 transition-colors shadow-xs"
              >
                Explore Digital Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: Customer Information & Nigerian Address Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Notifications */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                >
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}

              <form id="checkout-form" onSubmit={handleSubmitCheckout} className="space-y-6">
                {/* 1. Customer Information */}
                <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                  <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                    1. Customer Information
                  </h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amina Bello"
                        className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. amina@example.ng"
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        />
                        <p className="mt-1 text-[0.65rem] text-wine-600">
                          Your order confirmation receipt will be sent here.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Nigerian Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +234 803 123 4567"
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        />
                        <p className="mt-1 text-[0.65rem] text-wine-600">
                          Used for rider dispatch coordination and collection alerts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Fulfilment: Nigerian Delivery Address OR Pickup Details */}
                {orderMode === "delivery" ? (
                  <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                    <div className="flex items-center justify-between border-b border-wine-900/10 pb-2">
                      <h2 className="font-serif text-lg font-medium text-wine-950 flex items-center gap-2">
                        <MapPin className="size-4 text-champagne-600" />
                        2. Nigerian Delivery Details
                      </h2>
                      <span className="text-xs font-mono text-champagne-700">
                        Fee: {formatKobo(activeZone?.fee_kobo || 0)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-4">
                      {/* Delivery Zone Selector */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Select Delivery Zone *
                        </label>
                        <select
                          required
                          value={selectedZoneId}
                          onChange={(e) => setSelectedZoneId(e.target.value)}
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        >
                          {deliveryZones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} — {formatKobo(z.fee_kobo)} ({z.estimated_minutes_min}–{z.estimated_minutes_max} mins)
                            </option>
                          ))}
                        </select>
                        {activeZone && (
                          <p className="mt-1.5 text-[0.7rem] text-wine-700">
                            <strong>Serviceable Areas:</strong> {activeZone.areas.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Area & Street Address */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                            Area / Neighbourhood *
                          </label>
                          <input
                            type="text"
                            required
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="e.g. Lekki Phase 1 / Oniru"
                            className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                            Building / House Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={buildingNumber}
                            onChange={(e) => setBuildingNumber(e.target.value)}
                            placeholder="e.g. Flat 4B, Plot 12"
                            className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="e.g. Admiralty Way, off Freedom Way"
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Prominent Landmark (Essential for Nigerian Dispatch)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Opposite Dominos Pizza, beside Zenith Bank ATM"
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        />
                        <p className="mt-1 text-[0.65rem] text-wine-600">
                          Helps the delivery rider identify your location immediately. Postcodes are not required.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                          Rider Delivery Instructions (Gate code, call upon arrival)
                        </label>
                        <input
                          type="text"
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          placeholder="e.g. Ring black security gate bell or call when at junction"
                          className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Pickup Card */
                  <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                    <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2 flex items-center gap-2">
                      <Store className="size-4 text-champagne-600" />
                      2. Customer Collection Studio
                    </h2>

                    <div className="mt-4 rounded bg-ivory-50 p-4 border border-wine-900/10 text-xs space-y-2">
                      <p className="font-serif text-sm font-semibold text-wine-950">
                        {DEFAULT_PICKUP_LOCATION.name}
                      </p>
                      <p className="text-wine-800 flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-champagne-600 shrink-0" />
                        {DEFAULT_PICKUP_LOCATION.address}
                      </p>
                      <p className="text-wine-700 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-champagne-600 shrink-0" />
                        Operating Hours: {DEFAULT_PICKUP_LOCATION.hours}
                      </p>
                      <p className="text-wine-700">
                        Direct Phone: <strong>{DEFAULT_PICKUP_LOCATION.phone}</strong>
                      </p>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                        Pickup Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={pickupInstructions}
                        onChange={(e) => setPickupInstructions(e.target.value)}
                        placeholder="e.g. Expected pickup at 6:30 PM, driver collecting on my behalf"
                        className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Kitchen & Special Instructions */}
                <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                  <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                    3. Special Kitchen Instructions
                  </h2>
                  <div className="mt-3">
                    <textarea
                      rows={2}
                      value={kitchenNotes}
                      onChange={(e) => setKitchenNotes(e.target.value)}
                      placeholder="e.g. Extra hot pepper sauce, packaging for long distance transit, allergy notes..."
                      className="w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Order Summary & Pricing Breakdown */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-28 rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between border-b border-wine-900/10 pb-3">
                  <h2 className="font-serif text-lg font-medium text-wine-950">
                    Order Summary ({totalCount})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[0.7rem] text-wine-600 hover:text-rose-600 hover:underline"
                  >
                    Clear Bag
                  </button>
                </div>

                {/* Items List */}
                <ul className="divide-y divide-wine-900/10 max-h-80 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const primaryImg =
                      item.product.images?.find((img) => img.is_primary)?.image_url ||
                      item.product.images?.[0]?.image_url ||
                      "/images/food/shawarma.jpg";

                    return (
                      <li key={item.id} className="py-3 flex gap-3 text-xs">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded bg-wine-950">
                          <Image src={primaryImg} alt={item.product.name} fill className="object-cover" sizes="56px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-serif font-semibold text-wine-950 truncate">
                              {item.product.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-wine-400 hover:text-rose-600"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                          {item.variant && (
                            <p className="text-[0.68rem] text-wine-600">Portion: {item.variant.name}</p>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-[0.68rem] text-champagne-700 truncate">
                              Extras: {item.addons.map((a) => a.name).join(", ")}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 rounded border border-wine-900/20 bg-ivory-50 px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="text-wine-800 hover:text-wine-950"
                              >
                                <Minus className="size-2.5" />
                              </button>
                              <span className="w-4 text-center font-semibold text-[0.68rem]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="text-wine-800 hover:text-wine-950"
                              >
                                <Plus className="size-2.5" />
                              </button>
                            </div>
                            <span className="font-serif font-semibold text-wine-950">
                              {formatKobo(item.unitPriceKobo * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Coupon Input Form */}
                <div className="mt-4 border-t border-wine-900/10 pt-4">
                  {appliedCouponCode ? (
                    <div className="flex items-center justify-between rounded bg-champagne-500/10 border border-champagne-500/30 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="size-3.5 text-champagne-600" />
                        <span className="font-mono font-semibold text-wine-950">{appliedCouponCode}</span>
                        <span className="text-[0.65rem] text-champagne-700">Applied</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[0.68rem] text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-wine-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Privilege Code (e.g. WELCOME10)"
                          className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-7 pr-2 py-1.5 text-xs text-wine-950 uppercase font-mono placeholder:normal-case placeholder:text-wine-400 focus:outline-none focus:border-champagne-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {couponFeedback && (
                    <p
                      className={`mt-1.5 text-[0.68rem] ${
                        couponFeedback.success ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {couponFeedback.message}
                    </p>
                  )}
                </div>

                {/* Pricing Summary (Server Recalculated) */}
                <div className="mt-4 border-t border-wine-900/10 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-wine-800">
                    <span>Subtotal</span>
                    <span className="font-serif font-medium text-wine-950">
                      {formatKobo(pricing.subtotalKobo)}
                    </span>
                  </div>

                  <div className="flex justify-between text-wine-800">
                    <span>Fulfilment ({orderMode})</span>
                    <span className="font-serif font-medium text-wine-950">
                      {orderMode === "delivery" ? formatKobo(pricing.deliveryFeeKobo) : "Free (Pickup)"}
                    </span>
                  </div>

                  {pricing.discountKobo > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Privilege Discount</span>
                      <span>-{formatKobo(pricing.discountKobo)}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-baseline justify-between border-t border-wine-900/10 pt-3 text-base">
                    <span className="font-serif font-semibold text-wine-950">Calculated Total</span>
                    <span className="font-serif text-xl font-bold text-wine-950">
                      {formatKobo(pricing.totalKobo)}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || items.length === 0}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-wine-900 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-md transition-all hover:bg-wine-800 disabled:opacity-50 active:scale-98"
                >
                  <ShieldCheck className="size-4 text-champagne-400" />
                  {isSubmitting ? "Securing Order..." : `Place Order (${formatKobo(pricing.totalKobo)})`}
                </button>

                <p className="mt-3 text-center text-[0.68rem] text-wine-700/80 leading-relaxed">
                  Phase 4 checkout foundation. Your order snapshot will be reserved, followed by payment integration in the subsequent phase.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
