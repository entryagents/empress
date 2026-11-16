"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Navigation,
  RefreshCw,
} from "lucide-react";
import type { PublicDeliveryTrackingInfo } from "@/types/delivery";
import { LiveDeliveryMap } from "@/components/delivery/live-delivery-map";

interface CustomerTrackingClientProps {
  initialTracking: PublicDeliveryTrackingInfo;
  token?: string;
}

export function CustomerTrackingClient({
  initialTracking,
  token,
}: CustomerTrackingClientProps) {
  const [tracking, setTracking] = useState<PublicDeliveryTrackingInfo>(initialTracking);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for latest coordinates while delivery is active
  useEffect(() => {
    if (!tracking.tracking_active) return;

    const interval = setInterval(async () => {
      try {
        const queryParams = token ? `?token=${encodeURIComponent(token)}` : "";
        const res = await fetch(
          `/api/orders/${tracking.order_reference}/tracking${queryParams}`
        );
        if (res.ok) {
          const freshData = await res.json();
          if (freshData && freshData.order_reference) {
            setTracking(freshData);
          }
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 10000); // 10s poll

    return () => clearInterval(interval);
  }, [tracking.order_reference, tracking.tracking_active, token]);

  const refreshNow = async () => {
    setIsRefreshing(true);
    try {
      const queryParams = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/orders/${tracking.order_reference}/tracking${queryParams}`);
      if (res.ok) {
        const freshData = await res.json();
        if (freshData) setTracking(freshData);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const addr = tracking.delivery_address;
  const destinationText = `${addr.street_address || ""}, ${addr.area || ""}, ${addr.city || ""}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href={`/order/confirmation?ref=${tracking.order_reference}${token ? `&token=${token}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-900 hover:text-champagne-600 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Receipt
        </Link>

        <button
          onClick={refreshNow}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-wine-900/15 bg-white px-3 py-1 text-xs font-medium text-wine-900 hover:bg-ivory-50 shadow-xs"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Order & Live Status Banner */}
      <div className="overflow-hidden rounded-2xl border border-wine-900/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-champagne-600">
              Live Delivery Telemetry
            </span>
            <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
              Tracking #{tracking.order_reference}
            </h1>
            <p className="mt-1 text-xs text-wine-800/80">
              Prepared fresh for {tracking.recipient_name}
            </p>
          </div>

          {tracking.estimated_arrival_minutes && (
            <div className="rounded-xl bg-champagne-100/80 border border-champagne-300/60 p-4 text-center sm:text-right">
              <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-wine-900">
                Estimated Transit
              </span>
              <span className="font-serif text-2xl font-bold text-wine-950">
                ~{tracking.estimated_arrival_minutes} Mins
              </span>
            </div>
          )}
        </div>

        {/* Live Fulfilment Stepper */}
        <div className="py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {tracking.status_timeline.map((step, idx) => (
              <div
                key={step.status}
                className={`relative flex flex-col items-center text-center p-3 rounded-lg border transition ${
                  step.current
                    ? "border-champagne-500 bg-champagne-50/60 shadow-xs ring-1 ring-champagne-400/30"
                    : step.completed
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-gray-100 bg-gray-50/50 opacity-60"
                }`}
              >
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-[0.7rem] font-bold mb-2 ${
                    step.completed
                      ? "bg-emerald-600 text-white"
                      : step.current
                      ? "bg-champagne-500 text-wine-950 animate-pulse"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.completed ? "✓" : idx + 1}
                </div>
                <span className="text-xs font-semibold text-wine-950">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Radar Map */}
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-wine-900">
              Live Courier Radar
            </span>
            {tracking.location && (
              <span className="text-[0.7rem] text-wine-700/80 font-mono">
                GPS Fix: Lat {tracking.location.latitude.toFixed(4)}, Lng {tracking.location.longitude.toFixed(4)}
              </span>
            )}
          </div>

          <LiveDeliveryMap
            driverLat={tracking.location?.latitude}
            driverLng={tracking.location?.longitude}
            destinationAddress={destinationText}
            isStale={tracking.location?.is_stale}
            lastUpdated={tracking.location?.recorded_at}
            className="h-72 sm:h-96"
          />
        </div>

        {/* Courier & Destination Details */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-wine-900/10 pt-6">
          {/* Driver Card */}
          <div className="rounded-xl border border-wine-900/10 bg-ivory-50/50 p-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
              Assigned Courier
            </span>
            {tracking.driver ? (
              <div className="mt-2">
                <p className="text-sm font-bold text-wine-950">
                  {tracking.driver.first_name} (Empress Fleet)
                </p>
                <p className="text-xs text-wine-800 capitalize">
                  Vehicle: {tracking.driver.vehicle_type || "Motorcycle"}
                </p>
                {tracking.driver.phone_masked && (
                  <p className="text-xs text-wine-700 font-mono mt-1">
                    Contact: {tracking.driver.phone_masked}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-wine-800/80">
                Courier being assigned by dispatch office.
              </p>
            )}
          </div>

          {/* Delivery Address Card */}
          <div className="rounded-xl border border-wine-900/10 bg-ivory-50/50 p-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
              Destination Address
            </span>
            <p className="mt-2 text-xs font-bold text-wine-950">
              {addr.building_number ? `${addr.building_number}, ` : ""}
              {addr.street_address}
            </p>
            <p className="text-xs text-wine-800">
              {addr.area}, {addr.city}, {addr.state}
            </p>
            {addr.landmark && (
              <p className="mt-1 text-[0.7rem] italic text-champagne-700">
                Landmark: &ldquo;{addr.landmark}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
