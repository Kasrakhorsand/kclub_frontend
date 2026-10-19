import clsx from "clsx";
import { I3, I3_DEFS, type Icon3DName } from "@/modules/ui/icons3d";

/** Shared gradients and shadow filter; render once near the root. */
export function Icon3DDefs() {
  return <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: I3_DEFS }} />;
}

export function Icon3D({ name, className }: { name: Icon3DName; className?: string }) {
  return (
    <span className={clsx("i3", className)}>
      <svg viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<g filter="url(#k3sh)">${I3[name]}</g>` }} />
    </span>
  );
}
