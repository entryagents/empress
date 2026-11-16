/**
 * Central brand + routing configuration for Empress Delicacies.
 * Configured so future CMS / database integrations easily replace mock & placeholder values.
 */
export const site = {
  name: "Empress Delicacies",
  shortName: "Empress",
  tagline: "Good Food. Unforgettable Moments.",
  description:
    "Empress Delicacies offers handcrafted shawarma, authentic small chops, stir-fried noodles, prime grilled meats, whole tilapia and specialties for fast delivery and customer pickup.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://entry-agents-vwhehj-6617s-projects.vercel.app",
} as const;

export const ROUTES = {
  home: "/",
  menu: "/#signature",
  categories: "/#categories",
  experience: "/#experience",
  about: "/#experience",
  gallery: "/#gallery",
  reviews: "/#reviews",
  delivery: "/#delivery-pickup",
  contact: "/#contact",
  order: "/order",
  credits: "/credits",
} as const;

export const navLinks = [
  { label: "Home", href: ROUTES.home },
  { label: "Our Menu", href: ROUTES.menu },
  { label: "About", href: ROUTES.about },
  { label: "Contact", href: ROUTES.contact },
] as const;

export const contact = {
  phone: "+234 (0) 800 EMPRESS",
  phoneRaw: "+2348003677377",
  email: "orders@empressdelicacies.com",
  address: "Empress Delicacies Culinary Studio, Delta State, Nigeria",
  hours: [
    { day: "Monday – Thursday", time: "11:00 AM – 10:30 PM" },
    { day: "Friday – Saturday", time: "11:00 AM – Midnight" },
    { day: "Sunday", time: "12:00 PM – 10:00 PM" },
  ],
} as const;

export const socials = [
  { name: "Instagram", handle: "@empressdelicacies", href: "https://instagram.com" },
  { name: "TikTok", handle: "@empressdelicacies", href: "https://tiktok.com" },
  { name: "Facebook", handle: "Empress Delicacies", href: "https://facebook.com" },
] as const;
