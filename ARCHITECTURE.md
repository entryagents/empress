# EMPRESS DELICACIES — ARCHITECTURE DOCUMENTATION

**Document Version:** 2.0 (Phase 3 Catalogue & Product Management)  
**System Classification:** Food-Tech E-Commerce & Catalogue Management Platform  
**Target Deployment:** Vercel Serverless & Edge Network + Supabase PostgreSQL  

---

## 1. System Overview

Empress Delicacies is a commercial-grade food ordering platform crafted with an editorial luxury visual identity. The system provides customer-facing menu exploration, customized dish ordering, and administrative inventory and catalogue governance.

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

All catalogue tables are defined in `supabase/migrations/20261115_catalogue_schema.sql`.

```
           +--------------------+
           |     categories     |
           +--------------------+
                     | 1
                     |
                     | *
           +--------------------+
           |      products      |
           +--------------------+
           /         |          \
          / 1        | 1         \ 1
         /           |            \
        *            *             *
+---------------+ +------------------+ +-----------------------+
|product_images | | product_variants | |  product_addon_groups |
+---------------+ +------------------+ +-----------------------+
                                                   | 1
                                                   |
                                                   | *
                                       +-----------------------+
                                       |    product_addons     |
                                       +-----------------------+
```

### Monetary Conventions
- **Integer Minor Units:** All monetary amounts are stored as integer `bigint` kobo in PostgreSQL and `number` in TypeScript (`100 kobo = 1 NGN`).
- Zero floating-point decimals prevent rounding discrepancies across line items, quantity multipliers, and tax calculations.
- Display helpers: `formatKobo(kobo, currency = "NGN")` formats integers into localized currency strings (e.g. `₦4,500`).

---

## 4. Data Access Layer (DAL) Architecture

The application abstracts database communication through `src/lib/catalogue/service.ts`:
1. **Supabase Integration:** Uses `@supabase/supabase-js` clients:
   - `getSupabaseServerClient()`: Authenticated server client for reading public data under RLS.
   - `getSupabaseAdminClient()`: Service role client for administrative mutations and schema seeding.
2. **Resilient In-Memory Fallback:** When database environment variables are unset (or during initial local testing), the service seamlessly operates on an in-memory runtime store initialized from canonical seed data (`SEED_CATEGORIES`, `SEED_PRODUCTS`).
3. **Data Integrity Guards:**
   - Soft-delete deletion protection (`archiveCategory` blocks archiving if active dishes belong to the category).
   - Non-destructive dish archiving (`is_archived = true`) protects historical order bags.

---

## 5. Security & Access Control

- **Row Level Security (RLS):**
  - Public `SELECT` allowed on `categories` and `products` where `is_archived = false` and `is_published = true`.
  - Public `SELECT` allowed on `product_images`, `product_variants`, `product_addon_groups`, and `product_addons` linked to active products.
  - Admin `ALL` (INSERT, UPDATE, DELETE) restricted to authenticated service roles.
- **Image Safety:** 100% authentic photography licensed under CC0 / CC BY / CC BY-SA with full photographer credits. Zero unverified external assets or AI artifacts.
