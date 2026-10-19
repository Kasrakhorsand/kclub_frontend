import type { Metadata } from "next";
import { PanelShell } from "@/ui/panel/shell/PanelShell";

export const metadata: Metadata = { title: "پنل کاربری", robots: { index: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
