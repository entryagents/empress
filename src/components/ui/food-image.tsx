import Image from "next/image";
import { images, type ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

/** Single entry point for rendering food imagery from the registry. */
export function FoodImage({
  name,
  className,
  sizes,
  priority,
  fill = true,
  hoverZoom = false,
}: {
  name: ImageKey;
  className?: string;
  sizes: string;
  priority?: boolean;
  fill?: boolean;
  hoverZoom?: boolean;
}) {
  const img = images[name];
  return (
    <Image
      src={img.src}
      alt={img.alt}
      sizes={sizes}
      priority={priority}
      {...(fill ? { fill: true } : { width: img.width, height: img.height })}
      className={cn(
        "object-cover",
        hoverZoom && "transition-transform duration-[1200ms] ease-empress group-hover:scale-[1.06]",
        className,
      )}
    />
  );
}
