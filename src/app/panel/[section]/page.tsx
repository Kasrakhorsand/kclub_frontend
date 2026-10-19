import { Suspense } from "react";
import { PanelView } from "@/ui/panel/views";

/** /panel/<section>: the role-aware router decides what to render. */
export default async function PanelSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return (
    <Suspense>
      <PanelView section={section} />
    </Suspense>
  );
}
