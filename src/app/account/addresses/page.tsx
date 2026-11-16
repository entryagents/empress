import { getCurrentCustomer, getCustomerAddresses } from "@/lib/customer/service";
import { AddressesClient } from "./addresses-client";

export const instant = false;


export const metadata = {
  title: "Saved Delivery Addresses | Empress Delicacies",
};

export default async function AccountAddressesPage() {
  const { user } = await getCurrentCustomer();
  const addresses = user ? await getCustomerAddresses(user.id) : [];

  return <AddressesClient initialAddresses={addresses} />;
}