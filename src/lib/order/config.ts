import type { DeliveryZone, Coupon } from "@/types/order";

export const DEFAULT_PICKUP_LOCATION = {
  name: "Empress Delicacies Central Kitchen & Collection Studio",
  address: "Plot 14B, Victoria Island Culinary Walk, Lagos, Nigeria",
  hours: "Mon – Sun: 10:00 AM – 11:00 PM",
  phone: "+234 800 123 4567",
};

export const CONFIGURED_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-vi-ikoyi",
    name: "Victoria Island & Ikoyi",
    state: "Lagos",
    city: "Lagos",
    areas: [
      "Victoria Island",
      "Oniru",
      "Ikoyi",
      "Parkview Estate",
      "Banana Island",
      "Old Ikoyi",
    ],
    fee_kobo: 150000, // ₦1,500
    estimated_minutes_min: 25,
    estimated_minutes_max: 40,
    is_active: true,
    display_order: 1,
  },
  {
    id: "zone-lekki-1",
    name: "Lekki Phase 1 & Environs",
    state: "Lagos",
    city: "Lagos",
    areas: [
      "Lekki Phase 1",
      "Marwa",
      "Admiralty Way",
      "Freedom Way",
      "Elf",
    ],
    fee_kobo: 200000, // ₦2,000
    estimated_minutes_min: 30,
    estimated_minutes_max: 50,
    is_active: true,
    display_order: 2,
  },
  {
    id: "zone-lekki-mid",
    name: "Lekki Mid (Chevron to VGC)",
    state: "Lagos",
    city: "Lagos",
    areas: [
      "Agungi",
      "Idado",
      "Osapa London",
      "Jakande",
      "Chevron",
      "Ikota",
      "VGC (Victoria Garden City)",
    ],
    fee_kobo: 280000, // ₦2,800
    estimated_minutes_min: 40,
    estimated_minutes_max: 65,
    is_active: true,
    display_order: 3,
  },
  {
    id: "zone-yaba-surulere",
    name: "Lagos Mainland Central (Yaba & Surulere)",
    state: "Lagos",
    city: "Lagos",
    areas: [
      "Yaba",
      "Akoka",
      "Sabo",
      "Alagomeji",
      "Surulere",
      "Bode Thomas",
      "Stadium",
    ],
    fee_kobo: 250000, // ₦2,500
    estimated_minutes_min: 35,
    estimated_minutes_max: 60,
    is_active: true,
    display_order: 4,
  },
  {
    id: "zone-ikeja-gra",
    name: "Ikeja & GRA",
    state: "Lagos",
    city: "Lagos",
    areas: [
      "Ikeja GRA",
      "Allen Avenue",
      "Opebi",
      "Alausa",
      "Maryland",
      "Anthony Village",
    ],
    fee_kobo: 320000, // ₦3,200
    estimated_minutes_min: 45,
    estimated_minutes_max: 75,
    is_active: true,
    display_order: 5,
  },
];

export const CONFIGURED_COUPONS: Coupon[] = [
  {
    id: "coup-welcome10",
    code: "WELCOME10",
    description: "Welcome privilege: 10% discount on orders of ₦5,000 or more",
    discount_type: "percentage",
    discount_value: 10,
    min_order_kobo: 500000, // ₦5,000
    max_discount_kobo: 300000, // Max ₦3,000 discount
    times_used: 0,
    is_active: true,
  },
  {
    id: "coup-empress500",
    code: "EMPRESS500",
    description: "Direct ₦500 privilege voucher for orders above ₦6,000",
    discount_type: "fixed",
    discount_value: 500,
    discount_kobo: 50000, // ₦500
    min_order_kobo: 600000, // ₦6,000
    times_used: 0,
    is_active: true,
  },
  {
    id: "coup-vipfeast",
    code: "VIPFEAST",
    description: "15% discount on grand feast orders exceeding ₦20,000",
    discount_type: "percentage",
    discount_value: 15,
    min_order_kobo: 2000000, // ₦20,000
    max_discount_kobo: 600000, // Max ₦6,000 discount
    times_used: 0,
    is_active: true,
  },
];
