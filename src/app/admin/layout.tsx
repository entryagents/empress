import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, ExternalLink } from "lucide-react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { getCurrentCustomer } from "@/lib/customer/service";

export const metadata = {
  title: "Admin Portal | Empress Delicacies",
  description: "Catalogue, product, and category administration for Empress Delicacies",
};

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentCustomer();

  if (!user) {
    redirect("/auth/login?redirect=/admin/orders");
  }

  // Verify administrative privileges
  if (profile?.role !== "admin") {
    redirect("/account");
  }

  return (
    <AuthenticatedShell role="admin">
      <div className="w-full">
        {/* Action Header bar inside Admin Content area */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-wine-900/10 pb-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-wine-950">
              Operations &amp; Management
            </h1>
            <p className="text-xs text-wine-700">
              Delta State culinary operations, dispatch, menu control, and settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/menu/new"
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-3.5 py-2 text-xs font-semibold text-champagne-300 shadow-xs hover:bg-wine-800 transition-colors"
            >
              <PlusCircle className="size-3.5" />
              New Dish
            </Link>
            <Link
              href="/menu"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-white px-3 py-2 text-xs font-semibold text-wine-800 hover:bg-wine-50 transition-colors"
            >
              <span>Live Menu</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* Child Pages (Orders, Dishes, Categories, etc.) */}
        <div>{children}</div>
      </div>
    </AuthenticatedShell>
  );
}
