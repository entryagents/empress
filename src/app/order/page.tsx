import { getDeliveryZones } from "@/lib/order/service";
import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout & Order Confirmation | Empress Delicacies",
  description: "Secure culinary order placement with Nigerian delivery address validation and transparent pricing.",
};

export default async function OrderPage() {
  const deliveryZones = await getDeliveryZones();
  return <CheckoutClient deliveryZones={deliveryZones} />;
}
