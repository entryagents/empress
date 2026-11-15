/**
 * Reusable image registry. Replace any `src` with an uploaded Empress
 * photograph (local file or CDN URL) and every section updates.
 * `source` flags what each image currently is — none are photos of the business.
 */
export type ImageSource = "ai-generated" | "wikimedia-commons";

export interface FoodImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  source: ImageSource;
  credit?: { author: string; license: string; url: string };
}

const commons = (
  file: string,
  alt: string,
  width: number,
  height: number,
  author: string,
  license: string,
  page: string,
): FoodImage => ({
  src: `/images/food/${file}`,
  alt,
  width,
  height,
  source: "wikimedia-commons",
  credit: { author, license, url: `https://commons.wikimedia.org/wiki/${page}` },
});

const ai = (file: string, alt: string): FoodImage => ({
  src: `/images/food/${file}`,
  alt,
  width: 1200,
  height: 896,
  source: "ai-generated",
});

export const images = {
  shawarma: ai(
    "shawarma.jpg",
    "A chicken shawarma wrap in paper with pickles, tomato and garlic sauce",
  ),
  "small-chops": ai(
    "small-chops.jpg",
    "A platter of small chops: puff-puff, spring rolls, samosas, wings and skewers",
  ),
  "stir-fried-noodles": ai(
    "stir-fried-noodles.jpg",
    "Stir-fried noodles with chicken and peppers lifted with chopsticks",
  ),
  "pork-chops": commons(
    "pork-chops.jpg",
    "Seared pork chops served with broccoli",
    960, 594, "Bonnachoven", "CC0", "File:Longhorn_Cowboy_Pork_Chops_.jpg",
  ),
  "philly-cheesesteak": commons(
    "philly-cheesesteak.jpg",
    "A Philly cheesesteak with sliced steak, onions and melted cheese on a roll",
    960, 540, "jeffreyw", "CC BY 2.0", "File:Cheesesteak_(19386149993).jpg",
  ),
  "chinese-rice": commons(
    "chinese-rice.jpg",
    "Chinese-style fried rice with king prawns and spring onion",
    960, 1280, "Andy Li", "CC0", "File:King_prawns_fried_rice,_Stir_Fry_by_CK.jpg",
  ),
  turkey: commons(
    "turkey.jpg",
    "Roast turkey with roast potatoes, vegetables and gravy",
    960, 687, "Acabashi", "CC BY-SA 4.0",
    "File:Roast_turkey_dinner_Old_Nelson_Brewers_Fayre_Premier_Inn_Stroud_Gloucestershire.jpg",
  ),
  chicken: commons(
    "chicken.jpg",
    "Glazed grilled chicken served with rice",
    640, 480, "Hajime NAKANO", "CC BY 2.0",
    "File:Jerk_chicken@The_Jamaican_Grill_(162928762).jpg",
  ),
  "tilapia-fish": commons(
    "tilapia.jpg",
    "Whole tilapia fish grilled over charcoal",
    960, 636, "Noahalorwu", "CC BY-SA 4.0", "File:Grilled_Tilapia_-_Winneba.jpg",
  ),
  "corn-dogs": commons(
    "corn-dogs.jpg",
    "Two golden corn dogs on sticks with ketchup",
    960, 638, "Ocdp", "CC0", "File:Corn_dog_001.jpg",
  ),
} as const satisfies Record<string, FoodImage>;

export type ImageKey = keyof typeof images;
