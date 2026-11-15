import type { ImageKey } from "@/config/images";

/**
 * Static catalogue for Phase 1. Shapes mirror what the Phase 2 database
 * will return, so sections only need to swap the data source.
 */
export type CategoryId =
  | "shawarma-wraps"
  | "small-chops"
  | "rice-noodles"
  | "grills-proteins"
  | "seafood"
  | "specialties";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  image: ImageKey;
}

export const categories: Category[] = [
  { id: "shawarma-wraps", name: "Shawarma & Wraps", blurb: "Warm flatbread, roasted meat, sharp pickles and sauce.", image: "shawarma" },
  { id: "small-chops", name: "Small Chops", blurb: "Golden, shareable bites for every gathering.", image: "small-chops" },
  { id: "rice-noodles", name: "Rice & Noodles", blurb: "Wok-fired rice and noodles, tossed to order.", image: "stir-fried-noodles" },
  { id: "grills-proteins", name: "Grills & Proteins", blurb: "Chicken, turkey and pork chops with proper colour.", image: "chicken" },
  { id: "seafood", name: "Seafood", blurb: "Tilapia, prepared whole and full of flavour.", image: "tilapia-fish" },
  { id: "specialties", name: "Specialties", blurb: "Philly cheesesteak and corn dogs, done right.", image: "philly-cheesesteak" },
];

export interface Price {
  /** null until the real value is loaded from the database. */
  amount: number | null;
  currency: string | null;
}

/** Temporary, clearly-defined price used until Phase 2 supplies real data. */
export const PLACEHOLDER_PRICE: Price = { amount: null, currency: null };

export function formatPrice(price: Price): string {
  if (price.amount === null || price.currency === null) return "Price to be confirmed";
  return new Intl.NumberFormat("en", { style: "currency", currency: price.currency }).format(price.amount);
}

export interface Product {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  image: ImageKey;
  price: Price;
}

const p = (
  slug: string,
  name: string,
  category: CategoryId,
  image: ImageKey,
  description: string,
): Product => ({ slug, name, category, image, description, price: PLACEHOLDER_PRICE });

export const products: Product[] = [
  p("shawarma", "Shawarma", "shawarma-wraps", "shawarma", "Sliced roasted meat, crisp salad and creamy garlic sauce in warm flatbread."),
  p("small-chops", "Small Chops", "small-chops", "small-chops", "A generous platter of party favourites, fried golden and served with dip."),
  p("stir-fried-noodles", "Stir-fried Noodles", "rice-noodles", "stir-fried-noodles", "Noodles tossed hot with vegetables, seasoning and tender protein."),
  p("pork-chops", "Pork Chops", "grills-proteins", "pork-chops", "Thick-cut chops, seared for a golden crust and a juicy centre."),
  p("philly-cheesesteak", "Philly Cheesesteak", "specialties", "philly-cheesesteak", "Thin-sliced steak, grilled onions and melted cheese on a soft roll."),
  p("chinese-rice", "Chinese Rice", "rice-noodles", "chinese-rice", "Wok-style fried rice with vegetables and savoury, fragrant seasoning."),
  p("turkey", "Turkey", "grills-proteins", "turkey", "Slow-roasted turkey, rich in flavour and tender to the bite."),
  p("chicken", "Chicken", "grills-proteins", "chicken", "Seasoned chicken cooked until deeply golden and full of flavour."),
  p("tilapia-fish", "Tilapia Fish", "seafood", "tilapia-fish", "Whole tilapia, seasoned and grilled with a smoky, charred finish."),
  p("corn-dogs", "Corn Dogs", "specialties", "corn-dogs", "Crisp cornmeal batter around a juicy sausage, ready for mustard or ketchup."),
];
