import { redirect } from "next/navigation";
import { getDeliveryZones } from "@/lib/order/service";
import { getCurrentCustomer, getCustomerAddresses } from "@/lib/customer/service";
import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout & Order Confirmation | Empress Delicacies",
  description: "Secure culinary order placement with Nigerian delivery address validation and transparent pricing.",
};

export const instant = false;

export default async function OrderPage() {
  const { user, profile } = await getCurrentCustomer();

  // Enforce customer authentication: Checkout requires login
  if (!user) {
    redirect("/auth/login?redirect=/order");
  }

  const [deliveryZones, savedAddresses] = await Promise.all([
    getDeliveryZones(),
    getCustomerAddresses(user.id),
  ]);

  return (
    <CheckoutClient
      deliveryZones={deliveryZones}
      customer={{
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "",
        phone: profile?.phone || "",
      }}
      savedAddresses={savedAddresses}
    />
  );
}
