import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In | Empress Delicacies",
  description: "Sign in to access your Empress customer profile, order history, and saved Nigerian delivery addresses.",
};

export default function LoginPage() {
  return <LoginForm />;
}
