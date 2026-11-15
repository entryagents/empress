import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="eyebrow flex items-center gap-3 text-champagne-500 [&::before]:h-px [&::before]:w-10 [&::before]:bg-current">
        {eyebrow}
      </p>
      <h2 className="mt-5 font-serif text-(length:--text-h2) leading-[1.02] tracking-tight">{title}</h2>
      {children && <p className="mt-6 max-w-xl text-base leading-relaxed opacity-75 sm:text-lg">{children}</p>}
    </Reveal>
  );
}
