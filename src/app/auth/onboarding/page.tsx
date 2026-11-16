import { Suspense } from "react";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Complete Your Profile | Empress Delicacies",
  description: "Set your username and Nigerian phone number to finalize your account.",
};

export const instant = false;

async function OnboardingDataLoader() {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  // If onboarding already done, proceed to account
  if ((user as any).onboardingCompleted && (user as any).phone && (user as any).username) {
    redirect("/account");
  }

  return (
    <OnboardingForm
      initialEmail={user.email || ""}
      initialName={user.name || ""}
    />
  );
}

export default function OnboardingPage() {
  return (
    <section className="min-h-[85vh] bg-ivory-100/60 pb-24 pt-36 text-wine-950 font-sans">
      <div className="container-x max-w-md">
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft">
          <div className="text-center">
            <span className="font-serif text-2xl font-bold tracking-widest text-champagne-600">
              EMPRESS
            </span>
            <h1 className="mt-2 font-serif text-3xl font-light text-wine-950">
              Almost There
            </h1>
            <p className="mt-1 text-xs text-wine-800/80">
              Complete your profile to order handcrafted dishes and track deliveries.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-wine-700">
                Loading profile...
              </div>
            }
          >
            <OnboardingDataLoader />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
