import { getCurrentCustomer, getCustomerOrders } from "@/lib/customer/service";
import { CustomerOrdersClient } from "./orders-client";

export const metadata = {
  title: "Order History | Empress Delicacies",
};

export default async function AccountOrdersPage() {
  const { user } = await getCurrentCustomer();
  const orders = user ? await getCustomerOrders(user.id, user.email) : [];

  return <CustomerOrdersClient initialOrders={orders} userEmail={user?.email || ""} />;
}
