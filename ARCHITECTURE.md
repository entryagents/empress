# EMPRESS DELICACIES — ARCHITECTURE DOCUMENTATION

**Document Version:** 3.0 (Phase 4 Cart, Checkout, Delivery & Order Architecture)  
**System Classification:** Food-Tech E-Commerce, Order Lifecycle & Catalogue Platform  
**Target Deployment:** Vercel Serverless & Edge Network + Supabase PostgreSQL  

---

## 1. System Overview

Empress Delicacies is a commercial-grade food ordering platform crafted with an editorial luxury visual identity. The system provides customer-facing menu exploration, customized dish ordering, Nigerian delivery routing, and administrative order intake and catalogue governance.

---

## 2. Technical Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) | Fast server components, streaming metadata, partial prerendering, and optimized image processing. |
| **UI Library** | React 19 | Modern hooks, transitions, and concurrent rendering features. |
| **Database** | Supabase PostgreSQL | Relational integrity, UUID keys, foreign key cascading, and Row-Level Security (RLS). |
| **Styling** | Tailwind CSS 4 | Utility-first CSS configured with custom color tokens: deep burgundy, warm ivory, and champagne gold. |
| **Animations** | Motion (Framer Motion) | Micro-interactions, smooth layout transitions, drawer slide-overs, and image zooms. |
| **Icons** | Lucide React | Clean, consistent vector icon set. |
| **State Management** | React Context + LocalStorage | Resilient offline-ready shopping cart with schema versioning (`empress_cart_v2`). |

---

## 3. Data Model & PostgreSQL Schema

All database tables are versioned in `supabase/migrations/`:
- `20261115_catalogue_schema.sql`: Categories, Products, Images, Variants, Add-on Groups, Add-ons.
- `20261116_orders_checkout_schema.sql`: Orders, Order Items, Order Item Add-ons, Coupons, Delivery Zones.

```
       +--------------------+
       |   delivery_zones   |
       +--------------------+
                 | 1
                 |
                 | *
       +--------------------+          +--------------------+
       |       orders       | -------- |      coupons       |
       +--------------------+ 1      * +--------------------+
                 | 1
                 |
                 | *
       +--------------------+
       |    order_items     | (Immutable Historical Snapshots)
       +--------------------+
                 | 1
                 |
                 | *
       +--------------------+
       |  order_item_addons |
       +--------------------+
```

### Monetary Conventions
- **Integer Minor Units:** All monetary amounts are stored as integer `bigint` kobo in PostgreSQL and `number` in TypeScript (`100 kobo = 1 NGN`).
- Zero floating-point decimals prevent rounding discrepancies across line items, quantity multipliers, delivery fees, and coupons.
- Display helpers: `formatKobo(kobo, currency = "NGN")` formats integers into localized currency strings (e.g. `₦4,500`).

---

## 4. Checkout & Order Lifecycle Pipeline

When checkout is submitted:
1. **Server-Side Validation:** The server reads active dishes from the catalogue service, verifies product availability, validates portion variants and add-on selections, and calculates the exact subtotal.
2. **Delivery Eligibility & Fee:** The customer's zone is checked against configured delivery zones in Lagos. If `pickup` is selected, delivery fees are forced to 0.
3. **Discount Engine:** The server validates coupon codes, expiry dates, and minimum order requirements, capping discounts at order subtotal.
4. **Idempotency Key:** If an identical client idempotency key is submitted twice within a retry window, the existing order reference is returned safely without duplicate database records.
5. **Immutable Snapshot Creation:** Item names, SKUs, images, portion names, unit prices, and applied extras are captured permanently in `order_items` and `order_item_addons`. Future catalogue changes never mutate historical orders.
6. **Order Reservation:** Order status is set to `received`, and payment status is initialized to `unpaid`.

---

## 5. Security & Access Control

- **Anti-Tampering:** Totals submitted by the client are strictly ignored; all monetary totals are computed server-side.
- **Unguessable Access Tokens:** Guest orders are assigned high-entropy tokens (`crypto.randomBytes(24)`). Customers retrieve order records via token or verified phone number match, preventing sequential ID enumeration and IDOR vulnerabilities.
- **Row Level Security (RLS):**
  - Public `SELECT` allowed on active delivery zones and coupons.
  - Customers can read only their own orders via verified session or access token.
  - Admin operations restricted to authenticated service roles.
