import { Suspense } from "react";
import { connection } from "next/server";
import { getAllDeliveryPersonnel, getActiveDeliveriesAdmin } from "@/lib/delivery/service";
import { getAdminOrders } from "@/lib/order/service";
import { AdminDeliveriesClient } from "./deliveries-client";

export const metadata = {
  title: "Delivery Management & Live Fleet Radar | Empress Delicacies",
  description: "Dispatch control, driver fleet management, and live GPS delivery tracking",
};

async function DeliveriesDataLoader() {
  await connection();

  const [personnel, activeDeliveries, allOrders] = await Promise.all([
    getAllDeliveryPersonnel(),
    getActiveDeliveriesAdmin(),
    getAdminOrders(100),
  ]);

  const unassignedOrders = allOrders.filter(
    (o) =>
      o.fulfillment_type === "delivery" &&
      !o.assigned_driver_id &&
      ["confirmed", "preparing", "ready_for_dispatch"].includes(o.status)
  );

  return (
    <AdminDeliveriesClient
      initialPersonnel={personnel}
      activeDeliveries={activeDeliveries}
      unassignedOrders={unassignedOrders}
    />
  );
}

export default function AdminDeliveriesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
            Loading Fleet &amp; Dispatch Radar...
          </p>
        </div>
      }
    >
      <DeliveriesDataLoader />
    </Suspense>
  );
}
