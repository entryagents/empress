import Link from "next/link";
import { contact, navLinks, ROUTES, site, socials } from "@/config/site";
import { categories } from "@/data/catalogue";
import { Logo } from "./logo";
import { CopyrightYear } from "./copyright-year";

export function Footer() {
  return (
    <footer id="contact" className="bg-wine-950 text-ivory-50 scroll-mt-16">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-8 max-w-xs font-serif text-2xl leading-snug text-ivory-200">
            Good food. Unforgettable moments.
          </p>
          <ul className="mt-8 space-y-2 text-sm opacity-70">
            {socials.map((s) => (
              <li key={s.name}>
                <span className="font-semibold text-ivory-50">{s.name}</span> — {s.handle}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5">
          <div>
            <h3 className="eyebrow text-champagne-400">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {navLinks.map((l) => (
                <li key={l.label}><Link href={l.href} className="opacity-80 transition-opacity hover:opacity-100">{l.label}</Link></li>
              ))}
              <li><Link href={ROUTES.delivery} className="opacity-80 hover:opacity-100">Delivery &amp; Pickup</Link></li>
              <li><Link href={ROUTES.order} className="opacity-80 hover:opacity-100">Order Now</Link></li>
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h3 className="eyebrow text-champagne-400">Menu</h3>
            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}><Link href={ROUTES.menu} className="opacity-80 transition-opacity hover:opacity-100">{c.name}</Link></li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="lg:col-span-3">
          <h3 className="eyebrow text-champagne-400">Contact &amp; hours</h3>
          <address className="mt-5 space-y-2 text-sm not-italic opacity-80">
            <p>{contact.phone}</p>
            <p>{contact.email}</p>
            <p>{contact.address}</p>
          </address>
          <dl className="mt-6 space-y-3 text-sm">
            {contact.hours.map((h) => (
              <div key={h.day}>
                <dt className="font-semibold">{h.day}</dt>
                <dd className="opacity-70">{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="hairline border-t text-ivory-50/20">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-ivory-50/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© <CopyrightYear /> {site.name}. All rights reserved.</p>
          <Link href={ROUTES.credits} className="underline-offset-4 hover:underline">Image credits &amp; notes</Link>
        </div>
      </div>
    </footer>
  );
}
