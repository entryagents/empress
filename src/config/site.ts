/**
 * Central brand + routing configuration.
 * Phase 2+ swaps placeholder values (contact, hours, social) for real data
 * (CMS / database) without touching section components.
 */
export const site = {
  name: "Empress Delicacies",
  shortName: "Empress",
  tagline: "Good food. Unforgettable moments.",
  description:
    "Empress Delicacies serves shawarma, small chops, stir-fried noodles, grills, seafood and more — for delivery or pickup.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Single source of truth for every internal destination. */
export const ROUTES = {
  home: "/",
  menu: "/#signature",
  categories: "/#categories",
  about: "/#about",
  contact: "/#contact",
  delivery: "/#delivery-pickup",
  /** Phase 2: replace with the real catalogue / checkout routes. */
  order: "/order",
  credits: "/credits",
} as const;

export const navLinks = [
  { label: "Home", href: ROUTES.home },
  { label: "Explore Menu", href: ROUTES.menu },
  { label: "About", href: ROUTES.about },
  { label: "Contact", href: ROUTES.contact },
] as const;

/** Clearly marked placeholders — to be supplied by the business. */
export const contact = {
  phone: "Phone number to be added",
  email: "Email address to be added",
  address: "Address to be added",
  hours: [
    { day: "Monday – Friday", time: "Opening hours to be added" },
    { day: "Saturday – Sunday", time: "Opening hours to be added" },
  ],
} as const;

/** No URLs yet — rendered as non-interactive placeholders, never dead links. */
export const socials = [
  { name: "Instagram", handle: "Handle to be added" },
  { name: "Facebook", handle: "Page to be added" },
  { name: "TikTok", handle: "Handle to be added" },
] as const;
