"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  Phone,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { lookupOrderAction } from "../actions";
import type { Order } from "@/types/order";
import { formatKobo } from "@/types/catalogue";
import { ROUTES } from "@/config/site";

export function OrderConfirmationClient() {
  const searchParams = useSearchParams();
  const refFromQuery = searchParams.get("ref") || "";
  const tokenFromQuery = searchParams.get("token") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual lookup state if query params absent or unverified
  const [inputRef, setInputRef] = useState(refFromQuery);
  const [inputPhoneOrToken, setInputPhoneOrToken] = useState(tokenFromQuery);

  useEffect(() => {
    if (!refFromQuery) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    lookupOrderAction(refFromQuery, tokenFromQuery).then((res) => {
      if (isMounted) {
        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setErrorMsg(res.error || "Order not found with provided credentials.");
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refFromQuery, tokenFromQuery]);

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await lookupOrderAction(inputRef, inputPhoneOrToken);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setErrorMsg(res.error || "Order details could not be verified.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to lookup order.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-[85vh] bg-ivory-100/60 pb-24 pt-36 text-center text-wine-950 font-sans">
        <div className="container-x max-w-xl">
          <div className="size-10 border-2 border-wine-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg">Retrieving your order reservation...</p>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="min-h-[85vh] bg-ivory-100/60 pb-24 pt-36 text-wine-950 font-sans">
        <div className="container-x max-w-lg">
          <div className="rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft text-center">
            <h1 className="font-serif text-2xl font-light text-wine-950">Look Up Your Order</h1>
            <p className="mt-2 text-xs text-wine-800/80">
              Enter your order reference code and phone number to retrieve your reservation details securely.
            </p>

            {errorMsg && (
              <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 text-left">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualLookup} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Order Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-20261116-8942"
                  value={inputRef}
                  onChange={(e) => setInputRef(e.target.value)}
                  className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm font-mono uppercase text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Phone Number or Access Token *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +234 803 123 4567"
                  value={inputPhoneOrToken}
                  onChange={(e) => setInputPhoneOrToken(e.target.value)}
                  className="mt-1.5 w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800 transition-colors shadow-xs"
              >
                <Search className="size-3.5" />
                Retrieve Order
              </button>
            </form>

            <div className="mt-6 border-t border-wine-900/10 pt-4">
              <Link href={ROUTES.home} className="text-xs text-wine-700 hover:text-wine-950 hover:underline">
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[90vh] bg-ivory-100/60 pb-28 pt-36 text-wine-950 font-sans">
      <div className="container-x max-w-4xl">
        {/* Success Banner */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-8" />
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-champagne-600">
            Order Submitted &amp; Reserved
          </p>

          <h1 className="mt-1 font-serif text-3xl font-light tracking-tight text-wine-950 sm:text-4xl">
            Thank you, {order.customer_name}!
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-wine-900/15 bg-ivory-50 px-4 py-1 text-xs text-wine-900">
            <span>Reference:</span>
            <strong className="font-mono text-wine-950">{order.order_reference}</strong>
          </div>

          <p className="mt-4 text-sm text-wine-800/80 max-w-xl mx-auto leading-relaxed">
            Your order has been recorded into the Empress Delicacies kitchen queue. Payment verification and live rider tracking will be integrated in upcoming phases.
          </p>

          {/* Payment Status Notice */}
          <div className="mt-6 inline-flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            <Clock className="size-4 shrink-0 text-amber-700" />
            <span>
              <strong>Status:</strong> Order {order.status.toUpperCase()} · Payment {order.payment_status.toUpperCase()} (Bachs payment integration connects in Phase 5).
            </span>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Customer & Fulfilment Details */}
          <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft space-y-5">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Fulfilment &amp; Contact
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-wine-700">Fulfilment Type</span>
                <span className="font-semibold uppercase tracking-wider text-wine-950">
                  {order.fulfillment_type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-wine-700">Customer Phone</span>
                <span className="font-medium text-wine-950">{order.customer_phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-wine-700">Receipt Email</span>
                <span className="font-medium text-wine-950">{order.customer_email}</span>
              </div>

              {order.fulfillment_type === "delivery" ? (
                <div className="border-t border-wine-900/10 pt-3 space-y-1.5">
                  <p className="font-semibold text-wine-950">Delivery Address:</p>
                  <p className="text-wine-800">
                    {order.delivery_building_number ? `${order.delivery_building_number}, ` : ""}
                    {order.delivery_street_address}
                  </p>
                  <p className="text-wine-700">
                    Area: <strong>{order.delivery_area}</strong>, {order.delivery_city}, {order.delivery_state}
                  </p>
                  {order.delivery_landmark && (
                    <p className="text-wine-700 italic">
                      Landmark: &ldquo;{order.delivery_landmark}&rdquo;
                    </p>
                  )}
                  {order.delivery_instructions && (
                    <p className="text-wine-700">
                      Rider note: {order.delivery_instructions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t border-wine-900/10 pt-3 space-y-1.5">
                  <p className="font-semibold text-wine-950">Collection Location:</p>
                  <p className="text-wine-800">{order.pickup_location}</p>
                  {order.pickup_instructions && (
                    <p className="text-wine-700 italic">
                      Pickup note: &ldquo;{order.pickup_instructions}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {order.special_instructions && (
                <div className="border-t border-wine-900/10 pt-3">
                  <p className="font-semibold text-wine-950">Kitchen Notes:</p>
                  <p className="text-wine-700 italic">&ldquo;{order.special_instructions}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Snapshot & Financials */}
          <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Item Snapshots &amp; Total
            </h2>

            <ul className="divide-y divide-wine-900/10 max-h-72 overflow-y-auto pr-1">
              {order.items?.map((item) => (
                <li key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-wine-950">
                      {item.quantity}x {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-[0.68rem] text-wine-600">Portion: {item.variant_name}</p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[0.68rem] text-champagne-700">
                        Extras: {item.addons.map((a) => a.addon_name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="font-serif font-semibold text-wine-950">
                    {formatKobo(item.total_price_kobo)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-wine-900/10 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-wine-700">
                <span>Subtotal</span>
                <span>{formatKobo(order.subtotal_kobo)}</span>
              </div>
              <div className="flex justify-between text-wine-700">
                <span>Fulfilment ({order.fulfillment_type})</span>
                <span>{order.delivery_fee_kobo > 0 ? formatKobo(order.delivery_fee_kobo) : "Free"}</span>
              </div>
              {order.discount_kobo > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Privilege Discount ({order.coupon_code || "Special"})</span>
                  <span>-{formatKobo(order.discount_kobo)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-wine-900/10 pt-2 font-serif text-base font-bold text-wine-950">
                <span>Total Due</span>
                <span>{formatKobo(order.total_kobo)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/menu"
            className="rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800 transition-colors shadow-xs"
          >
            Order Additional Dishes
          </Link>
          <Link
            href={ROUTES.home}
            className="rounded border border-wine-900/20 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-wine-900 hover:bg-ivory-100 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
