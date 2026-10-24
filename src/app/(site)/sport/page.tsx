import type { Metadata } from "next";
import { SITE } from "@/config/site";
import { SportPicker } from "@/ui/booking/SportPicker";
import { SPORTS } from "@/engine/venue";
import { JsonLd } from "@/ui/seo/JsonLd";
import { breadcrumbSchema, serviceSchema } from "@/ui/seo/schema";
import { loadSiteFacts } from "@/engine/siteFacts";

export const metadata: Metadata = {
  title: "انتخاب رشته و رزرو زمین",
  description: `پدل، تنیس ساحلی یا والیبال ساحلی؟ رشته را انتخاب کنید و سانس خالی زمین‌های ${SITE.name} در ${SITE.city} را آنلاین رزرو کنید.`,
  alternates: { canonical: "/sport" },
  openGraph: { url: "/sport" },
};

export default async function SportPage() {
  const facts = await loadSiteFacts();
  return (
    <>
      <JsonLd data={[breadcrumbSchema([["انتخاب رشته", "/sport"]]), ...SPORTS.map((s) => serviceSchema(s.id, facts)).filter((x) => x !== null)]} />
      <SportPicker />
    </>
  );
}
