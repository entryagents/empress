import { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Sign In | Empress Delicacies",
  description: "Sign in to access your Empress customer profile, order history, and saved Nigerian delivery addresses.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[85vh] items-center justify-center text-xs text-wine-700">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}