import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { site } from "@/config/site";
import { Providers } from "@/components/providers";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const instant = false;


const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Shawarma, Small Chops & More`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    siteName: site.name,
    type: "website",
    images: [{ url: "/images/food/shawarma.jpg", width: 1200, height: 896, alt: "Shawarma from Empress Delicacies" }],
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  applicationName: site.name,
  appleWebApp: { capable: true, title: site.shortName, statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/pwa-icon/192", sizes: "192x192", type: "image/png" }], apple: [{ url: "/pwa-icon/192", sizes: "192x192" }] },
};

export const viewport: Viewport = { themeColor: "#340a18" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ivory-50 focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <ConditionalNavbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <ConditionalFooter />
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}