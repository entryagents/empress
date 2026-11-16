import { Metadata } from "next";
import { SignUpForm } from "./signup-form";

export const instant = false;


export const metadata: Metadata = {
  title: "Create Account | Empress Delicacies",
  description: "Join Empress Delicacies for seamless ordering, saved Lagos delivery addresses, and VIP dining privileges.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}