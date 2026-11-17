import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer/service";

export const instant = false;

export const metadata = {
  title: "My Account | Empress Delicacies",
};

export default async function AccountPage() {
  const { user } = await getCurrentCustomer();
  if (!user) {
    redirect("/auth/login");
  }
  redirect("/account/orders");
}