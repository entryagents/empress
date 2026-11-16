import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getOrderByReferenceAndToken, getOrderStatusHistory, getAdminOrders } from "@/lib/order/service";
import { getOrderNotificationLogs } from "@/lib/order/notifications";
import { OrderDetailClient } from "./order-detail-client";

interface Props {
  params: Promise<{
    id: string; // Order reference or ID passed as route param
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Order ${id} | Empress Admin`,
  };
}

export async function generateStaticParams() {
  const orders = await getAdminOrders(10);
  if (!orders || orders.length === 0) {
    return [{ id: "EMP-SAMPLE" }];
  }
  return orders.map((o) => ({ id: o.order_reference }));
}

async function OrderDetailDataLoader({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const orderRef = decodeURIComponent(id).trim().toUpperCase();

  const [order, timeline, notificationLogs] = await Promise.all([
    getOrderByReferenceAndToken(orderRef),
    getOrderStatusHistory(orderRef),
    getOrderNotificationLogs(orderRef),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailClient
      initialOrder={order}
      initialTimeline={timeline}
      initialNotifications={notificationLogs}
    />
  );
}

export default function AdminOrderDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-center text-wine-900">
          <div className="size-8 border-2 border-wine-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-serif text-sm">Loading order details and timeline...</p>
        </div>
      }
    >
      <OrderDetailDataLoader paramsPromise={params} />
    </Suspense>
  );
}
