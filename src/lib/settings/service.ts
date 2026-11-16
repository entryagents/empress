import type {
  BusinessSettings,
  HomepageCMSContent,
  BusinessAvailabilityStatus,
} from "@/types/settings";
import type { DeliveryZone } from "@/types/order";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Default configuration for Empress Delicacies located in Delta State, Nigeria
let runtimeSettings: BusinessSettings = {
  id: "default",
  business_name: "Empress Delicacies",
  logo_url: null,
  description:
    "Premium handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties.",
  phone: "+234 800 000 0000",
  whatsapp_number: "+234 800 000 0000",
  email: "orders@empressdelicacies.com",
  address: "Empress Delicacies Culinary Studio, Delta State, Nigeria",
  country: "Nigeria",
  state: "Delta State",
  city: "Asaba",
  currency: "NGN",
  currency_symbol: "₦",
  opening_time: "10:00",
  closing_time: "22:00",
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

// Runtime Delivery Zones (Defaulting to Delta State towns/cities)
let runtimeDeltaDeliveryZones: DeliveryZone[] = [
  {
    id: "zone-asaba-central",
    name: "Asaba Central & GRA",
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
    fee_kobo: 150000, // ₦1,500
    estimated_minutes_min: 25,
    estimated_minutes_max: 45,
    is_active: true,
    display_order: 1,
  },
  {
    id: "zone-asaba-okpanam",
    name: "Okpanam & Ibusa Road Corridors",
    state: "Delta State",
    city: "Asaba",
    areas: ["Okpanam Town", "Midwifery", "Ibusa Road", "Core Area"],
    fee_kobo: 200000, // ₦2,000
    estimated_minutes_min: 35,
    estimated_minutes_max: 55,
    is_active: true,
    display_order: 2,
  },
  {
    id: "zone-warri-effurun",
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
    ],
    fee_kobo: 250000, // ₦2,500
    estimated_minutes_min: 30,
    estimated_minutes_max: 50,
    is_active: true,
    display_order: 3,
  },
];

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
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("id", "default")
        .single();
      if (!error && data) {
        return {
          ...data,
          state: data.state || "Delta State",
          country: data.country || "Nigeria",
          currency: "NGN",
        } as BusinessSettings;
      }
    } catch {
      // Fallback
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
    country: "Nigeria", // Fixed by business requirement
    state: "Delta State", // Default Delta State
    currency: "NGN", // Fixed NGN
    currency_symbol: "₦",
    updated_at: now,
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("business_settings")
        .upsert({ ...updated, id: "default" })
        .select()
        .single();
      if (!error && data) {
        runtimeSettings = data as BusinessSettings;
        return runtimeSettings;
      }
    } catch {
      // Fallback
    }
  }

  runtimeSettings = updated;
  return updated;
}

/**
 * ----------------------------------------------------------------------------
 * DELTA STATE DELIVERY ZONE MANAGEMENT
 * ----------------------------------------------------------------------------
 */

export async function getAdminDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as DeliveryZone[];
      }
    } catch {
      // Fallback
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
    state: "Delta State", // Enforced Delta State
    fee_kobo: Math.max(0, Math.round(Number(zone.fee_kobo) || 0)),
    areas: Array.isArray(zone.areas) ? zone.areas.map((a) => a.trim()).filter(Boolean) : [],
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_zones")
        .upsert(cleanZone)
        .select()
        .single();
      if (!error && data) {
        return data as DeliveryZone;
      }
    } catch {
      // Fallback
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

export async function deleteDeliveryZone(zoneId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("delivery_zones").delete().eq("id", zoneId);
    } catch {
      // Fallback
    }
  }
  runtimeDeltaDeliveryZones = runtimeDeltaDeliveryZones.filter((z) => z.id !== zoneId);
  return true;
}

/**
 * Validates whether a customer delivery address falls into an active Delta State zone
 */
export async function matchAddressToDeliveryZone(params: {
  city?: string;
  area?: string;
  street?: string;
}): Promise<DeliveryZone | null> {
  const zones = (await getAdminDeliveryZones()).filter((z) => z.is_active);
  const targetArea = (params.area || "").trim().toLowerCase();
  const targetCity = (params.city || "").trim().toLowerCase();

  for (const zone of zones) {
    // Check if city matches
    const cityMatches = zone.city.toLowerCase() === targetCity;
    // Check if any registered area name is found in target area or street
    const areaMatches = zone.areas.some(
      (a) =>
        a.toLowerCase() === targetArea ||
        (params.street && params.street.toLowerCase().includes(a.toLowerCase()))
    );

    if (areaMatches || (cityMatches && targetArea.length === 0)) {
      return zone;
    }
  }

  return null;
}

/**
 * ----------------------------------------------------------------------------
 * HOMEPAGE CMS MANAGEMENT
 * ----------------------------------------------------------------------------
 */

export async function getHomepageCMS(): Promise<HomepageCMSContent> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("homepage_cms")
        .select("*")
        .eq("id", "default")
        .single();
      if (!error && data) {
        return data as HomepageCMSContent;
      }
    } catch {
      // Fallback
    }
  }
  return { ...runtimeCMSContent };
}

export async function updateHomepageCMS(
  input: Partial<HomepageCMSContent>
): Promise<HomepageCMSContent> {
  const now = new Date().toISOString();
  const updated: HomepageCMSContent = {
    ...runtimeCMSContent,
    ...input,
    updated_at: now,
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("homepage_cms")
        .upsert({ ...updated, id: "default" })
        .select()
        .single();
      if (!error && data) {
        runtimeCMSContent = data as HomepageCMSContent;
        return runtimeCMSContent;
      }
    } catch {
      // Fallback
    }
  }

  runtimeCMSContent = updated;
  return updated;
}

/**
 * ----------------------------------------------------------------------------
 * LAGOS / DELTA STATE TIMEZONE BUSINESS AVAILABILITY
 * Timezone: Africa/Lagos (UTC+1)
 * ----------------------------------------------------------------------------
 */

export async function checkBusinessAvailability(): Promise<BusinessAvailabilityStatus> {
  const settings = await getBusinessSettings();

  // If temporary closure is toggled on, reject unless admin override is active
  if (settings.is_temporarily_closed && !settings.allow_ordering_override) {
    return {
      isOpen: false,
      canAcceptOrders: false,
      reason:
        settings.temporary_closure_reason ||
        "The kitchen is temporarily closed for maintenance. Please check back shortly.",
      isTemporarilyClosed: true,
      currentTimeLagos: getCurrentLagosTime(),
      dayOfWeek: getCurrentLagosDay(),
    };
  }

  // Calculate current time in Africa/Lagos
  const currentLagosTime = getCurrentLagosTime();
  const currentDay = getCurrentLagosDay();

  // Verify operating day
  const isOperatingDay = settings.operating_days.includes(currentDay);
  if (!isOperatingDay && !settings.allow_ordering_override) {
    return {
      isOpen: false,
      canAcceptOrders: false,
      reason: `Empress Delicacies is closed on ${currentDay}s.`,
      nextOpening: `Next opening: Monday at ${settings.opening_time}`,
      isTemporarilyClosed: false,
      currentTimeLagos: currentLagosTime,
      dayOfWeek: currentDay,
    };
  }

  // Check opening & closing hour window
  const isWithinHours =
    currentLagosTime >= settings.opening_time && currentLagosTime <= settings.closing_time;

  if (!isWithinHours && !settings.allow_ordering_override) {
    return {
      isOpen: false,
      canAcceptOrders: false,
      reason: `We are currently closed. Operating hours are ${settings.opening_time} to ${settings.closing_time} (WAT).`,
      nextOpening: `We open today/tomorrow at ${settings.opening_time}`,
      isTemporarilyClosed: false,
      currentTimeLagos: currentLagosTime,
      dayOfWeek: currentDay,
    };
  }

  return {
    isOpen: true,
    canAcceptOrders: true,
    isTemporarilyClosed: false,
    currentTimeLagos: currentLagosTime,
    dayOfWeek: currentDay,
  };
}

function getCurrentLagosTime(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(new Date());
  } catch {
    // Fallback UTC+1
    const d = new Date();
    const utcHours = d.getUTCHours() + 1;
    const hours = (utcHours % 24).toString().padStart(2, "0");
    const mins = d.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${mins}`;
  }
}

function getCurrentLagosDay(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      weekday: "long",
    });
    return formatter.format(new Date());
  } catch {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[new Date().getDay()];
  }
}
