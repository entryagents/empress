import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 - Culinary Dish or Page Not Found | Empress Delicacies",
  description: "The requested culinary selection or page is not available.",
};

export default function NotFound() {
  return (
    <section className="flex min-h-[75vh] flex-col items-center justify-center bg-ivory-50 px-6 py-28 text-center text-wine-950">
      <div className="max-w-md">
        <span className="font-serif text-3xl font-bold tracking-widest text-champagne-600">
          404
        </span>
        <h1 className="mt-3 font-serif text-3xl font-light text-wine-950 sm:text-4xl">
          Page or Dish Not Found
        </h1>
        <p className="mt-3 text-sm text-wine-800/80 leading-relaxed font-light">
          The delicacy or page you are seeking could not be found or has been moved to our seasonal archives.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors"
          >
            <ArrowLeft className="size-3.5 text-champagne-400" />
            Return Home
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded border border-wine-900/20 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-wine-900 shadow-2xs hover:bg-ivory-100 transition-colors"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </section>
  );
}
