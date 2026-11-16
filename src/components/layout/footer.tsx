import Link from "next/link";
import { contact, navLinks, ROUTES, site, socials } from "@/config/site";
import { categories } from "@/data/catalogue";
import { Logo } from "./logo";
import { CopyrightYear } from "./copyright-year";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="bg-wine-950 text-ivory-50 scroll-mt-16">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        {/* Brand identity */}
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-sm font-serif text-2xl font-light leading-snug text-ivory-200">
            Good Food. Unforgettable Moments.
          </p>
          <p className="mt-4 max-w-sm text-sm text-ivory-200/75 leading-relaxed font-light">
            Handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties prepared to order for delivery across Warri, Effurun, Asaba, Ughelli, and Abraka, as well as prompt customer collection.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-champagne-400">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-champagne-300 hover:underline"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        {/* Navigation & Menu links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5">
          <div>
            <h3 className="eyebrow text-champagne-400">Navigation</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="opacity-80 transition-opacity hover:opacity-100">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={ROUTES.delivery} className="opacity-80 transition-opacity hover:opacity-100">
                  Delivery &amp; Pickup
                </Link>
              </li>
              <li>
                <Link href={ROUTES.reviews} className="opacity-80 transition-opacity hover:opacity-100">
                  Customer Reviews
                </Link>
              </li>
              <li>
                <Link href={ROUTES.order} className="opacity-80 transition-opacity hover:opacity-100">
                  Order Online
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2">
            <h3 className="eyebrow text-champagne-400">Our Menu</h3>
            <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={ROUTES.menu} className="opacity-80 transition-opacity hover:opacity-100">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Operating & Contact Information */}
        <div className="lg:col-span-3">
          <h3 className="eyebrow text-champagne-400">Contact &amp; Hours</h3>
          
          <address className="mt-5 space-y-3 text-sm not-italic opacity-85">
            <p className="flex items-start gap-2.5">
              <Phone className="size-4 shrink-0 text-champagne-400 mt-0.5" />
              <span>{contact.phone}</span>
            </p>
            <p className="flex items-start gap-2.5">
              <Mail className="size-4 shrink-0 text-champagne-400 mt-0.5" />
              <span>{contact.email}</span>
            </p>
            <p className="flex items-start gap-2.5">
              <MapPin className="size-4 shrink-0 text-champagne-400 mt-0.5" />
              <span>{contact.address}</span>
            </p>
          </address>

          <div className="mt-6 border-t border-ivory-50/10 pt-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-champagne-400">
              <Clock className="size-3.5" /> Operating Hours
            </p>
            <dl className="mt-3 space-y-2 text-xs opacity-80">
              {contact.hours.map((h) => (
                <div key={h.day} className="flex justify-between">
                  <dt className="font-medium text-ivory-100">{h.day}</dt>
                  <dd className="text-ivory-300">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Copyright & Legal / Registry bar */}
      <div className="hairline border-t border-ivory-50/10 text-ivory-50/40">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-ivory-50/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© <CopyrightYear /> {site.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href={ROUTES.credits} className="underline-offset-4 hover:underline hover:text-ivory-100">
              Image Credits &amp; Photo Registry
            </Link>
            <Link href={ROUTES.order} className="underline-offset-4 hover:underline hover:text-ivory-100">
              Order Online
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
