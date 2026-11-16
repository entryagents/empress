"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";

// Dashboards have their own sidebar shell; the public marketing navbar must not render there
const EXCLUDED_PREFIXES = ["/account", "/admin", "/delivery"];

export function ConditionalNavbar() {
  const pathname = usePathname();
  if (EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p))) return null;
  return <Navbar />;
}
