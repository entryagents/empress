import { getDeliveryZones } from "@/lib/order/service";
import { getCurrentCustomer, getCustomerAddresses } from "@/lib/customer/service";
import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout & Order Confirmation | Empress Delicacies",
  description: "Secure culinary order placement with Nigerian delivery address validation and transparent pricing.",
};

export const instant = false;

export default async function OrderPage() {
  const [deliveryZones, { user, profile }] = await Promise.all([
    getDeliveryZones(),
    getCurrentCustomer(),
  ]);

  const savedAddresses = user ? await getCustomerAddresses(user.id) : [];

  return (
    <CheckoutClient
      deliveryZones={deliveryZones}
      customer={
        user
          ? {
              id: user.id,
              email: user.email,
              fullName: profile?.full_name || "",
              phone: profile?.phone || "",
            }
          : null
      }
      savedAddresses={savedAddresses}
    />
  );
}
