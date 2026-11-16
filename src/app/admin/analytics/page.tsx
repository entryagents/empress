import { Suspense } from "react";
import { connection } from "next/server";
import { generateAnalyticsReport } from "@/lib/analytics/service";
import { AnalyticsClient } from "./analytics-client";

export const instant = false;


export const metadata = {
  title: "Analytics & Executive Reporting | Empress Delicacies",
  description: "Audited financial ledger, dish popularity, customer insights, and fleet logistics in Africa/Lagos WAT",
};

async function AnalyticsDataLoader() {
  await connection();
  const initialReport = await generateAnalyticsReport({ preset: "last_30_days" });

  return <AnalyticsClient initialReport={initialReport} />;
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
            Generating Executive Analytics &amp; Financial Ledger...
          </p>
        </div>
      }
    >
      <AnalyticsDataLoader />
    </Suspense>
  );
}