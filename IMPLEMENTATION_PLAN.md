# EMPRESS DELICACIES — ARCHITECTURE & IMPLEMENTATION PLAN

## Overview
Empress Delicacies is an enterprise food-tech platform built for scale, performance, and international-grade art direction. This document outlines the architectural decisions, design tokens, complete file manifest, and roadmap across development phases.

---

## 1. Visual Identity & Design System Tokens

### Palette
- **Deep Burgundy (Ink & Backgrounds):**
  - `--color-wine-950`: `#200510` (Primary deep dark contrast)
  - `--color-wine-900`: `#340a18` (Primary brand container tone)
  - `--color-wine-800`: `#4a1024` (Card accents and interactive buttons)
  - `--color-wine-700`: `#621831` (Ambient radial illumination)
  - `--color-wine-600`: `#7d2440` (Italic typographic emphasis)
- **Warm Ivory / Cream (Surface & Paper):**
  - `--color-ivory-50`: `#fbf7ef` (Primary light canvas)
  - `--color-ivory-100`: `#f5eee1` (Secondary light background)
  - `--color-ivory-200`: `#eadfca` (Borders and muted panels)
  - `--color-ivory-300`: `#d9c9aa` (Divider lines)
- **Subtle Champagne Gold (Accent & Monogram):**
  - `--color-champagne-300`: `#e6cf9f` (Italic highlight)
  - `--color-champagne-400`: `#d4b377` (Primary button and emblem accent)
  - `--color-champagne-500`: `#bb9654` (Eyebrow text and active indicators)

### Typography
- **Serif (Editorial):** `Fraunces` (Google Font with optical sizing, soft axes, and true italics)
- **Sans-serif (Modern UI):** `Manrope` (Clean geometric grotesk for readability)

---

## 2. Complete File Manifest

```
empress/
├── public/images/food/                   (10 authentic food photos under CC0 / CC BY / CC BY-SA)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── actions.ts                (Server actions for catalogue & category governance)
│   │   │   ├── categories/               (Category list & create/edit routes)
│   │   │   ├── layout.tsx                (Staff portal navigation layout)
│   │   │   ├── menu/                     (Dish catalogue management & creation routes)
│   │   │   └── orders/                   (Incoming orders intake board)
│   │   ├── credits/page.tsx              (Licensing and attribution registry)
│   │   ├── menu/
│   │   │   ├── [slug]/                   (Product detail & customization configurator)
│   │   │   ├── menu-client.tsx           (Interactive public menu catalogue explorer)
│   │   │   └── page.tsx                  (Public catalogue server route)
│   │   ├── order/
│   │   │   ├── actions.ts                (Server actions for cart validation, checkout & lookup)
│   │   │   ├── checkout-client.tsx       (Mobile-first Nigerian address & checkout client)
│   │   │   ├── confirmation/             (Secure order confirmation & lookup page)
│   │   │   └── page.tsx                  (Server component passing active delivery zones)
│   │   ├── layout.tsx                    (Root layout with providers, navbar, footer)
│   │   └── page.tsx                      (Homepage assembling all 9 sections)
│   ├── components/
│   │   ├── layout/                       (cart-drawer, navbar, footer, logo)
│   │   ├── sections/                     (hero, categories, signature, story, gallery, reviews, cta)
│   │   └── ui/                           (button, food-image, reveal, section-heading)
│   ├── lib/
│   │   ├── catalogue/                    (seed-data, resilient DAL service)
│   │   ├── order/
│   │   │   ├── config.ts                 (Lagos delivery zones, coupons, central kitchen location)
│   │   │   └── service.ts                (Cart validation, price recalculation, order creation)
│   │   ├── supabase/                     (client, server, admin Supabase factories)
│   │   └── cart-context.tsx              (LocalStorage client state with composite keys)
│   └── types/
│       ├── catalogue.ts                  (Product, Category, Variant, Addon interfaces)
│       └── order.ts                      (Order, OrderItem, Coupon, DeliveryZone interfaces)
├── supabase/migrations/
│   ├── 20261115_catalogue_schema.sql     (PostgreSQL schema for categories & products)
│   └── 20261116_orders_checkout_schema.sql (PostgreSQL schema for orders, items, coupons, zones)
├── scripts/
│   ├── test-catalogue.mjs                (Catalogue DAL & monetary logic test suite)
│   └── test-checkout.ts                  (Checkout, idempotency, coupon & Nigerian address test suite)
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
└── PROJECT_STATUS.md
```

---

## 3. Development Roadmap

- **Phase 1 (Completed):** Visual foundation, brand identity, 9 homepage sections, authentic photography, interactive cart drawer.
- **Phase 3 (Completed):** Supabase database schema, dynamic `/menu`, product detail configurator (`/menu/[slug]`), and admin portal (`/admin/menu`, `/admin/categories`).
- **Phase 4 (Completed):** Shopping cart validation, mobile-first checkout, Nigerian delivery details, coupon engine, order reservation snapshots, order confirmation, and admin incoming orders intake (`/admin/orders`).
- **Phase 5 (Next):** Bach's Payment API integration (card payment intent, virtual bank accounts, webhook handling, and payment confirmation transitions).
- **Phase 6:** Live kitchen display system (KDS) order board and driver pickup dispatch tracking.
