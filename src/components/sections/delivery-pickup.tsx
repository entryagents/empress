import { Bike, Store, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const options = [
  {
    icon: Bike,
    label: "Delivery",
    title: "Brought to your door",
    text: "Choose your meal, tell us where you are and we bring it to you.",
    steps: ["Pick your dishes", "Add your delivery address", "Confirm and wait for your meal"],
    cta: "Order for delivery",
    tone: "bg-wine-800 text-ivory-50",
  },
  {
    icon: Store,
    label: "Pickup",
    title: "Ready when you arrive",
    text: "Order ahead and collect it yourself — no waiting at the counter.",
    steps: ["Pick your dishes", "Choose pickup", "Collect your order from us"],
    cta: "Order for pickup",
    tone: "bg-ivory-200 text-wine-900",
  },
];

export function DeliveryPickup() {
  return (
    <section id="delivery-pickup" className="bg-ivory-100 py-24 lg:py-36">
      <div className="container-x">
        <SectionHeading eyebrow="Delivery & Pickup" title={<>Your meal, <em className="text-wine-600">your way</em></>}>
          Two simple ways to get your food. Choose whichever suits your day.
        </SectionHeading>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:gap-6">
          {options.map((o, i) => (
            <Reveal key={o.label} delay={i * 0.12}>
              <article className={`flex h-full flex-col p-8 sm:p-12 ${o.tone}`}>
                <div className="flex items-center justify-between">
                  <span className="eyebrow">{o.label}</span>
                  <o.icon className="size-9 text-champagne-500" strokeWidth={1.2} aria-hidden />
                </div>
                <h3 className="mt-10 font-serif text-(length:--text-h3) leading-tight">{o.title}</h3>
                <p className="mt-3 max-w-sm opacity-80">{o.text}</p>
                <ol className="mt-8 space-y-4">
                  {o.steps.map((s, n) => (
                    <li key={s} className="flex items-center gap-4 border-t border-current/20 pt-4 text-sm">
                      <span className="font-serif text-2xl italic text-champagne-500">{n + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <ButtonLink
                  href={ROUTES.order}
                  variant={i === 0 ? "gold" : "primary"}
                  size="lg"
                  className="mt-10 self-start"
                >
                  {o.cta} <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                </ButtonLink>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
