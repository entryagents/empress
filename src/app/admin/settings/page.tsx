import { Suspense } from "react";
import { connection } from "next/server";
import {
  getBusinessSettings,
  getAdminDeliveryZones,
  getHomepageCMS,
} from "@/lib/settings/service";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Business Settings & CMS | Empress Delicacies",
  description: "Configure Delta State delivery zones, business hours, pickup rules, and homepage branding",
};

async function SettingsDataLoader() {
  await connection();

  const [settings, zones, cms] = await Promise.all([
    getBusinessSettings(),
    getAdminDeliveryZones(),
    getHomepageCMS(),
  ]);

  return (
    <SettingsClient
      initialSettings={settings}
      initialZones={zones}
      initialCMS={cms}
    />
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
            Loading Enterprise Settings &amp; Delivery Zones...
          </p>
        </div>
      }
    >
      <SettingsDataLoader />
    </Suspense>
  );
}
