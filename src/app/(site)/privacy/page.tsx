import type { Metadata } from "next";
import { PRIVACY } from "@/config/legal";
import { SITE } from "@/config/site";
import { LegalPage } from "@/ui/legal/LegalPage";
import { JsonLd } from "@/ui/seo/JsonLd";
import { breadcrumbSchema } from "@/ui/seo/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "حریم خصوصی",
  description: `${SITE.name} چه اطلاعاتی از شما نگه می‌دارد، برای چه و چطور از آن محافظت می‌کند.`,
};

export default function PrivacyPage() {
  return (
    <>
    <JsonLd data={breadcrumbSchema([["حریم خصوصی", "/privacy"]])} />
    <LegalPage
      eyebrow="Privacy"
      title="حریم خصوصی"
      intro={`${SITE.name} چه اطلاعاتی از شما نگه می‌دارد، برای چه استفاده می‌کند و چطور از آن محافظت می‌شود.`}
      sections={PRIVACY}
      other={{ href: "/terms", label: "قوانین و مقررات" }}
    />
    </>
  );
}
