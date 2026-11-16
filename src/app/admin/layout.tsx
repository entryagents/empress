import Link from "next/link";
import { UtensilsCrossed, Layers, ExternalLink, PlusCircle, Sparkles, ChefHat } from "lucide-react";

export const metadata = {
  title: "Admin Portal | Empress Delicacies",
  description: "Catalogue, product, and category administration for Empress Delicacies",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory-100/60 font-sans text-wine-950">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-wine-900/10 bg-wine-950 text-ivory-50 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/menu" className="flex items-center gap-2 group">
              <span className="font-serif text-lg font-bold tracking-widest text-champagne-400 group-hover:text-champagne-300 transition-colors">
                EMPRESS
              </span>
              <span className="rounded bg-wine-900 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-champagne-300 border border-champagne-500/20">
                Staff Portal
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ivory-200">
              <Link
                href="/admin/menu"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-wine-900/60 hover:text-champagne-300"
              >
                <UtensilsCrossed className="size-3.5 text-champagne-400" />
                Dishes
              </Link>
              <Link
                href="/admin/categories"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-wine-900/60 hover:text-champagne-300"
              >
                <Layers className="size-3.5 text-champagne-400" />
                Categories
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-wine-900/60 hover:text-champagne-300"
              >
                <ChefHat className="size-3.5 text-champagne-400" />
                Incoming Orders
              </Link>
              <Link
                href="/admin/deliveries"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-wine-900/60 hover:text-champagne-300"
              >
                <Sparkles className="size-3.5 text-champagne-400" />
                Fleet &amp; Dispatch
              </Link>
              <Link
                href="/admin/payments"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors hover:bg-wine-900/60 hover:text-champagne-300"
              >
                <Sparkles className="size-3.5 text-champagne-400" />
                Payments &amp; Audit
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/menu/new"
              className="inline-flex items-center gap-1.5 rounded bg-champagne-500 px-3 py-1.5 text-xs font-semibold text-wine-950 transition-colors hover:bg-champagne-400 shadow-xs"
            >
              <PlusCircle className="size-3.5" />
              New Dish
            </Link>
            <Link
              href="/menu"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 rounded border border-ivory-50/20 px-2.5 py-1.5 text-xs text-ivory-200 hover:border-champagne-400 hover:text-champagne-300 transition-colors"
            >
              <span>Live Menu</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* Mobile secondary bar */}
        <div className="flex border-t border-wine-900/40 px-4 py-2 md:hidden">
          <nav className="flex w-full items-center justify-around text-xs font-semibold uppercase tracking-wider text-ivory-200">
            <Link href="/admin/menu" className="py-1 hover:text-champagne-300">
              Dishes
            </Link>
            <Link href="/admin/categories" className="py-1 hover:text-champagne-300">
              Categories
            </Link>
            <Link href="/admin/orders" className="py-1 hover:text-champagne-300">
              Orders
            </Link>
            <Link href="/menu" target="_blank" className="py-1 hover:text-champagne-300">
              Preview
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}
