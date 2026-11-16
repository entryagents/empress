# Bachs Payment Integration Guide — Empress Delicacies

This document details the official Bachs hosted checkout and webhook verification integration for Empress Delicacies.

---

## 1. Architecture Overview

```
                                      [ Customer Browser ]
                                              │
                      1. Submits Checkout     │  2. Redirects to Bachs Hosted Checkout
                             Order            │     (Debit Card, Bank Transfer, USSD)
                                              ▼
[ Empress Server ] ──────────────► [ Bachs API Engine ]
  • Validates and recalculates        • Creates CheckoutSession
    prices server-side                • Locks NGN pricing & corridor
  • Generates Order in DB             • Emits X-Bachs-Signature-V2 signed webhooks
  • Attaches idempotency-key                  │
                                              ▼
[ /api/webhooks/bachs ] ◄─────────────────────┘
  • Reconstructs exact raw body bytes
  • Verifies HMAC-SHA256 signature and replay window (< 5 min)
  • Deduplicates via unique event.id
  • Matches order, amount, and currency
  • Transitions order payment_status to 'paid'
  • Fulfilment status remains 'received' / 'confirmed' in Kitchen Queue
```

### Key Principles Followed
- **Hosted Checkout**: Customers are securely routed to Bachs hosted checkout pages. No card details ever touch the Empress Delicacies server or browser bundle.
- **Server-Side Price Authority**: Amounts and currencies are computed on the server from the product catalogue and delivery fee rules; browser client amounts are never trusted.
- **Strict Webhook Verification**: Visiting the `/order/confirmation` return URL **never** marks an order as paid. Only an authoritative Bachs webhook or direct status check can confirm payment.
- **Status Separation**: Fulfillment status (`received`, `confirmed`, `preparing`, etc.) is strictly separated from financial payment status (`unpaid`, `pending`, `paid`, `failed`, `expired`, `underpaid`, `refund_pending`, `refunded`).
- **Idempotency**: Every session creation passes `{ idempotencyKey: "checkout-ord-${order.order_reference}" }`. Repeat requests return the existing open session without double charging.

---

## 2. Required Environment Variables

Add the following environment variables to your `.env.local` file and to your **Vercel Project Settings > Environment Variables**:

| Variable Name | Environment | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `BACHS_API_KEY` | Server-only | `sk_sandbox_...` (Sandbox) / `sk_live_...` (Production) | Bachs Secret Key. Determining mode automatically (starts with `sk_sandbox_` or `sk_live_`). |
| `BACHS_WEBHOOK_SECRET` | Server-only | `whsec_...` | Endpoint signing secret provided in Bachs Developer Portal for signature verification. |
| `NEXT_PUBLIC_APP_URL` | Public / Server | `https://empress-rosy.vercel.app` | Canonical public URL used for Bachs `success_url` and `cancel_url`. |

> [!CAUTION]
> Never commit `BACHS_API_KEY` or `BACHS_WEBHOOK_SECRET` into version control. Never expose them with a `NEXT_PUBLIC_` prefix.

---

## 3. Webhook Endpoint Configuration

### Endpoint URL
```
https://empress-rosy.vercel.app/api/webhooks/bachs
```

### Subscribed Events
In your **Bachs Developer Portal** (`Webhooks > Add destination`), subscribe to the following events:
1. `checkout.completed`: Fired when a customer completes the checkout flow.
2. `collection.succeeded`: Authoritative payment collection notice.
3. `collection.failed`: Payment attempt failed or declined.
4. `checkout.expired`: Hosted session expired before payment completion.
5. `collection.underpaid`: Insufficient funds delivered.
6. `refund.created` / `refund.paid`: Refund lifecycle notifications.

---

## 4. How to Test in Bachs Sandbox

1. In the **Bachs Dashboard**, ensure your account is set to **Sandbox Mode**.
2. Create an API secret key starting with `sk_sandbox_` under **Developer Portal > API Keys**.
3. Create a webhook destination pointing to `https://<your-deployment-url>/api/webhooks/bachs` and copy the signing secret (`whsec_...`).
4. Set `BACHS_API_KEY` and `BACHS_WEBHOOK_SECRET` in your server environment.
5. Place a test order through the Empress Delicacies checkout:
   - Click **Pay with Bachs**.
   - You will land on the Bachs hosted checkout page.
   - Use the test cards/accounts provided on the sandbox hosted page.
   - After payment, you are redirected back to `/order/confirmation`.
   - The confirmation page polls until the webhook marks the order `PAID`.

---

## 5. Going Live Checklist

When switching from Sandbox to Live Production:
1. Verify business KYC in the Bachs Dashboard.
2. Swap `BACHS_API_KEY` from `sk_sandbox_...` to `sk_live_...`.
3. In the Bachs Developer Portal, add your production webhook destination:
   `https://empress-rosy.vercel.app/api/webhooks/bachs`.
4. Copy the production `whsec_...` and configure `BACHS_WEBHOOK_SECRET`.
5. Run a live micro-transaction test (e.g. ₦1,000) using a real debit card to confirm end-to-end delivery before general customer rollout.

---

## 6. Admin Payments Dashboard

Staff and authorized administrators can monitor all payment sessions, references, amounts, and webhook deliveries in real-time at:
```
/admin/payments
```
Features:
- Filter transactions by status: `paid`, `pending`, `failed`, `expired`, `underpaid`.
- Inspect Bachs checkout session IDs and provider payment IDs.
- Direct link to open the hosted session if customer needs assistance.
- Webhook Delivery audit log showing event IDs, types, and delivery timestamps.
