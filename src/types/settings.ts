export interface BusinessSettings {
  id: string;
  business_name: string;
  logo_url?: string | null;
  description?: string | null;
  phone: string;
  whatsapp_number?: string | null;
  email: string;
  address: string;
  country: string; // Default: 'Nigeria'
  state: string; // Default: 'Delta State'
  city: string; // e.g., 'Asaba' / 'Warri'
  currency: string; // 'NGN'
  currency_symbol: string; // '₦'
  opening_time: string; // e.g. '10:00' (24-hr)
  closing_time: string; // e.g. '22:00' (24-hr)
  operating_days: string[]; // e.g. ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  is_temporarily_closed: boolean;
  temporary_closure_reason?: string | null;
  allow_ordering_override: boolean; // Admin can override closed state
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  pickup_address?: string | null;
  pickup_instructions?: string | null;
  estimated_preparation_minutes: number;
  updated_at: string;
}

export interface HomepageCMSContent {
  id: string;
  hero_eyebrow: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_destination: string;
  hero_image_url?: string | null;
  hero_secondary_image_url?: string | null;
  story_heading: string;
  story_paragraphs: string[];
  story_quote: string;
  story_image_url?: string | null;
  gallery_images: {
    id: string;
    url: string;
    title: string;
    caption?: string;
  }[];
  testimonials: {
    id: string;
    customer_name: string;
    role?: string;
    quote: string;
    rating: number;
    verified: boolean;
  }[];
  footer_tagline: string;
  footer_description: string;
  updated_at: string;
}

export interface BusinessAvailabilityStatus {
  isOpen: boolean;
  canAcceptOrders: boolean;
  reason?: string;
  nextOpening?: string;
  isTemporarilyClosed: boolean;
  currentTimeLagos: string;
  dayOfWeek: string;
}
