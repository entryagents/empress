import { getAdminOrders } from "@/lib/order/service";
import { AdminOrdersClient } from "./orders-client";

export const metadata = {
  title: "Incoming Orders | Empress Admin",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders(50);
  return <AdminOrdersClient initialOrders={orders} />;
}
