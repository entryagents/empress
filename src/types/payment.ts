export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "underpaid"
  | "refund_pending"
  | "refunded";

export type PaymentMethodType = "card" | "bank_transfer" | "crypto" | "momo" | "other";

export interface PaymentRecord {
  id: string;
  order_id: string;
  order_reference: string;
  provider: "bachs";
  bachs_checkout_id: string;
  bachs_payment_id?: string | null;
  amount_kobo: number;
  amount_paid_kobo?: number | null;
  currency: string;
  status: PaymentStatus;
  payment_method?: string | null;
  customer_email: string;
  customer_name?: string | null;
  checkout_url?: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEventRecord {
  id: string;
  event_id: string;
  event_type: string;
  order_reference?: string | null;
  order_id?: string | null;
  bachs_checkout_id?: string | null;
  bachs_payment_id?: string | null;
  status?: string | null;
  amount?: string | null;
  currency?: string | null;
  payload_summary?: Record<string, unknown> | null;
  processed_at: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  orderReference?: string;
  accessToken?: string;
  checkoutUrl?: string;
  checkoutId?: string;
  error?: string;
}

export interface OrderPaymentStatusResponse {
  orderReference: string;
  status: string;
  paymentStatus: PaymentStatus;
  totalKobo: number;
  currency: string;
  isPaid: boolean;
  bachsCheckoutId?: string | null;
  checkoutUrl?: string | null;
  completedAt?: string | null;
}
