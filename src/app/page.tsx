import { Hero } from "@/components/sections/hero";
import { Signature } from "@/components/sections/signature";
import { DeliveryPickup } from "@/components/sections/delivery-pickup";
import { CallToAction } from "@/components/sections/cta";

export const instant = false;


export default function Home() {
  return (
    <>
      {/* HERO: Editorial Brand & Quick CTAs */}
      <Hero />

      {/* SIGNATURE SELECTION: Direct Food Menu & Quick Add */}
      <Signature />

      {/* FULFILLMENT: DELIVERY & PICKUP IN DELTA STATE */}
      <DeliveryPickup />

      {/* FINAL CALL TO ACTION */}
      <CallToAction />
    </>
  );
}