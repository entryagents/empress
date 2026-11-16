"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Truck,
  Download,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import type {
  FullAnalyticsReport,
  AnalyticsDateRangePreset,
  AnalyticsFilterParams,
} from "@/types/analytics";
import { fetchAnalyticsDataAction, exportAnalyticsCsvAction } from "./actions";

interface AnalyticsClientProps {
  initialReport: FullAnalyticsReport;
}

export function AnalyticsClient({ initialReport }: AnalyticsClientProps) {
  const [report, setReport] = useState<FullAnalyticsReport>(initialReport);
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "products" | "customers" | "deliveries">("overview");
  const [preset, setPreset] = useState<AnalyticsDateRangePreset>(initialReport.period.preset);
  const [customStart, setCustomStart] = useState<string>(initialReport.period.startDate);
  const [customEnd, setCustomEnd] = useState<string>(initialReport.period.endDate);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Apply new date filter
  const handleFilterChange = async (newPreset: AnalyticsDateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setLoading(true);
      const res = await fetchAnalyticsDataAction({ preset: newPreset });
      setLoading(false);
      if (res.success && res.data) {
        setReport(res.data);
      }
    }
  };

  const handleCustomRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetchAnalyticsDataAction({
      preset: "custom",
      startDate: customStart,
      endDate: customEnd,
    });
    setLoading(false);
    if (res.success && res.data) {
      setReport(res.data);
    }
  };

  // Trigger CSV Download
  const handleExportCsv = async (type: "orders" | "revenue" | "products" | "deliveries") => {
    setExporting(true);
    const filterParams: AnalyticsFilterParams =
      preset === "custom"
        ? { preset: "custom", startDate: customStart, endDate: customEnd }
        : { preset };

    const res = await exportAnalyticsCsvAction(type, filterParams);
    setExporting(false);

    if (res.success && res.csvContent && res.filename) {
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const o = report.overview;
  const formatNgn = (kobo: number) => `₦${(kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-champagne-600">
            Delta State Executive Ledger &bull; Africa/Lagos WAT
          </span>
          <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
            Enterprise Financial &amp; Operational Analytics
          </h1>
          <p className="mt-1 text-xs text-wine-800/80">
            Active reporting period: {report.period.startDate} to {report.period.endDate}
          </p>
        </div>

        {/* Date Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={preset}
            onChange={(e) => handleFilterChange(e.target.value as AnalyticsDateRangePreset)}
            className="rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-wine-950 shadow-xs focus:border-champagne-500 focus:outline-hidden"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          <button
            onClick={() => handleExportCsv(activeTab === "products" ? "products" : activeTab === "revenue" ? "revenue" : activeTab === "deliveries" ? "deliveries" : "orders")}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50"
          >
            <Download className="size-3.5" />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Picker Bar */}
      {preset === "custom" && (
        <form
          onSubmit={handleCustomRangeSubmit}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-wine-900/10 bg-white p-3 shadow-xs"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-wine-900">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className="rounded border border-wine-900/20 p-1.5 text-xs text-wine-950"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-wine-900">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className="rounded border border-wine-900/20 p-1.5 text-xs text-wine-950"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-wine-900 px-4 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800"
          >
            {loading ? "Filtering..." : "Apply Range"}
          </button>
        </form>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-wine-900/10 pb-3">
        {[
          { id: "overview", label: "Executive Overview", icon: TrendingUp },
          { id: "revenue", label: "Revenue & Cashflow", icon: DollarSign },
          { id: "products", label: "Dishes & Product Performance", icon: ShoppingBag },
          { id: "customers", label: "Customer Insights", icon: Users },
          { id: "deliveries", label: "Fleet & Delivery Logistics", icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === tab.id
                  ? "bg-wine-900 text-ivory-50 shadow-xs"
                  : "bg-white text-wine-900 hover:bg-ivory-100 border border-wine-900/10"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* High-Level Metric Tiles */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                Verified Net Revenue
              </span>
              <p className="mt-2 text-2xl font-bold font-serif text-emerald-800">
                {formatNgn(o.netRevenueKobo)}
              </p>
              <span className="text-[0.7rem] text-wine-700/70">
                Strictly collected payments minus refunds
              </span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                Average Order Value
              </span>
              <p className="mt-2 text-2xl font-bold font-serif text-wine-950">
                {formatNgn(o.averageOrderValueKobo)}
              </p>
              <span className="text-[0.7rem] text-wine-700/70">Per paid transaction</span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                Total Orders (Period)
              </span>
              <p className="mt-2 text-2xl font-bold text-wine-950">{o.totalOrders}</p>
              <span className="text-[0.7rem] text-wine-700/70">
                Today: {o.ordersReceivedToday} &bull; Month: {o.ordersReceivedThisMonth}
              </span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                Payment Success Rate
              </span>
              <p className="mt-2 text-2xl font-bold text-wine-950">{o.paymentSuccessRatePct}%</p>
              <span className="text-[0.7rem] text-emerald-700 font-semibold">
                {o.paidOrdersCount} Paid &bull; {o.failedPaymentsCount} Failed
              </span>
            </div>
          </div>

          {/* Revenue Calculation Transparency Note */}
          <div className="rounded-xl border border-champagne-500/20 bg-champagne-50/50 p-4 text-xs text-wine-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-wine-900">
              <ShieldCheck className="size-4 text-champagne-700" />
              <span>Revenue Accounting Verification:</span>
            </div>
            <p className="text-[0.75rem] text-wine-800">
              Gross Order Value: <strong>{formatNgn(o.grossOrderValueKobo)}</strong> &bull; Total Verified Revenue: <strong>{formatNgn(o.totalVerifiedRevenueKobo)}</strong> &bull; Refunds/Cancellations: <strong>{formatNgn(o.refundsKobo)}</strong> &bull; Net Collected: <strong>{formatNgn(o.netRevenueKobo)}</strong>.
              Unpaid transactions ({o.pendingPaymentsCount}) and failed payments ({o.failedPaymentsCount}) are strictly excluded from net revenue.
            </p>
          </div>

          {/* Split Section: Daily Revenue Table & Fulfillment Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Daily Trend Table */}
            <div className="lg:col-span-2 rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs">
              <h2 className="font-serif text-lg font-medium text-wine-950 mb-3">
                Daily Revenue Activity (Africa/Lagos)
              </h2>

              {report.revenueTrend.length === 0 ? (
                <div className="py-12 text-center text-xs text-wine-700/60">
                  No order activity recorded within the selected date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-wine-900/10 text-wine-700 uppercase tracking-wider text-[0.65rem]">
                        <th className="py-2">Date</th>
                        <th className="py-2">Day</th>
                        <th className="py-2 text-right">Orders</th>
                        <th className="py-2 text-right">Verified Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wine-900/5">
                      {report.revenueTrend.map((row) => (
                        <tr key={row.date} className="hover:bg-ivory-50/50">
                          <td className="py-2.5 font-mono">{row.date}</td>
                          <td className="py-2.5 font-medium text-wine-900">{row.label}</td>
                          <td className="py-2.5 text-right font-semibold">{row.orderCount}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-800 font-mono">
                            {formatNgn(row.revenueKobo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fulfillment & Logistics Distribution */}
            <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                Fulfillment Distribution
              </h2>

              <div className="space-y-3">
                <div className="rounded-lg border border-wine-900/10 p-3 bg-ivory-50/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-wine-950">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-4 text-champagne-600" />
                      Home Delivery
                    </span>
                    <span>{report.fulfillmentBreakdown.deliveryOrdersCount} orders</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-emerald-800 font-mono">
                    {formatNgn(report.fulfillmentBreakdown.deliveryRevenueKobo)}
                  </p>
                </div>

                <div className="rounded-lg border border-wine-900/10 p-3 bg-ivory-50/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-wine-950">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="size-4 text-wine-700" />
                      Customer Pickup
                    </span>
                    <span>{report.fulfillmentBreakdown.pickupOrdersCount} orders</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-emerald-800 font-mono">
                    {formatNgn(report.fulfillmentBreakdown.pickupRevenueKobo)}
                  </p>
                </div>
              </div>

              {/* Delivery Zones Breakdown */}
              <div className="pt-2">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                  Revenue by Delta State Zone
                </span>
                <div className="mt-2 space-y-2">
                  {report.zoneBreakdown.slice(0, 4).map((z) => (
                    <div
                      key={z.zoneName}
                      className="flex items-center justify-between text-xs border-b border-wine-900/5 pb-1"
                    >
                      <span className="text-wine-900 font-medium">{z.zoneName}</span>
                      <span className="font-mono font-bold text-wine-950">
                        {formatNgn(z.revenueKobo)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & CASHFLOW */}
      {activeTab === "revenue" && (
        <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-medium text-wine-950">
                Audited Revenue &amp; Financial Ledger
              </h2>
              <p className="text-xs text-wine-800/80">
                All values in Nigerian Naira (NGN). Unpaid transactions are never treated as revenue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-wine-900/10 p-4">
              <span className="text-[0.65rem] uppercase text-wine-700">Gross Value</span>
              <p className="text-lg font-bold font-mono text-wine-950">{formatNgn(o.grossOrderValueKobo)}</p>
            </div>
            <div className="rounded-lg border border-wine-900/10 p-4">
              <span className="text-[0.65rem] uppercase text-emerald-700">Verified Revenue</span>
              <p className="text-lg font-bold font-mono text-emerald-800">{formatNgn(o.totalVerifiedRevenueKobo)}</p>
            </div>
            <div className="rounded-lg border border-wine-900/10 p-4">
              <span className="text-[0.65rem] uppercase text-rose-700">Refunds / Cancelled</span>
              <p className="text-lg font-bold font-mono text-rose-800">{formatNgn(o.refundsKobo)}</p>
            </div>
            <div className="rounded-lg border border-wine-900/10 p-4">
              <span className="text-[0.65rem] uppercase text-wine-700">Net Retained</span>
              <p className="text-lg font-bold font-mono text-wine-950">{formatNgn(o.netRevenueKobo)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-wine-900/10 text-wine-700 uppercase tracking-wider text-[0.65rem]">
                  <th className="py-2.5">Date (WAT)</th>
                  <th className="py-2.5">Day of Week</th>
                  <th className="py-2.5 text-right">Transactions</th>
                  <th className="py-2.5 text-right">Verified Revenue (NGN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-900/5">
                {report.revenueTrend.map((row) => (
                  <tr key={row.date} className="hover:bg-ivory-50/50">
                    <td className="py-3 font-mono">{row.date}</td>
                    <td className="py-3 font-medium text-wine-900">{row.label}</td>
                    <td className="py-3 text-right">{row.orderCount}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-800">
                      {formatNgn(row.revenueKobo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DISHES & PRODUCT PERFORMANCE */}
      {activeTab === "products" && (
        <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-serif text-lg font-medium text-wine-950">
              Product Performance &amp; Culinary Sales Volume
            </h2>
            <p className="text-xs text-wine-800/80">
              Derived from historical line item snapshots to preserve accurate pricing history.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-wine-900/10 text-wine-700 uppercase tracking-wider text-[0.65rem]">
                  <th className="py-2.5">Dish / Specialty</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">Units Sold</th>
                  <th className="py-2.5 text-right">Avg Unit Price</th>
                  <th className="py-2.5 text-right">Total Revenue (NGN)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-900/5">
                {report.productPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-wine-700/60">
                      No dishes sold in this date range.
                    </td>
                  </tr>
                ) : (
                  report.productPerformance.map((prod, idx) => (
                    <tr key={prod.productId} className="hover:bg-ivory-50/50">
                      <td className="py-3 font-bold text-wine-950">
                        {idx + 1}. {prod.productName}
                      </td>
                      <td className="py-3 text-wine-700">{prod.categoryName}</td>
                      <td className="py-3 text-right font-semibold text-wine-900">
                        {prod.unitsSold}
                      </td>
                      <td className="py-3 text-right font-mono text-wine-800">
                        {formatNgn(prod.averagePriceKobo)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-800">
                        {formatNgn(prod.totalRevenueKobo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER INSIGHTS */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Total Customers</span>
              <p className="mt-1 text-2xl font-bold text-wine-950">
                {report.customerAnalytics.totalCustomers}
              </p>
              <span className="text-[0.7rem] text-wine-700/70">
                {report.customerAnalytics.registeredCustomers} Registered &bull; {report.customerAnalytics.guestCustomers} Guests
              </span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Repeat Order Rate</span>
              <p className="mt-1 text-2xl font-bold text-wine-950">
                {report.customerAnalytics.repeatOrderRatePct}%
              </p>
              <span className="text-[0.7rem] text-emerald-700 font-semibold">
                {report.customerAnalytics.returningCustomersPeriod} returning diners
              </span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Avg Orders / Customer</span>
              <p className="mt-1 text-2xl font-bold text-wine-950">
                {report.customerAnalytics.averageOrdersPerCustomer}
              </p>
              <span className="text-[0.7rem] text-wine-700/70">Across lifetime activity</span>
            </div>

            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Privacy Safeguard</span>
              <p className="mt-1 text-sm font-bold text-emerald-800">Admin Encrypted</p>
              <span className="text-[0.7rem] text-wine-700/70">Restricted to staff role</span>
            </div>
          </div>

          {/* Top Diners Table */}
          <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950">
              Highest-Value Diners
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-wine-900/10 text-wine-700 uppercase tracking-wider text-[0.65rem]">
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Account Status</th>
                    <th className="py-2.5">Phone Contact</th>
                    <th className="py-2.5 text-right">Orders Placed</th>
                    <th className="py-2.5 text-right">Total Spent (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wine-900/5">
                  {report.customerAnalytics.topCustomers.map((cust) => (
                    <tr key={cust.email} className="hover:bg-ivory-50/50">
                      <td className="py-3">
                        <p className="font-bold text-wine-950">{cust.customerName}</p>
                        <p className="text-[0.7rem] text-wine-700">{cust.email}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                            cust.isRegistered
                              ? "bg-champagne-200 text-wine-950"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {cust.isRegistered ? "Registered" : "Guest Diner"}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-wine-800">{cust.phone}</td>
                      <td className="py-3 text-right font-semibold">{cust.ordersCount}</td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-800">
                        {formatNgn(cust.totalSpentKobo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FLEET & LOGISTICS */}
      {activeTab === "deliveries" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Completed Deliveries</span>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {report.deliveryAnalytics.completedDeliveries}
              </p>
            </div>
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Active In Transit</span>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {report.deliveryAnalytics.activeDeliveries}
              </p>
            </div>
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Avg Transit Time</span>
              <p className="mt-1 text-2xl font-bold text-wine-950 font-serif">
                ~{report.deliveryAnalytics.averageDeliveryMinutes} Mins
              </p>
            </div>
            <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
              <span className="text-[0.65rem] uppercase text-wine-700">Awaiting Courier</span>
              <p className="mt-1 text-2xl font-bold text-wine-900">
                {report.deliveryAnalytics.ordersAwaitingAssignment}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950">
              Courier Performance Roster
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-wine-900/10 text-wine-700 uppercase tracking-wider text-[0.65rem]">
                    <th className="py-2.5">Courier</th>
                    <th className="py-2.5">Vehicle</th>
                    <th className="py-2.5 text-right">Completed Trips</th>
                    <th className="py-2.5 text-right">Active Trips</th>
                    <th className="py-2.5 text-right">Failed Trips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wine-900/5">
                  {report.deliveryAnalytics.driverPerformance.map((dp) => (
                    <tr key={dp.driverId} className="hover:bg-ivory-50/50">
                      <td className="py-3 font-bold text-wine-950">{dp.driverName}</td>
                      <td className="py-3 uppercase text-wine-700">{dp.vehicleType}</td>
                      <td className="py-3 text-right font-semibold text-emerald-800">
                        {dp.completedTrips}
                      </td>
                      <td className="py-3 text-right font-semibold text-amber-700">
                        {dp.activeTrips}
                      </td>
                      <td className="py-3 text-right font-semibold text-rose-700">
                        {dp.failedTrips}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
