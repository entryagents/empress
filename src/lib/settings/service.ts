import type {
  BusinessSettings,
  HomepageCMSContent,
  BusinessAvailabilityStatus,
} from "@/types/settings";
import type { DeliveryZone } from "@/types/order";
import { getDb } from "@/lib/db";

// Default configuration for Empress Delicacies located in Delta State, Nigeria
let runtimeSettings: BusinessSettings = {
  id: "default",
  business_name: "Empress Delicacies",
  logo_url: null,
  description:
    "Premium handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties.",
  phone: "+234 800 000 0000",
  whatsapp_number: "+234 800 000 0000",
  email: "orders@empressdelicacies.ng",
  address: "Empress Delicacies Culinary Studio, Delta State, Nigeria",
  country: "Nigeria",
  state: "Delta State",
  city: "Warri",
  currency: "NGN",
  currency_symbol: "₦",
  opening_time: "07:00",
  closing_time: "20:00",
  operating_days: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  is_temporarily_closed: false,
  temporary_closure_reason: null,
  allow_ordering_override: false,
  delivery_enabled: true,
  pickup_enabled: true,
  pickup_address: "Empress Delicacies Culinary Studio, Delta State, Nigeria",
  pickup_instructions:
    "Present your order reference number to the concierge upon arrival for expedited collection.",
  estimated_preparation_minutes: 35,
  updated_at: new Date().toISOString(),
};

// 5 Specified Service Locations: Warri, Asaba, Ughelli, Benin, Abraka
export const DEFAULT_LOCATIONS_ZONES: DeliveryZone[] = [
  {
    id: "zone-warri",
    name: "Warri & Effurun Hub",
    state: "Delta State",
    city: "Warri",
    areas: [
      "Airport Road",
      "Effurun GRA",
      "PTI Road",
      "Enerhen",
      "Deco Road",
      "Jakpa Road",
      "Refinery Road",
      "NPA Expressway",
    ],
    fee_kobo: 200000, // ₦2,000
    estimated_minutes_min: 25,
    estimated_minutes_max: 45,
    is_active: true,
    display_order: 1,
  },
  {
    id: "zone-asaba",
    name: "Asaba Central & Capital Territory",
    state: "Delta State",
    city: "Asaba",
    areas: [
      "GRA Phase 1",
      "GRA Phase 2",
      "Nnebisi Road",
      "Okpanam Road",
      "Summit Road",
      "Interbau Roundabout",
      "DBS Road",
    ],
    fee_kobo: 250000, // ₦2,500
    estimated_minutes_min: 30,
    estimated_minutes_max: 50,
    is_active: true,
    display_order: 2,
  },
  {
    id: "zone-ughelli",
    name: "Ughelli Metropolis",
    state: "Delta State",
    city: "Ughelli",
    areas: [
      "Market Road",
      "Isoko Road",
      "Otovwodo Junction",
      "Post Office Road",
      "Afiesere Road",
      "Ekuigbo",
    ],
    fee_kobo: 250000, // ₦2,500
    estimated_minutes_min: 35,
    estimated_minutes_max: 55,
    is_active: true,
    display_order: 3,
  },
  {
    id: "zone-benin",
    name: "Benin City Corridor",
    state: "Edo State",
    city: "Benin",
    areas: [
      "Airport Road GRA",
      "Sapele Road",
      "Ring Road",
      "Akpakpava Road",
      "Ekenwan Road",
      "Uselu",
    ],
    fee_kobo: 350000, // ₦3,500
    estimated_minutes_min: 45,
    estimated_minutes_max: 75,
    is_active: true,
    display_order: 4,
  },
  {
    id: "zone-abraka",
    name: "Abraka University Town",
    state: "Delta State",
    city: "Abraka",
    areas: [
      "DELSU Main Campus",
      "Site 2 & Site 3",
      "Police Station Road",
      "Old Sapele Road",
      "Ethiope Riverfront",
    ],
    fee_kobo: 200000, // ₦2,000
    estimated_minutes_min: 25,
    estimated_minutes_max: 45,
    is_active: true,
    display_order: 5,
  },
];

let runtimeDeltaDeliveryZones: DeliveryZone[] = [...DEFAULT_LOCATIONS_ZONES];

let runtimeCMSContent: HomepageCMSContent = {
  id: "default",
  hero_eyebrow: "Haute Cuisine & Delicacies",
  hero_title_line1: "Royal Taste,",
  hero_title_line2: "Modern Sophistication.",
  hero_description:
    "Handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties prepared fresh in Delta State for delivery and customer pickup.",
  hero_cta_text: "Explore Menu",
  hero_cta_destination: "/order",
  hero_image_url: null,
  hero_secondary_image_url: null,
  story_heading: "The Empress Culinary Experience",
  story_paragraphs: [
    "Empress Delicacies was founded on an unapologetic devotion to food excellence. Every shawarma is packed with premium marinated meats and bespoke spices.",
    "From our sizzling stir-fried noodles and grilled specialties to handcrafted small chops, we elevate everyday dining into memorable feasts across Delta State.",
  ],
  story_quote: "We do not merely prepare meals; we curate culinary indulgence.",
  story_image_url: null,
  gallery_images: [],
  testimonials: [],
  footer_tagline: "Good Food. Unforgettable Moments.",
  footer_description:
    "Handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties in Delta State, Nigeria.",
  updated_at: new Date().toISOString(),
};

/**
 * ----------------------------------------------------------------------------
 * BUSINESS SETTINGS MANAGEMENT
 * ----------------------------------------------------------------------------
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM business_settings WHERE id = 'default' LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return rows[0] as BusinessSettings;
      }
    } catch (e) {
      console.warn("Neon getBusinessSettings failed, using memory:", e);
    }
  }
  return { ...runtimeSettings };
}

export async function updateBusinessSettings(
  input: Partial<BusinessSettings>
): Promise<BusinessSettings> {
  const now = new Date().toISOString();
  const updated: BusinessSettings = {
    ...runtimeSettings,
    ...input,
    country: "Nigeria",
    state: input.state || "Delta State",
    currency: "NGN",
    currency_symbol: "₦",
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO business_settings (
          id, business_name, logo_url, description, phone, whatsapp_number, email,
          address, country, state, city, currency, currency_symbol, opening_time, closing_time,
          operating_days, is_temporarily_closed, temporary_closure_reason, allow_ordering_override,
          delivery_enabled, pickup_enabled, pickup_address, pickup_instructions, estimated_preparation_minutes, updated_at
        ) VALUES (
          'default', ${updated.business_name}, ${updated.logo_url || null}, ${updated.description || null},
          ${updated.phone}, ${updated.whatsapp_number || null}, ${updated.email}, ${updated.address},
          ${updated.country}, ${updated.state}, ${updated.city}, 'NGN', '₦',
          ${updated.opening_time}, ${updated.closing_time}, ${JSON.stringify(updated.operating_days)}::jsonb,
          ${updated.is_temporarily_closed}, ${updated.temporary_closure_reason || null}, ${updated.allow_ordering_override},
          ${updated.delivery_enabled}, ${updated.pickup_enabled}, ${updated.pickup_address || null},
          ${updated.pickup_instructions || null}, ${updated.estimated_preparation_minutes}, ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          logo_url = EXCLUDED.logo_url,
          description = EXCLUDED.description,
          phone = EXCLUDED.phone,
          whatsapp_number = EXCLUDED.whatsapp_number,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          state = EXCLUDED.state,
          city = EXCLUDED.city,
          opening_time = EXCLUDED.opening_time,
          closing_time = EXCLUDED.closing_time,
          operating_days = EXCLUDED.operating_days,
          is_temporarily_closed = EXCLUDED.is_temporarily_closed,
          temporary_closure_reason = EXCLUDED.temporary_closure_reason,
          allow_ordering_override = EXCLUDED.allow_ordering_override,
          delivery_enabled = EXCLUDED.delivery_enabled,
          pickup_enabled = EXCLUDED.pickup_enabled,
          pickup_address = EXCLUDED.pickup_address,
          pickup_instructions = EXCLUDED.pickup_instructions,
          estimated_preparation_minutes = EXCLUDED.estimated_preparation_minutes,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        runtimeSettings = rows[0] as BusinessSettings;
        return runtimeSettings;
      }
    } catch (e) {
      console.warn("Neon updateBusinessSettings failed, using memory:", e);
    }
  }

  runtimeSettings = updated;
  return updated;
}

/**
 * ----------------------------------------------------------------------------
 * DELIVERY ZONES (WARRI, ASABA, UGHELLI, BENIN, ABRAKA)
 * ----------------------------------------------------------------------------
 */
export async function getAdminDeliveryZones(): Promise<DeliveryZone[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM delivery_zones ORDER BY display_order ASC;
      `;
      if (rows && rows.length > 0) {
        return rows as DeliveryZone[];
      }
    } catch (e) {
      console.warn("Neon getAdminDeliveryZones failed, using memory:", e);
    }
  }
  return [...runtimeDeltaDeliveryZones];
}

export async function saveDeliveryZone(
  zone: Omit<DeliveryZone, "id"> & { id?: string }
): Promise<DeliveryZone> {
  const id = zone.id || `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanZone: DeliveryZone = {
    ...zone,
    id,
    state: zone.state || "Delta State",
    fee_kobo: Math.max(0, Math.round(Number(zone.fee_kobo) || 0)),
    areas: Array.isArray(zone.areas) ? zone.areas.map((a) => a.trim()).filter(Boolean) : [],
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO delivery_zones (
          id, name, state, city, areas, fee_kobo, estimated_minutes_min, estimated_minutes_max, is_active, display_order, created_at, updated_at
        ) VALUES (
          ${id}, ${cleanZone.name}, ${cleanZone.state}, ${cleanZone.city},
          ${JSON.stringify(cleanZone.areas)}::jsonb, ${cleanZone.fee_kobo},
          ${cleanZone.estimated_minutes_min}, ${cleanZone.estimated_minutes_max},
          ${cleanZone.is_active}, ${cleanZone.display_order}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          state = EXCLUDED.state,
          city = EXCLUDED.city,
          areas = EXCLUDED.areas,
          fee_kobo = EXCLUDED.fee_kobo,
          estimated_minutes_min = EXCLUDED.estimated_minutes_min,
          estimated_minutes_max = EXCLUDED.estimated_minutes_max,
          is_active = EXCLUDED.is_active,
          display_order = EXCLUDED.display_order,
          updated_at = NOW()
        RETURNING *;
      `;
      if (rows && rows.length > 0) return rows[0] as DeliveryZone;
    } catch (e) {
      console.warn("Neon saveDeliveryZone failed, using memory:", e);
    }
  }

  const idx = runtimeDeltaDeliveryZones.findIndex((z) => z.id === id);
  if (idx >= 0) {
    runtimeDeltaDeliveryZones[idx] = cleanZone;
  } else {
    runtimeDeltaDeliveryZones.push(cleanZone);
  }
  return cleanZone;
}

export async function deleteDeliveryZone(id: string): Promise<boolean> {
  const sql = getDb();
  if (sql) {
    try {
      await sql`DELETE FROM delivery_zones WHERE id = ${id};`;
    } catch (e) {
      console.warn("Neon deleteDeliveryZone failed:", e);
    }
  }
  runtimeDeltaDeliveryZones = runtimeDeltaDeliveryZones.filter((z) => z.id !== id);
  return true;
}

/**
 * ----------------------------------------------------------------------------
 * HOMEPAGE CMS
 * ----------------------------------------------------------------------------
 */
export async function getHomepageCMSContent(): Promise<HomepageCMSContent> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM homepage_cms WHERE id = 'default' LIMIT 1;`;
      if (rows && rows.length > 0) return rows[0] as HomepageCMSContent;
    } catch (e) {
      console.warn("Neon getHomepageCMSContent failed, using memory:", e);
    }
  }
  return { ...runtimeCMSContent };
}

export async function updateHomepageCMSContent(
  input: Partial<HomepageCMSContent>
): Promise<HomepageCMSContent> {
  const now = new Date().toISOString();
  const updated: HomepageCMSContent = {
    ...runtimeCMSContent,
    ...input,
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO homepage_cms (
          id, hero_eyebrow, hero_title_line1, hero_title_line2, hero_description, hero_cta_text, hero_cta_destination,
          hero_image_url, hero_secondary_image_url, story_heading, story_paragraphs, story_quote, story_image_url,
          gallery_images, testimonials, footer_tagline, footer_description, updated_at
        ) VALUES (
          'default', ${updated.hero_eyebrow}, ${updated.hero_title_line1}, ${updated.hero_title_line2},
          ${updated.hero_description}, ${updated.hero_cta_text}, ${updated.hero_cta_destination},
          ${updated.hero_image_url || null}, ${updated.hero_secondary_image_url || null}, ${updated.story_heading},
          ${JSON.stringify(updated.story_paragraphs)}::jsonb, ${updated.story_quote}, ${updated.story_image_url || null},
          ${JSON.stringify(updated.gallery_images)}::jsonb, ${JSON.stringify(updated.testimonials)}::jsonb,
          ${updated.footer_tagline}, ${updated.footer_description}, ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          hero_eyebrow = EXCLUDED.hero_eyebrow,
          hero_title_line1 = EXCLUDED.hero_title_line1,
          hero_title_line2 = EXCLUDED.hero_title_line2,
          hero_description = EXCLUDED.hero_description,
          hero_cta_text = EXCLUDED.hero_cta_text,
          hero_cta_destination = EXCLUDED.hero_cta_destination,
          hero_image_url = EXCLUDED.hero_image_url,
          hero_secondary_image_url = EXCLUDED.hero_secondary_image_url,
          story_heading = EXCLUDED.story_heading,
          story_paragraphs = EXCLUDED.story_paragraphs,
          story_quote = EXCLUDED.story_quote,
          story_image_url = EXCLUDED.story_image_url,
          gallery_images = EXCLUDED.gallery_images,
          testimonials = EXCLUDED.testimonials,
          footer_tagline = EXCLUDED.footer_tagline,
          footer_description = EXCLUDED.footer_description,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        runtimeCMSContent = rows[0] as HomepageCMSContent;
        return runtimeCMSContent;
      }
    } catch (e) {
      console.warn("Neon updateHomepageCMSContent failed, using memory:", e);
    }
  }

  runtimeCMSContent = updated;
  return updated;
}

export const getHomepageCMS = getHomepageCMSContent;
export const updateHomepageCMS = updateHomepageCMSContent;

/**
 * ----------------------------------------------------------------------------
 * BUSINESS AVAILABILITY
 * ----------------------------------------------------------------------------
 */
export async function getBusinessAvailability(): Promise<BusinessAvailabilityStatus> {
  const settings = await getBusinessSettings();

  const now = new Date();
  const lagosOffset = 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const lagosDate = new Date(utc + lagosOffset);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = days[lagosDate.getDay()];

  const pad = (n: number) => n.toString().padStart(2, "0");
  const currentTime = `${pad(lagosDate.getHours())}:${pad(lagosDate.getMinutes())}`;

  if (settings.is_temporarily_closed && !settings.allow_ordering_override) {
    return {
      isOpen: false,
      canAcceptOrders: false,
      reason: settings.temporary_closure_reason || "Currently closed for private culinary preparation.",
      isTemporarilyClosed: true,
      currentTimeLagos: currentTime,
      dayOfWeek: currentDay,
    };
  }

  const isOperatingDay = (settings.operating_days || []).includes(currentDay);
  const isOpenHours =
    currentTime >= settings.opening_time && currentTime <= settings.closing_time;

  const isOpen = isOperatingDay && isOpenHours;
  const canAcceptOrders = isOpen || settings.allow_ordering_override;

  return {
    isOpen,
    canAcceptOrders,
    reason: !isOpen
      ? `Hours: ${settings.opening_time} — ${settings.closing_time} (${settings.operating_days?.join(", ")})`
      : undefined,
    isTemporarilyClosed: settings.is_temporarily_closed,
    currentTimeLagos: currentTime,
    dayOfWeek: currentDay,
  };
}

export const checkBusinessAvailability = getBusinessAvailability;
