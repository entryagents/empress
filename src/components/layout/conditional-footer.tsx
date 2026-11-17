"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Footer } from "./footer";

// Authenticated dashboards and transactional routes where marketing footer must never show
const EXCLUDED_PREFIXES = ["/account", "/admin", "/delivery", "/auth", "/order"];

export function ConditionalFooter() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // If user is logged in, hide marketing footer entirely across all pages
  if (session?.user) {
    return null;
  }

  // If path is an excluded route, do NOT render public footer
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (isExcluded) {
    return null;
  }

  return <Footer />;
}
