import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Booking } from "@/ui/booking/Booking";
import { PRICING, SPORTS, courtsOf, sportById, sportTitle } from "@/engine/venue";
import { toman } from "@/engine/format";
import { SITE } from "@/config/site";
import { JsonLd } from "@/ui/seo/JsonLd";
import { breadcrumbSchema, serviceSchema } from "@/ui/seo/schema";

export function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sport: string }> }): Promise<Metadata> {
  const sport = sportById((await params).sport);
  if (!sport) return {};
  const title = sportTitle(sport);
  const prices = (PRICING[sport.id] ?? []).map((b) => b.price);
  const from = prices.length ? ` از ${toman(Math.min(...prices))} هر سانس.` : "";
  const path = `/book/${sport.id}`;
  return {
    title: `رزرو زمین ${sport.name} در ${SITE.city}`,
    description: `سانس‌های خالی ${title} در ${SITE.name} (${courtsOf(sport.id).length.toLocaleString("fa-IR")} زمین) را ببینید و آنلاین رزرو کنید؛ هر روز ساعت ۸ تا ۲۴.${from}`,
    alternates: { canonical: path },
    openGraph: { url: path, title: `رزرو زمین ${sport.name} | ${SITE.name}` },
  };
}

/** /book/<sport>: the booking flow for one sport from the venue config. */
export default async function BookPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const def = sportById(sport);
  if (!def) notFound();
  const service = serviceSchema(sport);
  return (
    <Suspense>
      <JsonLd data={[breadcrumbSchema([["انتخاب رشته", "/sport"], [`رزرو زمین ${def.name}`, `/book/${sport}`]]), ...(service ? [service] : [])]} />
      <Booking sport={sport} />
    </Suspense>
  );
}
