import { getAdminPayments, getAdminPaymentEvents } from "@/lib/payment/service";
import { AdminPaymentsClient } from "./payments-client";

export const metadata = {
  title: "Payments & Webhook Audit | Empress Admin",
  description: "Bachs payment transactions, hosted sessions, and webhook delivery audit log.",
};

export default async function AdminPaymentsPage() {
  const [payments, events] = await Promise.all([
    getAdminPayments(50),
    getAdminPaymentEvents(50),
  ]);

  return <AdminPaymentsClient initialPayments={payments} initialEvents={events} />;
}
