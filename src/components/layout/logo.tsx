import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Empress Delicacies — home" className={cn("inline-flex items-center gap-3", className)}>
      <svg viewBox="0 0 32 40" className="h-9 w-7 shrink-0" fill="none" aria-hidden="true">
        <path d="M2 38V16C2 7.7 8.2 2 16 2s14 5.7 14 14v22" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 38V18c0-4.6 3.1-8 7-8s7 3.4 7 8v20" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
        <path d="M16 18l2 4.2 4.6.6-3.3 3.2.8 4.6L16 28.4 11.9 30.6l.8-4.6-3.3-3.2 4.6-.6L16 18z" fill="var(--color-champagne-400)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.6rem] font-medium tracking-tight">Empress</span>
        <span className="eyebrow mt-1 text-[0.6rem] tracking-[0.42em] opacity-80">Delicacies</span>
      </span>
    </Link>
  );
}
