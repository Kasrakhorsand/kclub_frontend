import type { Metadata } from "next";
import { SportPicker } from "@/ui/booking/SportPicker";

export const metadata: Metadata = { title: "انتخاب رشته" };

export default function SportPage() {
  return <SportPicker />;
}
