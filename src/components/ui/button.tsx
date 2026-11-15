import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-semibold tracking-wide transition-[background-color,color,transform,box-shadow] duration-300 ease-empress active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-wine-800 text-ivory-50 hover:bg-wine-700 shadow-soft",
        gold: "bg-champagne-400 text-wine-950 hover:bg-champagne-300",
        outline: "border border-current bg-transparent hover:bg-current/10",
        ghost: "bg-transparent hover:bg-current/10",
        ivory: "bg-ivory-50 text-wine-900 hover:bg-ivory-200",
      },
      size: {
        sm: "h-10 px-5",
        md: "h-12 px-7",
        lg: "h-14 px-9 text-base",
        icon: "size-11",
      },
      shape: { pill: "rounded-full", square: "rounded-[2px]" },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "square" },
  },
);

type Props = VariantProps<typeof buttonVariants> & {
  href: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">;

/** Every call-to-action in Phase 1 is a real link; swap hrefs via ROUTES. */
export function ButtonLink({ variant, size, shape, className, href, ...props }: Props) {
  return <Link href={href} className={cn(buttonVariants({ variant, size, shape }), className)} {...props} />;
}

export function Button({
  variant,
  size,
  shape,
  className,
  ...props
}: VariantProps<typeof buttonVariants> & React.ComponentProps<"button">) {
  return <button className={cn(buttonVariants({ variant, size, shape }), className)} {...props} />;
}
