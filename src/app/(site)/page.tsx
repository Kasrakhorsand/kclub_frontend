import { Hero } from "@/components/site/Hero";
import { About, HowTo, SportCards } from "@/components/site/HomeSections";

/** Home: hero, sport cards, the club and amenities, how-to and FAQ. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SportCards />
      <About />
      <HowTo />
    </>
  );
}
