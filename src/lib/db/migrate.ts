import { neon } from "@neondatabase/serverless";

async function runMigration() {
  const connString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connString) {
    console.error("No DATABASE_URL or POSTGRES_URL provided.");
    process.exit(1);
  }

  const sql = neon(connString);
  console.log("Applying Empress Delicacies PostgreSQL Schema on Neon...");

  // 1. Better Auth Tables (User, Session, Account, Verification)
  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
      "image" TEXT,
      "role" TEXT NOT NULL DEFAULT 'customer',
      "username" TEXT UNIQUE,
      "phone" TEXT,
      "onboardingCompleted" BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "token" TEXT NOT NULL UNIQUE,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMPTZ,
      "refreshTokenExpiresAt" TIMESTAMPTZ,
      "scope" TEXT,
      "password" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 2. Customer Profile & Saved Addresses
  await sql`
    CREATE TABLE IF NOT EXISTS "customer_profiles" (
      "id" TEXT PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
      "email" TEXT NOT NULL,
      "full_name" TEXT NOT NULL,
      "phone" TEXT,
      "role" TEXT NOT NULL DEFAULT 'customer',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "customer_addresses" (
      "id" TEXT PRIMARY KEY,
      "customer_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "label" TEXT NOT NULL DEFAULT 'Home',
      "state" TEXT NOT NULL DEFAULT 'Delta State',
      "city" TEXT NOT NULL,
      "area" TEXT NOT NULL,
      "street_address" TEXT NOT NULL,
      "building_number" TEXT,
      "landmark" TEXT,
      "delivery_instructions" TEXT,
      "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 3. Catalogue: Categories, Products, Variants, Addons
  await sql`
    CREATE TABLE IF NOT EXISTS "categories" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "image_url" TEXT NOT NULL,
      "display_order" INT NOT NULL DEFAULT 0,
      "is_published" BOOLEAN NOT NULL DEFAULT TRUE,
      "is_archived" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "products" (
      "id" TEXT PRIMARY KEY,
      "category_id" TEXT NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "sku" TEXT,
      "short_description" TEXT NOT NULL,
      "full_description" TEXT,
      "base_price_kobo" BIGINT NOT NULL,
      "comparison_price_kobo" BIGINT,
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "is_initial_benchmark" BOOLEAN NOT NULL DEFAULT FALSE,
      "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,
      "is_available" BOOLEAN NOT NULL DEFAULT TRUE,
      "availability_status" TEXT NOT NULL DEFAULT 'available',
      "min_prep_time_minutes" INT NOT NULL DEFAULT 15,
      "max_prep_time_minutes" INT NOT NULL DEFAULT 35,
      "is_published" BOOLEAN NOT NULL DEFAULT TRUE,
      "is_archived" BOOLEAN NOT NULL DEFAULT FALSE,
      "display_order" INT NOT NULL DEFAULT 0,
      "ingredients" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "allergens" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "dietary_labels" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_images" (
      "id" TEXT PRIMARY KEY,
      "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "image_url" TEXT NOT NULL,
      "storage_path" TEXT,
      "alt_text" TEXT NOT NULL,
      "display_order" INT NOT NULL DEFAULT 0,
      "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_variants" (
      "id" TEXT PRIMARY KEY,
      "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "sku" TEXT,
      "price_adjustment_kobo" BIGINT NOT NULL DEFAULT 0,
      "explicit_price_kobo" BIGINT,
      "is_available" BOOLEAN NOT NULL DEFAULT TRUE,
      "display_order" INT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_addon_groups" (
      "id" TEXT PRIMARY KEY,
      "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "min_selections" INT NOT NULL DEFAULT 0,
      "max_selections" INT NOT NULL DEFAULT 1,
      "is_required" BOOLEAN NOT NULL DEFAULT FALSE,
      "display_order" INT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "product_addons" (
      "id" TEXT PRIMARY KEY,
      "addon_group_id" TEXT NOT NULL REFERENCES "product_addon_groups"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "price_kobo" BIGINT NOT NULL DEFAULT 0,
      "is_available" BOOLEAN NOT NULL DEFAULT TRUE,
      "display_order" INT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 4. Delivery Zones & Business Settings
  await sql`
    CREATE TABLE IF NOT EXISTS "delivery_zones" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "state" TEXT NOT NULL DEFAULT 'Delta State',
      "city" TEXT NOT NULL,
      "areas" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "fee_kobo" BIGINT NOT NULL DEFAULT 0,
      "estimated_minutes_min" INT NOT NULL DEFAULT 20,
      "estimated_minutes_max" INT NOT NULL DEFAULT 45,
      "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
      "display_order" INT NOT NULL DEFAULT 0,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "business_settings" (
      "id" TEXT PRIMARY KEY,
      "business_name" TEXT NOT NULL DEFAULT 'Empress Delicacies',
      "logo_url" TEXT,
      "description" TEXT,
      "phone" TEXT NOT NULL DEFAULT '+234 800 000 0000',
      "whatsapp_number" TEXT,
      "email" TEXT NOT NULL DEFAULT 'orders@empressdelicacies.ng',
      "address" TEXT NOT NULL DEFAULT 'Delta State, Nigeria',
      "country" TEXT NOT NULL DEFAULT 'Nigeria',
      "state" TEXT NOT NULL DEFAULT 'Delta State',
      "city" TEXT NOT NULL DEFAULT 'Warri',
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "currency_symbol" TEXT NOT NULL DEFAULT '₦',
      "opening_time" TEXT NOT NULL DEFAULT '08:00',
      "closing_time" TEXT NOT NULL DEFAULT '22:00',
      "operating_days" JSONB NOT NULL DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]'::jsonb,
      "is_temporarily_closed" BOOLEAN NOT NULL DEFAULT FALSE,
      "temporary_closure_reason" TEXT,
      "allow_ordering_override" BOOLEAN NOT NULL DEFAULT TRUE,
      "delivery_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
      "pickup_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
      "pickup_address" TEXT,
      "pickup_instructions" TEXT,
      "estimated_preparation_minutes" INT NOT NULL DEFAULT 25,
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "homepage_cms" (
      "id" TEXT PRIMARY KEY,
      "hero_eyebrow" TEXT NOT NULL,
      "hero_title_line1" TEXT NOT NULL,
      "hero_title_line2" TEXT NOT NULL,
      "hero_description" TEXT NOT NULL,
      "hero_cta_text" TEXT NOT NULL,
      "hero_cta_destination" TEXT NOT NULL,
      "hero_image_url" TEXT,
      "hero_secondary_image_url" TEXT,
      "story_heading" TEXT NOT NULL,
      "story_paragraphs" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "story_quote" TEXT NOT NULL,
      "story_image_url" TEXT,
      "gallery_images" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "testimonials" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "footer_tagline" TEXT NOT NULL,
      "footer_description" TEXT NOT NULL,
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 5. Orders & Order Items
  await sql`
    CREATE TABLE IF NOT EXISTS "orders" (
      "id" TEXT PRIMARY KEY,
      "order_reference" TEXT NOT NULL UNIQUE,
      "secure_access_token" TEXT NOT NULL,
      "customer_name" TEXT NOT NULL,
      "customer_email" TEXT NOT NULL,
      "customer_phone" TEXT NOT NULL,
      "user_id" TEXT REFERENCES "user"("id") ON DELETE SET NULL,
      "fulfillment_type" TEXT NOT NULL DEFAULT 'delivery',
      "delivery_state" TEXT,
      "delivery_city" TEXT,
      "delivery_area" TEXT,
      "delivery_street_address" TEXT,
      "delivery_building_number" TEXT,
      "delivery_landmark" TEXT,
      "delivery_instructions" TEXT,
      "delivery_zone_id" TEXT,
      "pickup_location" TEXT,
      "pickup_instructions" TEXT,
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "subtotal_kobo" BIGINT NOT NULL DEFAULT 0,
      "delivery_fee_kobo" BIGINT NOT NULL DEFAULT 0,
      "discount_kobo" BIGINT NOT NULL DEFAULT 0,
      "coupon_code" TEXT,
      "coupon_id" TEXT,
      "total_kobo" BIGINT NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'received',
      "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
      "bachs_checkout_id" TEXT,
      "bachs_payment_id" TEXT,
      "bachs_checkout_url" TEXT,
      "payment_completed_at" TIMESTAMPTZ,
      "special_instructions" TEXT,
      "admin_notes" TEXT,
      "assigned_driver_id" TEXT,
      "delivery_assigned_at" TIMESTAMPTZ,
      "cancellation_reason" TEXT,
      "cancelled_at" TIMESTAMPTZ,
      "cancelled_by" TEXT,
      "idempotency_key" TEXT UNIQUE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "order_items" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "product_id" TEXT NOT NULL,
      "product_name" TEXT NOT NULL,
      "product_sku" TEXT,
      "product_image_url" TEXT NOT NULL,
      "category_name" TEXT NOT NULL,
      "variant_id" TEXT,
      "variant_name" TEXT,
      "variant_price_adjustment_kobo" BIGINT NOT NULL DEFAULT 0,
      "base_price_kobo" BIGINT NOT NULL DEFAULT 0,
      "addons_total_kobo" BIGINT NOT NULL DEFAULT 0,
      "unit_price_kobo" BIGINT NOT NULL DEFAULT 0,
      "quantity" INT NOT NULL DEFAULT 1,
      "total_price_kobo" BIGINT NOT NULL DEFAULT 0,
      "special_instructions" TEXT,
      "addons" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "order_status_history" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "order_reference" TEXT NOT NULL,
      "from_status" TEXT NOT NULL,
      "to_status" TEXT NOT NULL,
      "changed_by_user_id" TEXT,
      "changed_by_name" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 6. Payments and Webhook Audits
  await sql`
    CREATE TABLE IF NOT EXISTS "payments" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "order_reference" TEXT NOT NULL,
      "customer_email" TEXT NOT NULL,
      "amount_kobo" BIGINT NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "provider" TEXT NOT NULL DEFAULT 'bachs',
      "bachs_checkout_id" TEXT,
      "bachs_payment_id" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
      "id" TEXT PRIMARY KEY,
      "event_id" TEXT NOT NULL UNIQUE,
      "event_type" TEXT NOT NULL,
      "order_reference" TEXT,
      "status" TEXT NOT NULL,
      "raw_payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "processed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 7. Delivery Personnel & Fleet Dispatch
  await sql`
    CREATE TABLE IF NOT EXISTS "delivery_personnel" (
      "id" TEXT PRIMARY KEY,
      "full_name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "phone" TEXT NOT NULL,
      "vehicle_type" TEXT NOT NULL DEFAULT 'motorcycle',
      "vehicle_plate_number" TEXT,
      "status" TEXT NOT NULL DEFAULT 'available',
      "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
      "current_latitude" DOUBLE PRECISION,
      "current_longitude" DOUBLE PRECISION,
      "last_location_updated_at" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "delivery_assignments" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "order_reference" TEXT NOT NULL,
      "driver_id" TEXT NOT NULL REFERENCES "delivery_personnel"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'assigned',
      "assigned_by" TEXT,
      "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "accepted_at" TIMESTAMPTZ,
      "rejected_at" TIMESTAMPTZ,
      "rejection_reason" TEXT,
      "picked_up_at" TIMESTAMPTZ,
      "delivered_at" TIMESTAMPTZ,
      "failed_at" TIMESTAMPTZ,
      "failure_reason" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "delivery_location_updates" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "order_reference" TEXT NOT NULL,
      "driver_id" TEXT NOT NULL REFERENCES "delivery_personnel"("id") ON DELETE CASCADE,
      "latitude" DOUBLE PRECISION NOT NULL,
      "longitude" DOUBLE PRECISION NOT NULL,
      "heading" DOUBLE PRECISION,
      "speed_mps" DOUBLE PRECISION,
      "accuracy_meters" DOUBLE PRECISION,
      "is_simulated" BOOLEAN NOT NULL DEFAULT FALSE,
      "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 8. Reviews and Feedback
  await sql`
    CREATE TABLE IF NOT EXISTS "customer_reviews" (
      "id" TEXT PRIMARY KEY,
      "order_id" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
      "order_reference" TEXT NOT NULL,
      "product_id" TEXT,
      "product_name" TEXT,
      "user_id" TEXT,
      "customer_name" TEXT NOT NULL,
      "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      "review_text" TEXT NOT NULL,
      "image_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "moderated_by" TEXT,
      "moderated_at" TIMESTAMPTZ,
      "rejection_reason" TEXT,
      "admin_response" TEXT,
      "admin_responded_at" TIMESTAMPTZ,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "customer_feedback" (
      "id" TEXT PRIMARY KEY,
      "order_reference" TEXT,
      "customer_name" TEXT NOT NULL,
      "customer_email" TEXT NOT NULL,
      "customer_phone" TEXT,
      "category" TEXT NOT NULL,
      "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      "comments" TEXT NOT NULL,
      "admin_notes" TEXT,
      "is_resolved" BOOLEAN NOT NULL DEFAULT FALSE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 9. Notifications Log
  await sql`
    CREATE TABLE IF NOT EXISTS "notifications_log" (
      "id" TEXT PRIMARY KEY,
      "recipient" TEXT NOT NULL,
      "channel" TEXT NOT NULL, -- 'email' | 'sms'
      "subject" TEXT,
      "content" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'sent',
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log("Migration executed successfully!");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
