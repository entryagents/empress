import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Empress Delicacies",
    short_name: "Empress",
    description:
      "Order handcrafted shawarma, small chops, noodles, grills and more for delivery or pickup in Delta State.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7f1",
    theme_color: "#340a18",
    categories: ["food", "shopping"],
    lang: "en-NG",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Order Now", url: "/order", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
      { name: "Menu", url: "/menu", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
      { name: "My Orders", url: "/account/orders", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
    ],
  };
}
