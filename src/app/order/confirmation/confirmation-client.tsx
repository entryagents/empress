"use client";

import { useEffect, useState, useTransition } from "react";
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
  CreditCard,
  RefreshCw,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { lookupOrderAction } from "../actions";
import {
  initializeBachsPaymentAction,
  checkOrderPaymentStatusAction,
} from "../payment-actions";
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
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Manual lookup state if query params absent or unverified
  const [inputRef, setInputRef] = useState(refFromQuery);
  const [inputPhoneOrToken, setInputPhoneOrToken] = useState(tokenFromQuery);

  const fetchOrder = async (ref: string, token: string) => {
    try {
      const res = await lookupOrderAction(ref, token);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setErrorMsg(res.error || "Order not found with provided credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retrieve order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!refFromQuery) {
      setLoading(false);
      return;
    }

    fetchOrder(refFromQuery, tokenFromQuery);
  }, [refFromQuery, tokenFromQuery]);

  // Periodic polling if payment is still pending (stops automatically when paid or failed)
  useEffect(() => {
    if (!order || order.payment_status === "paid" || order.payment_status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      const res = await checkOrderPaymentStatusAction(
        order.order_reference,
        order.secure_access_token
      );
      if (res.success && res.payment) {
        if (res.payment.paymentStatus !== order.payment_status) {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  payment_status: res.payment.paymentStatus,
                  payment_completed_at: res.payment.completedAt,
                }
              : prev
          );
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.payment_status, order?.order_reference, order?.secure_access_token]);

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

  const handleRefreshPaymentStatus = async () => {
    if (!order) return;
    setIsCheckingPayment(true);
    try {
      const res = await checkOrderPaymentStatusAction(
        order.order_reference,
        order.secure_access_token
      );
      if (res.success && res.payment) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                payment_status: res.payment.paymentStatus,
                payment_completed_at: res.payment.completedAt,
              }
            : prev
        );
      }
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setIsRetryingPayment(true);
    setRetryError(null);
    try {
      const res = await initializeBachsPaymentAction(
        order.order_reference,
        order.secure_access_token,
        window.location.origin
      );
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setRetryError(res.error || "Failed to generate payment session.");
      }
    } catch (err: any) {
      setRetryError(err.message || "Unable to reach payment service.");
    } finally {
      setIsRetryingPayment(false);
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

  const isPaid = order.payment_status === "paid";
  const isFailed = order.payment_status === "failed" || order.payment_status === "expired";
  const isPending = order.payment_status === "pending" || order.payment_status === "unpaid";
  const isUnderpaid = order.payment_status === "underpaid";

  return (
    <section className="min-h-[90vh] bg-ivory-100/60 pb-28 pt-36 text-wine-950 font-sans">
      <div className="container-x max-w-4xl">
        {/* Banner State Depending on Payment */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft text-center">
          {isPaid ? (
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>
          ) : isFailed ? (
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-rose-100 text-rose-700">
              <XCircle className="size-8" />
            </div>
          ) : (
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="size-8 animate-pulse" />
            </div>
          )}

          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-champagne-600">
            {isPaid
              ? "Payment Verified & Order Confirmed"
              : isFailed
              ? "Payment Unsuccessful"
              : "Order Reserved · Awaiting Payment"}
          </p>

          <h1 className="mt-1 font-serif text-3xl font-light tracking-tight text-wine-950 sm:text-4xl">
            {isPaid
              ? `Thank you, ${order.customer_name}!`
              : isFailed
              ? "Payment Session Incomplete"
              : "Payment Pending Confirmation"}
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-wine-900/15 bg-ivory-50 px-4 py-1 text-xs text-wine-900">
            <span>Reference:</span>
            <strong className="font-mono text-wine-950">{order.order_reference}</strong>
          </div>

          <p className="mt-4 text-sm text-wine-800/80 max-w-xl mx-auto leading-relaxed">
            {isPaid
              ? "Your payment has been authoritatively verified via Bachs. Your order has entered the culinary kitchen queue."
              : isFailed
              ? "The payment session was either expired, declined, or cancelled. You can retry payment below."
              : "We are awaiting the authoritative payment confirmation from Bachs. This screen will update automatically as soon as your transaction clears."}
          </p>

          {/* Payment Status Bar with Refresh & Action */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded border px-4 py-2 text-xs ${
                isPaid
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : isFailed
                  ? "border-rose-300 bg-rose-50 text-rose-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}
            >
              <ShieldCheck className="size-4 shrink-0 text-wine-900" />
              <span>
                <strong>Payment Status:</strong>{" "}
                <span className="font-semibold uppercase">{order.payment_status}</span>
                {order.payment_completed_at && (
                  <span className="ml-1 text-[0.7rem] opacity-75">
                    ({new Date(order.payment_completed_at).toLocaleTimeString()})
                  </span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefreshPaymentStatus}
              disabled={isCheckingPayment}
              className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-white px-3 py-2 text-xs font-semibold text-wine-900 hover:bg-ivory-50 transition-colors shadow-2xs"
            >
              <RefreshCw
                className={`size-3.5 ${isCheckingPayment ? "animate-spin text-champagne-600" : ""}`}
              />
              Check Status
            </button>
          </div>

          {/* Retry Payment Option for Pending/Failed/Underpaid */}
          {!isPaid && (
            <div className="mt-6 max-w-md mx-auto border-t border-wine-900/10 pt-6">
              {retryError && (
                <div className="mb-3 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800 text-left">
                  {retryError}
                </div>
              )}
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={isRetryingPayment}
                className="w-full flex items-center justify-center gap-2 rounded bg-wine-900 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-md transition-all hover:bg-wine-800 disabled:opacity-50"
              >
                <CreditCard className="size-4 text-champagne-400" />
                {isRetryingPayment
                  ? "Connecting to Bachs..."
                  : `Complete Payment (${formatKobo(order.total_kobo)})`}
              </button>
              <p className="mt-2 text-[0.68rem] text-wine-700/80">
                You will be redirected to the secure Bachs hosted payment page.
              </p>
            </div>
          )}
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

              {order.fulfillment_type === "delivery" && (
                <div className="pt-2">
                  <a
                    href={`/order/track?ref=${order.order_reference}&token=${order.secure_access_token}`}
                    className="flex w-full items-center justify-center gap-2 rounded bg-wine-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors"
                  >
                    <span>Track Live Delivery GPS</span>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  </a>
                </div>
              )}

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
                    <p className="text-wine-600 text-[0.7rem] bg-ivory-50 p-2 rounded border border-wine-900/10">
                      Rider note: {order.delivery_instructions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t border-wine-900/10 pt-3 space-y-1.5">
                  <p className="font-semibold text-wine-950">Pick-up Location:</p>
                  <p className="text-wine-800">{order.pickup_location || "Empress Kitchen, Victoria Island, Lagos"}</p>
                  {order.pickup_instructions && (
                    <p className="text-wine-600 text-[0.7rem] bg-ivory-50 p-2 rounded border border-wine-900/10">
                      Collection note: {order.pickup_instructions}
                    </p>
                  )}
                </div>
              )}

              {order.special_instructions && (
                <div className="border-t border-wine-900/10 pt-3">
                  <p className="font-semibold text-wine-950">Chef Preparation Instructions:</p>
                  <p className="text-wine-700 italic mt-0.5">{order.special_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Item Summary */}
          <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft space-y-5">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Item Summary &amp; Total
            </h2>

            {/* Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-b border-wine-900/5 pb-2">
                  <div className="flex-1">
                    <p className="font-medium text-wine-950">
                      <span className="font-bold text-champagne-600">{item.quantity}x</span> {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-[0.68rem] text-wine-600">Option: {item.variant_name}</p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[0.68rem] text-wine-600">
                        Add-ons: {item.addons.map((a) => a.addon_name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="font-serif font-medium text-wine-950">
                    {formatKobo(item.total_price_kobo)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 border-t border-wine-900/10 pt-3 text-xs">
              <div className="flex justify-between text-wine-700">
                <span>Subtotal</span>
                <span className="font-serif text-wine-950">{formatKobo(order.subtotal_kobo)}</span>
              </div>
              <div className="flex justify-between text-wine-700">
                <span>Fulfilment Fee</span>
                <span className="font-serif text-wine-950">
                  {order.delivery_fee_kobo > 0 ? formatKobo(order.delivery_fee_kobo) : "Free"}
                </span>
              </div>
              {order.discount_kobo > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Privilege Discount ({order.coupon_code})</span>
                  <span className="font-serif">-{formatKobo(order.discount_kobo)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-wine-900/10 pt-2 text-sm font-semibold">
                <span className="text-wine-950">Total Amount</span>
                <span className="font-serif text-lg text-wine-950">{formatKobo(order.total_kobo)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-wine-900/10 pt-6">
          <Link
            href="/menu"
            className="text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
          >
            ← Explore More Delicacies
          </Link>
          <Link
            href="/account/orders"
            className="text-xs font-semibold uppercase tracking-wider text-champagne-600 hover:text-champagne-500 transition-colors"
          >
            View All Account Orders →
          </Link>
        </div>
      </div>
    </section>
  );
}
