"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  ExternalLink,
  Bike,
  Store,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";
import type { Order } from "@/types/order";
import { formatKobo } from "@/types/catalogue";
import { claimOrderAction } from "../../auth/actions";

interface Props {
  initialOrders: Order[];
  userEmail: string;
}

export function CustomerOrdersClient({ initialOrders, userEmail }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimRef, setClaimRef] = useState("");
  const [claimAuth, setClaimAuth] = useState("");
  const [claimMsg, setClaimMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimMsg(null);
    setIsClaiming(true);

    const formData = new FormData();
    formData.append("order_reference", claimRef);
    formData.append("verification_token_or_phone", claimAuth);

    try {
      const res = await claimOrderAction(formData);
      if (res.success) {
        setClaimMsg({ success: true, text: res.message });
        setClaimRef("");
        setClaimAuth("");
      } else {
        setClaimMsg({ success: false, text: res.message || "Failed to claim order." });
      }
    } catch (err: any) {
      setClaimMsg({ success: false, text: err.message });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-wine-950">
              Dining Order History
            </h2>
            <p className="mt-1 text-xs text-wine-800/80">
              Review previous orders, check reservation states, or associate previous guest orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClaimForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-ivory-50 px-3.5 py-1.5 text-xs font-semibold text-wine-900 hover:bg-wine-100/60 transition-colors"
          >
            <Plus className="size-3.5 text-champagne-600" />
            Claim Guest Order
          </button>
        </div>

        {/* Claim Guest Order Section */}
        {showClaimForm && (
          <form
            onSubmit={handleClaimOrder}
            className="mt-4 rounded bg-ivory-50/70 p-4 border border-wine-900/15 space-y-3"
          >
            <div>
              <h3 className="font-serif text-xs font-semibold uppercase tracking-wider text-wine-950">
                Link Previous Guest Order to Your Account
              </h3>
              <p className="text-[0.7rem] text-wine-700">
                If you previously placed an order as a guest using <strong>{userEmail}</strong>, enter the reference code and phone number below to permanently attach it.
              </p>
            </div>

            {claimMsg && (
              <p
                className={`text-xs ${
                  claimMsg.success ? "text-emerald-800 font-medium" : "text-rose-700"
                }`}
              >
                {claimMsg.text}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                value={claimRef}
                onChange={(e) => setClaimRef(e.target.value)}
                placeholder="Order Reference (e.g. EMP-20261116-8492)"
                className="rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs uppercase font-mono text-wine-950 focus:outline-none"
              />
              <input
                type="text"
                required
                value={claimAuth}
                onChange={(e) => setClaimAuth(e.target.value)}
                placeholder="Phone Number or Security Token"
                className="rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClaimForm(false)}
                className="text-xs text-wine-700 hover:text-wine-950"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isClaiming}
                className="rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
              >
                {isClaiming ? "Linking..." : "Link to Account"}
              </button>
            </div>
          </form>
        )}

        {/* Orders List */}
        <div className="mt-6 divide-y divide-wine-900/10">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-wine-700">
              <ShoppingBag className="mx-auto size-8 text-wine-300 mb-2" />
              You haven&apos;t placed any orders yet. Ready to experience Empress Delicacies?
              <div className="mt-4">
                <Link
                  href="/menu"
                  className="inline-flex rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors"
                >
                  Browse Menu
                </Link>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm text-wine-950">
                      {order.order_reference}
                    </span>
                    <span className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {order.status}
                    </span>
                  </div>

                  <p className="text-xs text-wine-800">
                    {order.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "Dining order"}
                  </p>

                  <div className="flex items-center gap-3 text-[0.7rem] text-wine-600">
                    <span className="flex items-center gap-1">
                      {order.fulfillment_type === "delivery" ? (
                        <>
                          <Bike className="size-3 text-champagne-600" /> Delivery ({order.delivery_area || "Lagos"})
                        </>
                      ) : (
                        <>
                          <Store className="size-3 text-champagne-600" /> Collection
                        </>
                      )}
                    </span>
                    <span>•</span>
                    <span>{new Date(order.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2">
                  <span className="font-serif font-bold text-base text-wine-950">
                    {formatKobo(order.total_kobo)}
                  </span>
                  <Link
                    href={`/order/confirmation?ref=${order.order_reference}&token=${order.secure_access_token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-champagne-700 hover:text-wine-950 hover:underline"
                  >
                    <span>View Receipt</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
