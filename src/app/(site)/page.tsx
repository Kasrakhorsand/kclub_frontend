import { Hero } from "@/ui/home/Hero";
import { SportCards } from "@/ui/home/SportCards";
import { About } from "@/ui/home/About";
import { HowTo } from "@/ui/home/HowTo";
import { FreeSlotsToday } from "@/ui/home/FreeSlotsToday";
import { Pricing } from "@/ui/home/Pricing";
import { Gallery } from "@/ui/home/Gallery";
import { CoachesStrip } from "@/ui/home/CoachesStrip";
import { Reviews } from "@/ui/home/Reviews";
import { FinalCta } from "@/ui/home/FinalCta";
import { MobileBookBar } from "@/ui/home/MobileBookBar";
import { RevealOnScroll } from "@/ui/home/RevealOnScroll";
import { SPORTS } from "@/engine/venue";
import { JsonLd } from "@/ui/seo/JsonLd";
import { clubSchema, faqSchema, serviceSchema, websiteSchema } from "@/ui/seo/schema";
import { faqItems } from "@/config/home";
import { loadSiteFacts } from "@/engine/siteFacts";

/**
 * Home, top to bottom: hero, open slots, sports, prices, the club and
 * amenities, photos, coaches, reviews, how-to and FAQ, closing banner.
 */
export default async function HomePage() {
  // Live prices and rules (refreshed every 5 minutes), config as fallback.
  const facts = await loadSiteFacts();
  const faq = faqItems(facts);
  return (
    <>
      <JsonLd data={[clubSchema(facts), websiteSchema(), faqSchema(faq), ...SPORTS.map((s) => serviceSchema(s.id, facts)).filter((x) => x !== null)]} />
      <Hero />
      <FreeSlotsToday />
      <SportCards />
      <Pricing pricing={facts.pricing} />
      <About />
      <Gallery />
      <CoachesStrip />
      <Reviews />
      <HowTo faq={faq} />
      <FinalCta />
      <MobileBookBar />
      <RevealOnScroll />
    </>
  );
}
