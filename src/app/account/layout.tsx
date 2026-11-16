import Link from "next/link";
import { User, MapPin, ShoppingBag, LogOut, ExternalLink, ChefHat } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer/service";
import { customerSignOutAction } from "../auth/actions";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export const metadata = {
  title: "My Account | Empress Delicacies",
  description: "Manage your personal details, saved Lagos delivery addresses, and dining order history.",
};

export const instant = false;

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentCustomer();

  // If not logged in, route to sign in page
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AuthenticatedShell role="customer">
      <div className="max-w-4xl">
        {/* Customer Header Banner */}
        <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-semibold text-wine-950 sm:text-3xl">
                  {profile?.full_name || "Valued Customer"}
                </span>
                {profile?.role === "admin" && (
                  <span className="rounded bg-wine-900 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-champagne-300">
                    Administrator
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-wine-700">{user.email}</p>
            </div>

            <div className="flex items-center gap-3">
              {profile?.role === "admin" && (
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-ivory-50 px-3 py-1.5 text-xs font-semibold text-wine-900 hover:bg-wine-100/60 transition-colors"
                >
                  <ChefHat className="size-3.5 text-champagne-600" />
                  Staff Portal
                </Link>
              )}

              <form action={customerSignOutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="size-3.5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          {/* Account Sub-navigation */}
          <nav className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-wine-800 hover:bg-ivory-100 hover:text-wine-950 transition-colors"
            >
              <User className="size-3.5 text-champagne-600" />
              Profile Details
            </Link>
            <Link
              href="/account/addresses"
              className="inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-wine-800 hover:bg-ivory-100 hover:text-wine-950 transition-colors"
            >
              <MapPin className="size-3.5 text-champagne-600" />
              Saved Addresses
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-wine-800 hover:bg-ivory-100 hover:text-wine-950 transition-colors"
            >
              <ShoppingBag className="size-3.5 text-champagne-600" />
              Order History
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-wine-800 hover:bg-ivory-100 hover:text-wine-950 transition-colors"
            >
              <span>Explore Menu</span>
              <ExternalLink className="size-3" />
            </Link>
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="mt-8">{children}</div>
      </div>
    </AuthenticatedShell>
  );
}
