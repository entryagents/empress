import Image from "next/image";
import { images, type ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

/** Single entry point for rendering food imagery from the registry. */
export function FoodImage({
  name,
  src,
  alt,
  className,
  sizes,
  priority,
  fill = true,
  hoverZoom = false,
}: {
  name?: string;
  src?: string;
  alt?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
  hoverZoom?: boolean;
}) {
  const registered = name && name in images ? images[name as ImageKey] : null;
  const imageSrc = src || registered?.src || (name ? `/images/food/${name}.jpg` : "/images/food/shawarma.jpg");
  const imageAlt = alt || registered?.alt || "Handcrafted Nigerian delicacy from Empress Delicacies";
  const width = registered?.width || 1280;
  const height = registered?.height || 960;

  return (
    <Image
      src={imageSrc}
      alt={imageAlt}
      sizes={sizes}
      priority={priority}
      {...(fill ? { fill: true } : { width, height })}
      className={cn(
        "object-cover",
        hoverZoom && "transition-transform duration-[1200ms] ease-empress group-hover:scale-[1.06]",
        className,
      )}
    />
  );
}
