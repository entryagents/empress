import { Hero } from "@/components/sections/hero";
import { Categories } from "@/components/sections/categories";
import { Signature } from "@/components/sections/signature";
import { Story } from "@/components/sections/story";
import { Gallery } from "@/components/sections/gallery";
import { DeliveryPickup } from "@/components/sections/delivery-pickup";
import { CallToAction } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <Signature />
      <Story />
      <Gallery />
      <DeliveryPickup />
      <CallToAction />
    </>
  );
}
