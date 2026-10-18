import type { Metadata } from "next";
import { SportPicker } from "@/components/site/SportPicker";

export const metadata: Metadata = { title: "انتخاب رشته" };

export default function SportPage() {
  return <SportPicker />;
}
