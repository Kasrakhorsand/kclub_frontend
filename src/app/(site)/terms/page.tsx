import type { Metadata } from "next";
import { TERMS } from "@/config/legal";
import { SITE } from "@/config/site";
import { LegalPage } from "@/ui/legal/LegalPage";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: `قوانین رزرو، لغو و بازگشت وجه، کیف پول و استفاده از ${SITE.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="قوانین و مقررات"
      intro={`قوانین رزرو زمین، لغو و بازگشت وجه، کیف پول و استفاده از امکانات ${SITE.name}.`}
      sections={TERMS}
      other={{ href: "/privacy", label: "حریم خصوصی" }}
    />
  );
}
