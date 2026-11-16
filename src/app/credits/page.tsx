import type { Metadata } from "next";
import { images } from "@/config/images";

export const instant = false;


export const metadata: Metadata = {
  title: "Image Credits & Photography Registry",
  description: "Attribution and licensing for authentic food photography displayed on Empress Delicacies.",
};

export default function CreditsPage() {
  return (
    <section className="bg-ivory-50 pb-24 pt-36 text-wine-900">
      <div className="container-x max-w-4xl">
        <p className="eyebrow text-champagne-500">Photography Registry</p>
        <h1 className="mt-4 font-serif text-(length:--text-h2) leading-none tracking-tight">
          Food Photography Credits
        </h1>
        <p className="mt-6 text-base leading-relaxed opacity-85 sm:text-lg">
          Empress Delicacies uses authentic, high-resolution food photography sourced under open creative licenses (CC0, CC BY, CC BY-SA) from Wikimedia Commons photographers. These photographs represent the actual culinary dishes offered on our menu and will be replaced with our own in-house kitchen photography as new dishes are photographed. Zero AI-generated images are used.
        </p>

        <div className="mt-12 overflow-hidden border border-wine-900/15 bg-white shadow-soft">
          <ul className="divide-y divide-wine-900/10">
            {Object.entries(images).map(([key, img]) => (
              <li key={key} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold capitalize text-wine-950">
                    {key.replace(/-/g, " ")}
                  </h3>
                  <p className="mt-1 text-xs text-wine-800/70">{img.alt}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <span className="inline-block rounded bg-champagne-400/20 px-2 py-0.5 text-xs font-semibold text-wine-900">
                    {img.credit.license}
                  </span>
                  <p className="mt-1 text-xs">
                    <a
                      href={img.credit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-wine-700 underline underline-offset-4 hover:text-wine-950"
                    >
                      {img.credit.author} · Wikimedia Commons
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}