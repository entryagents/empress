"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type { PaymentRecord, PaymentEventRecord } from "@/types/payment";
import { formatKobo } from "@/types/catalogue";

interface Props {
  initialPayments: PaymentRecord[];
  initialEvents: PaymentEventRecord[];
}

export function AdminPaymentsClient({ initialPayments, initialEvents }: Props) {
  const [payments] = useState<PaymentRecord[]>(initialPayments);
  const [events] = useState<PaymentEventRecord[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"payments" | "webhooks">("payments");

  const filteredPayments = payments.filter((p) => {
    return (
      search === "" ||
      p.order_reference.toLowerCase().includes(search.toLowerCase()) ||
      p.bachs_checkout_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.bachs_payment_id && p.bachs_payment_id.toLowerCase().includes(search.toLowerCase())) ||
      p.customer_email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredEvents = events.filter((e) => {
    return (
      search === "" ||
      e.event_id.toLowerCase().includes(search.toLowerCase()) ||
      e.event_type.toLowerCase().includes(search.toLowerCase()) ||
      (e.order_reference && e.order_reference.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="size-3" /> Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800 border border-amber-200">
            <Clock className="size-3" /> Pending
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-800 border border-rose-200">
            <XCircle className="size-3" /> {status}
          </span>
        );
      case "underpaid":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-orange-800 border border-orange-200">
            <AlertTriangle className="size-3" /> Underpaid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-wine-900/5 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-wine-900">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">
            Authoritative Financial Ledger
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">
            Bachs Payments &amp; Webhook Audit
          </h1>
          <p className="mt-1 text-sm text-wine-800/80">
            Authoritative payment confirmations, session references, and immutable delivery audit trail.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded border border-wine-900/15 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 rounded px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "payments"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "text-wine-800 hover:text-wine-950"
            }`}
          >
            <CreditCard className="size-3.5" />
            Transactions ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center gap-2 rounded px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "webhooks"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "text-wine-800 hover:text-wine-950"
            }`}
          >
            <Activity className="size-3.5" />
            Webhook Deliveries ({events.length})
          </button>
        </div>

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-wine-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, session ID, or email..."
            className="w-full rounded border border-wine-900/15 bg-white pl-9 pr-3 py-1.5 text-xs text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tab: Payments Transactions */}
      {activeTab === "payments" && (
        <div className="overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
                <tr>
                  <th className="px-4 py-3">Order Ref / Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Bachs Session ID</th>
                  <th className="px-4 py-3">Bachs Payment ID</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-900/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-wine-700">
                      <CreditCard className="mx-auto size-8 text-wine-300 mb-2" />
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-wine-950">{p.order_reference}</p>
                        <span className="text-[0.65rem] text-wine-600">
                          {new Date(p.created_at).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-wine-950">{p.customer_name || "Guest"}</p>
                        <p className="text-[0.65rem] text-wine-600">{p.customer_email}</p>
                      </td>

                      <td className="px-4 py-3 font-mono text-[0.7rem] text-wine-700">
                        {p.bachs_checkout_id}
                      </td>

                      <td className="px-4 py-3 font-mono text-[0.7rem] text-wine-700">
                        {p.bachs_payment_id || "—"}
                      </td>

                      <td className="px-4 py-3 text-right font-serif font-bold text-wine-950">
                        {formatKobo(p.amount_kobo)}
                      </td>

                      <td className="px-4 py-3 text-center">{getStatusBadge(p.status)}</td>

                      <td className="px-4 py-3 text-right">
                        {p.checkout_url && (
                          <a
                            href={p.checkout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[0.7rem] text-champagne-700 hover:text-wine-950 hover:underline"
                          >
                            <span>Session</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Webhook Deliveries */}
      {activeTab === "webhooks" && (
        <div className="overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
                <tr>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Associated Order</th>
                  <th className="px-4 py-3">Session / Payment ID</th>
                  <th className="px-4 py-3">Reported Amount</th>
                  <th className="px-4 py-3 text-right">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-900/5">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-wine-700">
                      <Activity className="mx-auto size-8 text-wine-300 mb-2" />
                      No webhook deliveries received yet.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-[0.7rem] text-wine-950 font-medium">
                        {evt.event_id}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-block rounded bg-wine-900/5 px-2 py-0.5 font-mono text-[0.68rem] text-wine-900">
                          {evt.event_type}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[0.7rem] text-wine-800">
                        {evt.order_reference || "—"}
                      </td>

                      <td className="px-4 py-3 font-mono text-[0.68rem] text-wine-600">
                        {evt.bachs_checkout_id || evt.bachs_payment_id || "—"}
                      </td>

                      <td className="px-4 py-3 font-serif font-medium text-wine-950">
                        {evt.amount ? `${evt.currency || "NGN"} ${evt.amount}` : "—"}
                      </td>

                      <td className="px-4 py-3 text-right text-[0.68rem] text-wine-600">
                        {new Date(evt.processed_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
