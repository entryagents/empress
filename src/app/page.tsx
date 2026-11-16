import { Hero } from "@/components/sections/hero";
import { Categories } from "@/components/sections/categories";
import { Signature } from "@/components/sections/signature";
import { Story } from "@/components/sections/story";
import { Gallery } from "@/components/sections/gallery";
import { Reviews } from "@/components/sections/reviews";
import { DeliveryPickup } from "@/components/sections/delivery-pickup";
import { CallToAction } from "@/components/sections/cta";

export const instant = false;


export default function Home() {
  return (
    <>
      {/* SECTION 02: HERO */}
      <Hero />

      {/* SECTION 03: DISCOVER OUR MENU */}
      <Categories />

      {/* SECTION 04: SIGNATURE SELECTION */}
      <Signature />

      {/* SECTION 05: THE EMPRESS EXPERIENCE */}
      <Story />

      {/* SECTION 06: FOOD GALLERY */}
      <Gallery />

      {/* SECTION 07: CUSTOMER REVIEWS */}
      <Reviews />

      {/* FULFILLMENT: DELIVERY & PICKUP */}
      <DeliveryPickup />

      {/* SECTION 08: FINAL CALL TO ACTION */}
      <CallToAction />
    </>
  );
}