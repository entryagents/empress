"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X, ArrowUpRight } from "lucide-react";
import { navLinks, ROUTES } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          scrolled || open ? "bg-wine-950/95 shadow-soft backdrop-blur-sm" : "bg-transparent",
          "text-ivory-50",
        )}
      >
        <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="group relative py-2 text-sm font-medium tracking-wide opacity-90 transition-opacity hover:opacity-100"
              >
                {l.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-champagne-400 transition-transform duration-500 ease-empress group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={ROUTES.order}
              aria-label="Cart (0 items)"
              className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-ivory-50/10"
            >
              <ShoppingBag className="size-5" strokeWidth={1.6} />
              <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-champagne-400 text-[0.6rem] font-bold text-wine-950">
                0
              </span>
            </Link>
            <ButtonLink href={ROUTES.order} variant="gold" size="sm" className="hidden sm:inline-flex">
              Order Now
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-11 place-items-center rounded-full transition-colors hover:bg-ivory-50/10 lg:hidden"
            >
              {open ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.5, ease } }}
            transition={{ duration: 0.7, ease }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-wine-950 pt-24 text-ivory-50 lg:hidden"
          >
            <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center gap-1 pb-6">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.07, duration: 0.7, ease } }}
                  exit={{ opacity: 0 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 border-b border-ivory-50/10 py-4 font-serif text-[2.6rem] leading-none tracking-tight"
                  >
                    <span className="eyebrow w-6 text-champagne-400">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.7, ease } }}
              className="container-x pb-10"
            >
              <ButtonLink href={ROUTES.order} variant="gold" size="lg" className="w-full" onClick={() => setOpen(false)}>
                Order Now <ArrowUpRight className="size-5" />
              </ButtonLink>
              <p className="eyebrow mt-6 text-center opacity-60">Delivery · Pickup</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
