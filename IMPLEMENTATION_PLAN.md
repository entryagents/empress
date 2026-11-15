# EMPRESS DELICACIES — ARCHITECTURE & IMPLEMENTATION PLAN

## Overview
Empress Delicacies is an enterprise food-tech platform built for scale, performance, and international-grade art direction. This document outlines the architectural decisions, design tokens, complete file manifest, and roadmap for Phase 2.

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
- **Fluid Scale:**
  - Display: `clamp(3.25rem, 9.5vw + 0.5rem, 9rem)`
  - H1: `clamp(2.5rem, 5vw + 1rem, 5.5rem)`
  - H2: `clamp(2rem, 3.4vw + 1rem, 4rem)`
  - H3: `clamp(1.5rem, 1.4vw + 1rem, 2.25rem)`

---

## 2. File Manifest

```
empress/
├── public/
│   └── images/
│       └── food/
│           ├── chicken.jpg               (Real photo - Max's Roasted Chicken, CC BY 2.0)
│           ├── chinese-rice.jpg          (Real photo - King prawns fried rice, CC0)
│           ├── corn-dogs.jpg             (Real photo - Corn dog, CC0)
│           ├── philly-cheesesteak.jpg    (Real photo - Cheesesteak, CC BY 2.0)
│           ├── pork-chops.jpg            (Real photo - Longhorn Cowboy Pork Chops, CC0)
│           ├── shawarma.jpg              (Real photo - Chicken Shawarma Wrap, CC0)
│           ├── small-chops.jpg           (Real photo - Meat pie samosa & spring roll, CC0)
│           ├── stir-fried-noodles.jpg    (Real photo - Shrimp Pad Thai, CC BY-SA 4.0)
│           ├── tilapia.jpg               (Real photo - Grilled Tilapia, CC BY-SA 4.0)
│           └── turkey.jpg                (Real photo - Roast turkey dinner, CC BY-SA 4.0)
├── src/
│   ├── app/
│   │   ├── credits/
│   │   │   └── page.tsx                  (Image credits and attribution registry)
│   │   ├── order/
│   │   │   └── page.tsx                  (Dedicated checkout and order review)
│   │   ├── globals.css                   (Tailwind v4 tokens, font variables, utility layers)
│   │   ├── layout.tsx                    (Root layout with providers, navbar, footer, metadata)
│   │   └── page.tsx                      (Homepage assembling all 9 sections)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── cart-drawer.tsx           (Slide-over accessible cart drawer)
│   │   │   ├── copyright-year.tsx        (Cached copyright year component)
│   │   │   ├── footer.tsx                (Complete business footer with hours & links)
│   │   │   ├── logo.tsx                  (Arch monogram and brand typography)
│   │   │   └── navbar.tsx                (Responsive header, mobile overlay, cart trigger)
│   │   ├── sections/
│   │   │   ├── categories.tsx            (SECTION 03 - Category accordion)
│   │   │   ├── cta.tsx                   (SECTION 08 - Final conversion CTA)
│   │   │   ├── delivery-pickup.tsx       (Fulfillment cards for delivery & pickup)
│   │   │   ├── gallery.tsx               (SECTION 06 - Bento gallery with modal lightbox)
│   │   │   ├── hero.tsx                  (SECTION 02 - Editorial hero composition)
│   │   │   ├── reviews.tsx               (SECTION 07 - Customer testimonials)
│   │   │   ├── signature.tsx             (SECTION 04 - 10-dish product cards with add-to-cart)
│   │   │   └── story.tsx                 (SECTION 05 - The Empress Experience brand story)
│   │   ├── ui/
│   │   │   ├── button.tsx                (CVA button and button link variants)
│   │   │   ├── food-image.tsx            (Next.js optimized image wrapper)
│   │   │   ├── reveal.tsx                (Motion scroll and image entrance reveals)
│   │   │   └── section-heading.tsx       (Standardized eyebrow, serif heading, subtitle)
│   │   └── providers.tsx                 (MotionConfig and CartProvider setup)
│   ├── config/
│   │   ├── images.ts                     (Central photo registry with attribution and metadata)
│   │   └── site.ts                       (Brand constants, routing table, contact, hours)
│   ├── data/
│   │   └── catalogue.ts                  (6 categories, 10 initial catalogue products, benchmark pricing)
│   └── lib/
│       ├── cart-context.tsx              (Client-side state & localStorage persistence)
│       └── utils.ts                      (clsx + twMerge utility)
├── IMPLEMENTATION_PLAN.md
├── PROJECT_STATUS.md
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Phase 2 Roadmap & Transition Plan

1. **Database & Schema (Supabase / PostgreSQL):**
   - Tables: `categories`, `products`, `orders`, `order_items`, `customers`, `delivery_zones`.
   - Replace static `catalogue.ts` with server-rendered React Server Components fetching from Supabase.
2. **Bach's Payment API Integration:**
   - Server Actions / Route Handlers to initialize payment sessions with Bach's API.
   - Webhook verification for completed transactions.
3. **Live Inventory & Pricing Engine:**
   - Admin ability to toggle dish availability in real time.
   - Dynamic delivery fees based on delivery hub zones.
4. **Kitchen Display & Order Management:**
   - Real-time order queue for kitchen staff (New, Preparing, Dispatched, Ready for Pickup).
5. **Customer Accounts & Authentication:**
   - SMS / Magic link login for recurring orders and saved addresses.
