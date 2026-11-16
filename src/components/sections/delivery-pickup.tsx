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

        {/* Configured Delivery Zones Showcase */}
        <div className="mt-12 rounded-[2px] border border-wine-900/10 bg-white p-8 sm:p-10 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-wine-900/10 pb-6">
            <div>
              <span className="eyebrow text-champagne-600">Coverage &amp; Delivery Hubs</span>
              <h3 className="mt-1 font-serif text-2xl font-light text-wine-950">Active Regional Service Zones</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Dispatch Active
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded border border-wine-900/10 bg-ivory-50/70 p-4">
              <h4 className="font-serif font-semibold text-wine-950 text-sm">Warri &amp; Effurun Central</h4>
              <p className="mt-1 text-xs text-wine-700">Airport Road, Effurun GRA, PTI Road, Enerhen, Deco Road, Ekpan, Refinery</p>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-wine-900/10 pt-2 text-wine-800 font-medium">
                <span>Est. Delivery: 35–50 mins</span>
                <span className="font-semibold text-wine-950">₦1,500</span>
              </div>
            </div>

            <div className="rounded border border-wine-900/10 bg-ivory-50/70 p-4">
              <h4 className="font-serif font-semibold text-wine-950 text-sm">Asaba Capital Territory</h4>
              <p className="mt-1 text-xs text-wine-700">Nnebisi Road, Okpanam Road, DBS Road, Summit Road, Dennis Osadebay Way, Cable Point</p>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-wine-900/10 pt-2 text-wine-800 font-medium">
                <span>Est. Delivery: 45–60 mins</span>
                <span className="font-semibold text-wine-950">₦2,500</span>
              </div>
            </div>

            <div className="rounded border border-wine-900/10 bg-ivory-50/70 p-4">
              <h4 className="font-serif font-semibold text-wine-950 text-sm">Ughelli Metropolitan</h4>
              <p className="mt-1 text-xs text-wine-700">Market Road, Otovwodo Junction, Isoko Road, Afiesere, Post Office, Ekuigbo</p>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-wine-900/10 pt-2 text-wine-800 font-medium">
                <span>Est. Delivery: 40–55 mins</span>
                <span className="font-semibold text-wine-950">₦2,000</span>
              </div>
            </div>

            <div className="rounded border border-wine-900/10 bg-ivory-50/70 p-4">
              <h4 className="font-serif font-semibold text-wine-950 text-sm">Abraka University Community</h4>
              <p className="mt-1 text-xs text-wine-700">DELSU Main Gate, Campus 2 &amp; 3, Old Sapele-Agbor Road, Beach Road</p>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-wine-900/10 pt-2 text-wine-800 font-medium">
                <span>Est. Delivery: 45–65 mins</span>
                <span className="font-semibold text-wine-950">₦2,200</span>
              </div>
            </div>

            <div className="rounded border border-wine-900/10 bg-ivory-50/70 p-4 sm:col-span-2 lg:col-span-2">
              <h4 className="font-serif font-semibold text-wine-950 text-sm">Benin City Hub</h4>
              <p className="mt-1 text-xs text-wine-700">Airport Road GRA, Sapele Road, Ring Road, Akpakpava, Uselu, Ekenwan</p>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-wine-900/10 pt-2 text-wine-800 font-medium">
                <span>Est. Delivery: 60–90 mins</span>
                <span className="font-semibold text-wine-950">₦3,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
