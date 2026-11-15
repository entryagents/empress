import type { ImageKey } from "@/config/images";

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
  itemCount: number;
}

export const categories: Category[] = [
  {
    id: "shawarma-wraps",
    name: "Shawarma & Wraps",
    blurb: "Hand-rolled warm flatbread packed with spiced shredded meat, pickled relish and creamy garlic sauce.",
    image: "shawarma",
    itemCount: 1,
  },
  {
    id: "small-chops",
    name: "Small Chops",
    blurb: "Golden, shareable bite-sized favourites: fluffy puff-puff, crisp meat pies, spiced spring rolls and samosas.",
    image: "small-chops",
    itemCount: 1,
  },
  {
    id: "rice-noodles",
    name: "Rice & Noodles",
    blurb: "High-heat wok-tossed noodles with garden peppers and fragrant shrimp-fried rice seasoned to perfection.",
    image: "stir-fried-noodles",
    itemCount: 2,
  },
  {
    id: "grills-proteins",
    name: "Grills & Proteins",
    blurb: "Slow-roasted marinated chicken, succulent turkey pieces and seared thick-cut pork chops.",
    image: "chicken",
    itemCount: 3,
  },
  {
    id: "seafood",
    name: "Seafood",
    blurb: "Whole seasoned tilapia, charcoal-grilled with native spices, charred onions and sweet peppers.",
    image: "tilapia-fish",
    itemCount: 1,
  },
  {
    id: "specialties",
    name: "Specialties",
    blurb: "Tender ribeye Philly cheesesteaks and golden-battered corn dogs prepared street-style.",
    image: "philly-cheesesteak",
    itemCount: 2,
  },
];

export interface Price {
  amount: number;
  currency: string;
  isInitialBenchmark: boolean;
}

export function formatPrice(price: Price): string {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.amount);
  return formatted;
}

export interface Product {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  image: ImageKey;
  price: Price;
  availability: "Available" | "Fresh to order";
  preparationTime: string;
}

const p = (
  slug: string,
  name: string,
  category: CategoryId,
  image: ImageKey,
  amount: number,
  description: string,
  preparationTime: string = "20–30 mins",
): Product => ({
  slug,
  name,
  category,
  image,
  description,
  price: { amount, currency: "NGN", isInitialBenchmark: true },
  availability: "Fresh to order",
  preparationTime,
});

export const products: Product[] = [
  p("shawarma", "Classic Chicken Shawarma", "shawarma-wraps", "shawarma", 4500, "Spit-roasted chicken slivers, crunchy cabbage, tangy pickles, and house garlic sauce wrapped in warm flatbread.", "15–20 mins"),
  p("small-chops", "Deluxe Small Chops Platter", "small-chops", "small-chops", 8500, "Crowd-favourite combination of sweet puff-puff, spiced chicken samosas, golden spring rolls, and peppered skewers.", "25–35 mins"),
  p("stir-fried-noodles", "Wok Stir-fried Noodles", "rice-noodles", "stir-fried-noodles", 6200, "Egg noodles tossed over high wok flame with seasoned shrimp, crisp shredded carrots, spring onions, and chili oil.", "20–25 mins"),
  p("pork-chops", "Herb-Crusted Pork Chops", "grills-proteins", "pork-chops", 9500, "Thick center-cut chops seared in herb garlic butter until golden brown, served with steamed greens.", "30–40 mins"),
  p("philly-cheesesteak", "Classic Philly Cheesesteak", "specialties", "philly-cheesesteak", 7500, "Shaved ribeye beef griddled with sweet onions and blanketed in melted provolone inside a toasted hoagie roll.", "15–20 mins"),
  p("chinese-rice", "Chinese Shrimp Fried Rice", "rice-noodles", "chinese-rice", 6800, "Fragrant jasmine rice wok-tossed with jumbo prawns, scrambled eggs, sweet green peas, and scallion infused oil.", "20–25 mins"),
  p("turkey", "Slow-Roasted Turkey Drum", "grills-proteins", "turkey", 8900, "Marinated in aromatic herbs and roasted until deeply browned with tender, juicy meat and rich basting juices.", "35–45 mins"),
  p("chicken", "Golden Roast Chicken", "grills-proteins", "chicken", 7200, "Whole chicken quarters flame-roasted with lemon pepper and garlic herbs, retaining a juicy, flavorful bite.", "25–35 mins"),
  p("tilapia-fish", "Whole Charcoal Grilled Tilapia", "seafood", "tilapia-fish", 9800, "Fresh whole tilapia marinated in scotch bonnet, ginger and garlic spices, slow-grilled over charcoal embers.", "35–45 mins"),
  p("corn-dogs", "Crispy Street Corn Dogs", "specialties", "corn-dogs", 3800, "Plump smoked sausage hand-dipped in golden sweet cornmeal batter, flash-fried and served with mustard drizzle.", "10–15 mins"),
];
