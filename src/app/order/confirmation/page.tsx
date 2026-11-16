import { Suspense } from "react";
import { OrderConfirmationClient } from "./confirmation-client";

export const metadata = {
  title: "Order Confirmation | Empress Delicacies",
  description: "Official order confirmation and reservation record for Empress Delicacies.",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center bg-ivory-100/60 text-wine-900">
          <p className="font-serif text-lg">Retrieving order confirmation...</p>
        </div>
      }
    >
      <OrderConfirmationClient />
    </Suspense>
  );
}
