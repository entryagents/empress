"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  Layers,
  ChefHat,
  Settings,
  BarChart3,
  Star,
  CreditCard,
  Truck,
  User,
  MapPin,
  ShoppingBag,
  Home,
} from "lucide-react";

interface AuthenticatedShellProps {
  role: "admin" | "customer" | "delivery_driver";
  children: React.ReactNode;
}

export function AuthenticatedShell({ role, children }: AuthenticatedShellProps) {
  const pathname = usePathname();

  const adminNav = [
    { href: "/admin/orders", label: "Orders", icon: ChefHat },
    { href: "/admin/menu", label: "Menu Dishes", icon: UtensilsCrossed },
    { href: "/admin/categories", label: "Categories", icon: Layers },
    { href: "/admin/deliveries", label: "Fleet Dispatch", icon: Truck },
    { href: "/admin/settings", label: "Settings & Zones", icon: Settings },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
  ];

  const customerNav = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account/orders", label: "Orders", icon: ShoppingBag },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/menu", label: "Order Food", icon: UtensilsCrossed },
  ];

  const courierNav = [
    { href: "/delivery", label: "Courier Console", icon: Truck },
    { href: "/delivery#history", label: "Deliveries", icon: ShoppingBag },
    { href: "/account", label: "My Profile", icon: User },
  ];

  const items = role === "admin" ? adminNav : role === "delivery_driver" ? courierNav : customerNav;

  return (
    <div className="flex min-h-dvh bg-ivory-50 text-wine-950">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-wine-900/10 bg-white shadow-soft pt-8 pb-8 px-4 shrink-0 sticky top-0 h-dvh self-start">
        <div className="px-3 pb-6 border-b border-wine-900/10">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-champagne-600">
            {role === "admin" ? "Administrative Console" : role === "delivery_driver" ? "Dispatch Logistics" : "Customer Portal"}
          </p>
          <h2 className="font-serif text-lg font-bold text-wine-950 mt-1">
            Empress Delicacies
          </h2>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/account" && item.href !== "/delivery" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-wine-950 text-champagne-300 shadow-xs"
                    : "text-wine-800 hover:bg-wine-50 hover:text-wine-950"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-champagne-400" : "text-champagne-600"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-wine-900/10 px-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-wine-700 hover:text-wine-950"
          >
            <Home className="size-3.5 text-champagne-600" />
            <span>Return to Public Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-12 pt-8 lg:pt-10 px-4 sm:px-6 lg:px-10">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (with safe area inset support) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-wine-900/10 bg-white/95 backdrop-blur-md shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-around py-2 px-2">
          {items.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/account" && item.href !== "/delivery" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-center transition-colors min-w-[56px] ${
                  isActive ? "text-wine-950 font-bold" : "text-wine-600 font-medium hover:text-wine-900"
                }`}
              >
                <div
                  className={`flex items-center justify-center size-8 rounded-full mb-0.5 ${
                    isActive ? "bg-wine-950 text-champagne-300" : "bg-transparent text-wine-700"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-[0.65rem] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
