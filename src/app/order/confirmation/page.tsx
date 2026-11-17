import { Suspense } from "react";
import { connection } from "next/server";
import { getOrderByReferenceAndToken } from "@/lib/order/service";
import { OrderConfirmationClient } from "./confirmation-client";
import type { Order } from "@/types/order";

export const instant = false;


export const metadata = {
  title: "Order Confirmation | Empress Delicacies",
  description: "Official order confirmation and reservation record for Empress Delicacies.",
};

interface OrderConfirmationPageProps {
  searchParams: Promise<{
    ref?: string;
    token?: string;
  }>;
}

async function ConfirmationDataLoader({ searchParams }: OrderConfirmationPageProps) {
  await connection();
  const params = await searchParams;
  const ref = params.ref?.trim().toUpperCase();
  const token = params.token?.trim();

  let initialOrder: Order | null = null;
  if (ref && token) {
    const isToken = token.length > 20;
    initialOrder = await getOrderByReferenceAndToken(
      ref,
      isToken ? token : undefined,
      !isToken ? token : undefined
    );

    // If order was retrieved and is pending, sync directly with Bachs API
    if (initialOrder && initialOrder.payment_status === "pending" && initialOrder.bachs_checkout_id) {
      const { syncOrderPaymentWithBachs } = await import("@/lib/payment/service");
      initialOrder = await syncOrderPaymentWithBachs(initialOrder);
    }
  }

  return <OrderConfirmationClient initialOrder={initialOrder} initialRef={ref} initialToken={token} />;
}

export default function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center bg-ivory-100/60 text-wine-900">
          <p className="font-serif text-lg">Retrieving order confirmation...</p>
        </div>
      }
    >
      <ConfirmationDataLoader searchParams={searchParams} />
    </Suspense>
  );
}