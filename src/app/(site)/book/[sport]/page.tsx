import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Booking } from "@/modules/booking/Booking";
import { SPORTS, sportById, sportTitle } from "@/modules/core/venue";
import { SITE } from "@/config/site";

export function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const sport = sportById((await params).sport);
  if (!sport) return {};
  const title = sportTitle(sport);
  return {
    title: `رزرو زمین ${sport.name}`,
    description: `سانس‌های خالی ${title} در ${SITE.name} را ببینید و آنلاین رزرو کنید.`,
  };
}

/** /book/<sport>: the booking flow for one sport from the venue config. */
export default async function BookPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!sportById(sport)) notFound();
  return (
    <Suspense>
      <Booking sport={sport} />
    </Suspense>
  );
}
