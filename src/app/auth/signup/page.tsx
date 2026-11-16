import { Suspense } from "react";
import { Metadata } from "next";
import { SignUpForm } from "./signup-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Create Account | Empress Delicacies",
  description: "Join Empress Delicacies for seamless ordering, saved Lagos delivery addresses, and VIP dining privileges.",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[85vh] items-center justify-center text-xs text-wine-700">
          Loading registration...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}