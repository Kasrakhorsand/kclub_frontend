/**
 * K Club's schema.org descriptions, built from the site and venue config so
 * prices, hours and courts never drift from what the pages show. Used by
 * <JsonLd> on public pages. Fields we don't know yet (address, phone, map
 * coordinates in config/content.ts) are left out instead of guessed.
 */
import { CONTACT } from "@/config/content";
import { SITE } from "@/config/site";
import { CLOSE_HOUR, OPEN_HOUR, SPORTS, courtsOf, sportTitle } from "@/engine/venue";
import type { SiteFacts } from "@/engine/siteFacts";
import type { Coach } from "@/engine/types";

const abs = (path: string) => `${SITE.url}${path}`;
const CLUB_ID = abs("/#club");
const SITE_ID = abs("/#website");
const hh = (h: number) => `${String(Math.min(h, 23)).padStart(2, "0")}:${h >= 24 ? "59" : "00"}`;
/** Prices are kept in toman; schema.org wants ISO currency (IRR = rial = toman × 10). */
const rial = (toman: number) => toman * 10;

/** The club as a sports venue (a LocalBusiness), for "padel court in Tehran"-style queries. */
export function clubSchema(facts: SiteFacts) {
  const allPrices = Object.values(facts.pricing.bands).flat().map((b) => b.price);
  return {
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    "@id": CLUB_ID,
    name: SITE.name,
    alternateName: SITE.latinName,
    description: SITE.seoDescription,
    url: SITE.url,
    logo: abs(SITE.logo.wordmark),
    image: [abs("/media/hero-poster.jpg"), abs("/media/card-padel.jpg"), abs("/media/card-beach-tennis.jpg"), abs("/media/card-beach-volley.jpg")],
    ...(CONTACT.phone ? { telephone: CONTACT.phone } : {}),
    address: {
      "@type": "PostalAddress",
      ...(CONTACT.address ? { streetAddress: CONTACT.address } : {}),
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
    ...(CONTACT.geo ? { geo: { "@type": "GeoCoordinates", latitude: CONTACT.geo.lat, longitude: CONTACT.geo.lng } } : {}),
    ...(CONTACT.mapUrl ? { hasMap: CONTACT.mapUrl } : {}),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: hh(OPEN_HOUR),
        closes: hh(CLOSE_HOUR),
      },
    ],
    priceRange: `${(Math.min(...allPrices) / 1000).toLocaleString("fa-IR")} تا ${(Math.max(...allPrices) / 1000).toLocaleString("fa-IR")} هزار تومان هر سانس`,
    currenciesAccepted: "IRR",
    paymentAccepted: "کارت بانکی (شتاب)، کیف پول",
    sameAs: [`https://instagram.com/${CONTACT.instagram}`],
    amenityFeature: SPORTS.map((s) => ({
      "@type": "LocationFeatureSpecification",
      name: `${courtsOf(s.id).length.toLocaleString("fa-IR")} زمین ${s.name}${s.indoor ? " سرپوشیده" : ""}`,
      value: true,
    })),
    makesOffer: SPORTS.map((s) => ({ "@type": "Offer", itemOffered: { "@id": abs(`/book/${s.id}#service`) } })),
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE.name,
    alternateName: SITE.latinName,
    url: SITE.url,
    inLanguage: "fa-IR",
    publisher: { "@id": CLUB_ID },
  };
}

/** One bookable service per sport, with an hourly price per time band. */
export function serviceSchema(sportId: string, facts: SiteFacts) {
  const sport = SPORTS.find((s) => s.id === sportId);
  if (!sport) return null;
  return {
    "@type": "Service",
    "@id": abs(`/book/${sport.id}#service`),
    name: `رزرو زمین ${sport.name}`,
    serviceType: `اجاره‌ی زمین ${sportTitle(sport)}`,
    description: `رزرو آنلاین سانس یک‌ساعته‌ی ${sportTitle(sport)} در ${SITE.name}، ${courtsOf(sport.id).length.toLocaleString("fa-IR")} زمین${sport.indoor ? " سرپوشیده" : ""}.`,
    provider: { "@id": CLUB_ID },
    areaServed: { "@type": "City", name: SITE.city },
    url: abs(`/book/${sport.id}`),
    offers: (facts.pricing.bands[sport.id] ?? []).map((band) => ({
      "@type": "Offer",
      name: `سانس ساعت ${band.from} تا ${band.to}`,
      price: rial(band.price),
      priceCurrency: "IRR",
      priceSpecification: { "@type": "UnitPriceSpecification", price: rial(band.price), priceCurrency: "IRR", unitCode: "HUR", unitText: "ساعت" },
      availability: "https://schema.org/InStock",
      url: abs(`/book/${sport.id}`),
    })),
  };
}

export function faqSchema(faq: [string, string][]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Breadcrumbs from home; `trail` is [name, path] pairs after home. */
export function breadcrumbSchema(trail: [string, string][]) {
  const items: [string, string][] = [[SITE.name, "/"], ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
  };
}

/** Published coaches as people who work at the club. */
export function coachesSchema(coaches: Coach[]) {
  return {
    "@type": "ItemList",
    name: `مربیان ${SITE.name}`,
    itemListElement: coaches.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: c.name,
        jobTitle: c.title,
        ...(c.photo && /^https?:/.test(c.photo) ? { image: c.photo } : {}),
        ...(c.bio ? { description: c.bio } : {}),
        knowsAbout: c.tags,
        worksFor: { "@id": CLUB_ID },
      },
    })),
  };
}
