import { Suspense } from "react";
import { PanelView } from "@/components/panel/views";

export default async function PanelSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return (
    <Suspense>
      <PanelView section={section} />
    </Suspense>
  );
}
