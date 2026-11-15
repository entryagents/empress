/**
 * Reusable image registry.
 * ALL photographs are 100% real live food photographs from the open web (Wikimedia Commons),
 * selected for authentic culinary presentation. Zero AI-generated imagery.
 * 
 * Replace any `src` with uploaded Empress Delicacies kitchen photographs
 * through the admin dashboard or storage bucket.
 */
export type ImageSource = "wikimedia-commons";

export interface FoodImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  source: ImageSource;
  credit: { author: string; license: string; url: string };
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

export const images = {
  shawarma: commons(
    "shawarma.jpg",
    "Handmade chicken shawarma wrap cut open on a plate with fresh salad and garlic sauce",
    1280, 960, "Andy Li", "CC0", "File:Handmade_Chicken_Shawarma_Wrap_-_Lavash.jpg",
  ),
  "small-chops": commons(
    "small-chops.jpg",
    "Platter of Nigerian small chops featuring meat pies, samosas, spring rolls and skewers",
    1280, 1707, "Aisha Yahuza", "CC0", "File:Meat_pie_samosa_and_spring_roll.jpg",
  ),
  "stir-fried-noodles": commons(
    "stir-fried-noodles.jpg",
    "A hot plate of wok stir-fried noodles tossed with shrimp, vegetables, scallions and lime",
    1280, 853, "PattayaPatrol", "CC BY-SA 4.0",
    "File:DFC_2078_A_plate_of_shrimp_pad_Thai_garnished_with_lime_bean_sprouts_scallions_and_crushed_peanuts.jpg",
  ),
  "pork-chops": commons(
    "pork-chops.jpg",
    "Thick-cut grilled pork chops seared to a golden crust, served with steamed broccoli",
    1280, 792, "Bonnachoven", "CC0", "File:Longhorn_Cowboy_Pork_Chops_.jpg",
  ),
  "philly-cheesesteak": commons(
    "philly-cheesesteak.jpg",
    "Authentic Philly cheesesteak sandwich with grilled ribeye beef and melted cheese on a hoagie roll",
    1280, 720, "jeffreyw", "CC BY 2.0", "File:Cheesesteak_(19386149993).jpg",
  ),
  "chinese-rice": commons(
    "chinese-rice.jpg",
    "Fragrant Chinese wok-fried rice with king prawns, egg and spring onions",
    1280, 1707, "Andy Li", "CC0", "File:King_prawns_fried_rice,_Stir_Fry_by_CK.jpg",
  ),
  turkey: commons(
    "turkey.jpg",
    "Slow-roasted golden turkey dinner with roasted potatoes, vegetables and rich gravy",
    1280, 916, "Acabashi", "CC BY-SA 4.0",
    "File:Roast_turkey_dinner_Old_Nelson_Brewers_Fayre_Premier_Inn_Stroud_Gloucestershire.jpg",
  ),
  chicken: commons(
    "chicken.jpg",
    "Whole roasted seasoned chicken with golden crispy skin and lemon wedges on a platter",
    1280, 1927, "Evan Swigart", "CC BY 2.0",
    "File:Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg",
  ),
  "tilapia-fish": commons(
    "tilapia.jpg",
    "Whole seasoned tilapia fish grilled over hot open coals",
    1280, 848, "Noahalorwu", "CC BY-SA 4.0", "File:Grilled_Tilapia_-_Winneba.jpg",
  ),
  "corn-dogs": commons(
    "corn-dogs.jpg",
    "Golden deep-fried corn dog on a stick with mustard and ketchup drizzle",
    1280, 853, "Tasy Hong", "CC0", "File:Corn_dog.jpg",
  ),
} as const satisfies Record<string, FoodImage>;

export type ImageKey = keyof typeof images;
