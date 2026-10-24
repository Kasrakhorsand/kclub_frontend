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

/**
 * Home, top to bottom: hero, open slots, sports, prices, the club and
 * amenities, photos, coaches, reviews, how-to and FAQ, closing banner.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={[clubSchema(), websiteSchema(), faqSchema(), ...SPORTS.map((s) => serviceSchema(s.id)).filter((x) => x !== null)]} />
      <Hero />
      <FreeSlotsToday />
      <SportCards />
      <Pricing />
      <About />
      <Gallery />
      <CoachesStrip />
      <Reviews />
      <HowTo />
      <FinalCta />
      <MobileBookBar />
      <RevealOnScroll />
    </>
  );
}
