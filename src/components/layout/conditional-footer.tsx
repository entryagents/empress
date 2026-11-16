"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

// Authenticated dashboards where public marketing footer must be strictly excluded
const EXCLUDED_PREFIXES = ["/account", "/admin", "/delivery", "/auth", "/order"];

export function ConditionalFooter() {
  const pathname = usePathname();

  // If path is an authenticated dashboard or onboarding screen, do NOT render public footer
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (isExcluded) {
    return null;
  }

  return <Footer />;
}
