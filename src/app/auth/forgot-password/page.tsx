import { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const instant = false;


export const metadata: Metadata = {
  title: "Reset Password | Empress Delicacies",
  description: "Reset your Empress Delicacies customer account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}