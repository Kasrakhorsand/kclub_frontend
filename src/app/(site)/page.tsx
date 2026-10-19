import { Hero } from "@/modules/home/Hero";
import { SportCards } from "@/modules/home/SportCards";
import { About } from "@/modules/home/About";
import { HowTo } from "@/modules/home/HowTo";
import { FreeSlotsToday } from "@/modules/home/FreeSlotsToday";
import { Pricing } from "@/modules/home/Pricing";
import { Gallery } from "@/modules/home/Gallery";
import { CoachesStrip } from "@/modules/home/CoachesStrip";
import { Reviews } from "@/modules/home/Reviews";
import { FinalCta } from "@/modules/home/FinalCta";
import { MobileBookBar } from "@/modules/home/MobileBookBar";
import { RevealOnScroll } from "@/modules/home/RevealOnScroll";

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
