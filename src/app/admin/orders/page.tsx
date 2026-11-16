import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminOrders, getOrderAdminMetrics } from "@/lib/order/service";
import { AdminOrdersClient } from "./orders-client";

export const metadata = {
  title: "Order Fulfilment & Intake | Empress Admin",
  description: "Comprehensive culinary order intake, status workflow transitions, and financial ledger.",
};

async function OrdersDataLoader() {
  await connection();
  const [orders, metrics] = await Promise.all([
    getAdminOrders(100),
    getOrderAdminMetrics(),
  ]);

  return <AdminOrdersClient initialOrders={orders} metrics={metrics} />;
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-center text-wine-900">
          <div className="size-8 border-2 border-wine-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-serif text-sm">Loading culinary order stream &amp; metrics...</p>
        </div>
      }
    >
      <OrdersDataLoader />
    </Suspense>
  );
}
