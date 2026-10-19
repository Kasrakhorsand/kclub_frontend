import type { Metadata } from "next";
import { CoachesPage } from "@/modules/coaches/CoachesPage";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "مربیان",
  description: `معرفی مربیان ${SITE.name}، سابقه، تخصص و هزینه‌ی جلسه‌ی خصوصی.`,
};

export default CoachesPage;
