import type { Metadata } from "next";
import { CoachesPage } from "@/ui/coaches/CoachesPage";
import { SITE } from "@/config/site";
import { JsonLd } from "@/ui/seo/JsonLd";
import { breadcrumbSchema } from "@/ui/seo/schema";

export const metadata: Metadata = {
  title: "مربیان",
  description: `مربیان پدل و بازی‌های ساحلی ${SITE.name} در ${SITE.city}: سابقه، تخصص، ساعت‌های تدریس و هزینه‌ی جلسه‌ی خصوصی و کلاس گروهی.`,
  alternates: { canonical: "/coaches" },
  openGraph: { url: "/coaches" },
};

export default function Coaches() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([["مربیان", "/coaches"]])} />
      <CoachesPage />
    </>
  );
}
