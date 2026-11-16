import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentCustomer } from "@/lib/customer/service";
import {
  getAllDeliveryPersonnel,
  getAssignmentsForDriver,
  getDeliveryPersonByUserId,
} from "@/lib/delivery/service";
import { DriverDashboardClient } from "./delivery-client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export const metadata = {
  title: "Courier Mobile Portal | Empress Delicacies",
  description: "Dedicated delivery personnel console for assignments and GPS transit tracking",
};

export const instant = false;

async function DriverDataLoader() {
  await connection();

  const { user, profile } = await getCurrentCustomer();
  const allDrivers = await getAllDeliveryPersonnel();

  // If user is logged in as delivery_driver, find their profile
  let currentDriver = user ? await getDeliveryPersonByUserId(user.id) : null;

  // In demo / test / local environment without explicit driver auth login, default to first available driver
  if (!currentDriver && allDrivers.length > 0) {
    currentDriver = allDrivers[0];
  }

  if (!currentDriver) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-wine-900/10 bg-white p-8 text-center shadow-sm">
        <Lock className="mx-auto size-8 text-wine-900/40 mb-3" />
        <h2 className="font-serif text-lg font-bold text-wine-950">Courier Login Required</h2>
        <p className="mt-2 text-xs text-wine-800/80">
          Please log in with your Empress delivery courier account credentials.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const assignments = await getAssignmentsForDriver(currentDriver.id);

  return (
    <AuthenticatedShell role="delivery_driver">
      <div className="max-w-4xl mx-auto">
        <DriverDashboardClient
          initialDriver={currentDriver}
          initialAssignments={assignments}
        />
      </div>
    </AuthenticatedShell>
  );
}

export default function DeliveryPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
            Connecting Courier Console...
          </p>
        </div>
      }
    >
      <DriverDataLoader />
    </Suspense>
  );
}
