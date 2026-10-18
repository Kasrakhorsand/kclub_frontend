import { Hero } from "@/components/site/Hero";
import { About, HowTo, SportCards } from "@/components/site/HomeSections";

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
