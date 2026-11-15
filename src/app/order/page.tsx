import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES, contact } from "@/config/site";

export const metadata: Metadata = {
  title: "Order",
  description: "Ordering for delivery and pickup from Empress Delicacies.",
};

/** Phase 2 replaces this with the catalogue, cart and checkout flow. */
export default function OrderPage() {
  return (
    <section className="bg-wine-900 pb-24 pt-40 text-ivory-50">
      <div className="container-x max-w-3xl">
        <p className="eyebrow text-champagne-400">Order</p>
        <h1 className="mt-5 font-serif text-(length:--text-h1) font-light leading-none tracking-tight">
          Online ordering <em className="text-champagne-300">is opening soon.</em>
        </h1>
        <p className="mt-6 text-lg text-ivory-200/85">
          Delivery and pickup ordering is being prepared. Your cart is empty for now. Contact details will be shown here
          once they are confirmed.
        </p>
        <p className="mt-6 text-sm text-ivory-200/70">{contact.phone} · {contact.email}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={ROUTES.menu} variant="gold" size="lg">Browse the menu</ButtonLink>
          <ButtonLink href={ROUTES.home} variant="outline" size="lg">Back to home</ButtonLink>
        </div>
      </div>
    </section>
  );
}
