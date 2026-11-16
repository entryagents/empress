import { Suspense } from "react";
import { connection } from "next/server";
import { getCustomerOrderTracking } from "@/lib/delivery/service";
import { CustomerTrackingClient } from "./tracking-client";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Live Order Tracking | Empress Delicacies",
  description: "Real-time delivery progress and live courier GPS location tracking",
};

interface TrackPageProps {
  searchParams: Promise<{
    ref?: string;
    token?: string;
  }>;
}

async function TrackingDataLoader({ searchParams }: TrackPageProps) {
  await connection();
  const params = await searchParams;
  const ref = params.ref?.trim().toUpperCase();
  const token = params.token?.trim();

  if (!ref) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-wine-900/10 bg-white p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto size-8 text-amber-600 mb-3" />
        <h2 className="font-serif text-lg font-bold text-wine-950">Tracking Reference Required</h2>
        <p className="mt-2 text-xs text-wine-800/80">
          Please provide an Empress order reference code to track live delivery.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const trackingInfo = await getCustomerOrderTracking(ref, token);

  if (!trackingInfo) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-wine-900/10 bg-white p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto size-8 text-red-600 mb-3" />
        <h2 className="font-serif text-lg font-bold text-wine-950">Order Not Found</h2>
        <p className="mt-2 text-xs text-wine-800/80">
          Could not locate an active delivery matching reference &ldquo;{ref}&rdquo;. Please verify your order receipt.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return <CustomerTrackingClient initialTracking={trackingInfo} token={token} />;
}

export default function OrderTrackPage({ searchParams }: TrackPageProps) {
  return (
    <div className="min-h-screen bg-ivory-100/60 py-8">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
              Connecting to Live Delivery Radar...
            </p>
          </div>
        }
      >
        <TrackingDataLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
