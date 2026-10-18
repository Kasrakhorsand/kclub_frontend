import { Hero } from "@/components/site/Hero";
import { About, HowTo, SportCards } from "@/components/site/HomeSections";
import { FreeSlotsToday } from "@/components/site/home/FreeSlotsToday";
import { Pricing } from "@/components/site/home/Pricing";
import { Gallery } from "@/components/site/home/Gallery";
import { CoachesStrip } from "@/components/site/home/CoachesStrip";
import { Reviews } from "@/components/site/home/Reviews";
import { FinalCta } from "@/components/site/home/FinalCta";
import { MobileBookBar } from "@/components/site/home/MobileBookBar";
import { RevealOnScroll } from "@/components/site/home/RevealOnScroll";

/**
 * Home, top to bottom: hero, open slots, sports, prices, the club and
 * amenities, photos, coaches, reviews, how-to and FAQ, closing banner.
 */
export default function HomePage() {
  return (
    <>
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
