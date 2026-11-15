import type { Metadata } from "next";
import { images } from "@/config/images";

export const metadata: Metadata = { title: "Image credits" };

export default function CreditsPage() {
  return (
    <section className="pb-24 pt-36">
      <div className="container-x max-w-3xl">
        <h1 className="font-serif text-(length:--text-h2) leading-none tracking-tight">Image credits</h1>
        <p className="mt-6 leading-relaxed opacity-80">
          The images on this site are placeholders. They are <strong>not photographs of Empress Delicacies dishes</strong>.
          Images are AI-generated or openly licensed photographs from Wikimedia Commons, and will be replaced with the
          business&apos;s own photography.
        </p>
        <ul className="mt-10 divide-y divide-wine-900/15 border-y border-wine-900/15">
          {Object.entries(images).map(([key, img]) => (
            <li key={key} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:justify-between">
              <span className="font-semibold capitalize">{key.replace(/-/g, " ")}</span>
              {img.credit ? (
                <a href={img.credit.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {img.credit.author} · {img.credit.license} · Wikimedia Commons
                </a>
              ) : (
                <span className="opacity-70">AI-generated illustration</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
