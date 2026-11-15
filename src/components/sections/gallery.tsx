import Link from "next/link";
import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

/** Bento layout: each tile has its own span + crop for a portfolio rhythm. */
const tiles: { img: ImageKey; cls: string; pos?: string }[] = [
  { img: "philly-cheesesteak", cls: "col-span-2 row-span-2 sm:col-[1/6] sm:row-[1/3]" },
  { img: "chinese-rice", cls: "col-span-1 row-span-2 sm:col-[6/9] sm:row-[1/5]", pos: "object-[50%_45%]" },
  { img: "shawarma", cls: "col-span-1 row-span-2 sm:col-[1/3] sm:row-[3/5]", pos: "object-[70%_50%]" },
  { img: "stir-fried-noodles", cls: "col-span-2 row-span-1 sm:col-[3/6] sm:row-[3/5]", pos: "object-[50%_55%]" },
  { img: "turkey", cls: "col-span-1 row-span-1 sm:col-[1/4] sm:row-[5/7]" },
  { img: "corn-dogs", cls: "col-span-1 row-span-1 sm:col-[4/6] sm:row-[5/7]" },
  { img: "tilapia-fish", cls: "col-span-2 row-span-2 sm:col-[6/9] sm:row-[5/7]" },
];

export function Gallery() {
  return (
    <section id="gallery" className="bg-ivory-50 py-24 lg:py-36">
      <div className="container-x">
        <SectionHeading eyebrow="Gallery" title={<>A taste of <em className="text-wine-600">the table</em></>}>
          A look at the flavours, textures and colours behind the menu.
        </SectionHeading>

        <div className="mt-14 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[6.5rem] sm:grid-cols-8 lg:auto-rows-[8.5rem] lg:gap-4">
          {tiles.map((t, i) => (
            <ImageReveal key={t.img} delay={(i % 3) * 0.08} className={cn("group relative bg-wine-900", t.cls)}>
              <FoodImage name={t.img} sizes="(min-width:1024px) 38vw, (min-width:640px) 50vw, 50vw" hoverZoom className={t.pos} />
              <span aria-hidden className="absolute inset-0 bg-wine-950/0 transition-colors duration-500 group-hover:bg-wine-950/20" />
            </ImageReveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 text-xs opacity-60">
            Images are illustrative placeholders and are not photographs of Empress Delicacies dishes. See{" "}
            <Link href="/credits" className="underline underline-offset-4">image credits</Link>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
