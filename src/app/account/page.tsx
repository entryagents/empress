import { getCurrentCustomer } from "@/lib/customer/service";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Profile Details | Empress Delicacies",
};

export default async function AccountProfilePage() {
  const { profile, user } = await getCurrentCustomer();
  return <ProfileForm profile={profile} email={user?.email || ""} />;
}
