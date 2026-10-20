"use client";
/**
 * Light/dark switch: a track with a sun and a moon and a knob that slides
 * between them. The page cross-fades to the new theme where the browser
 * supports view transitions (skipped with reduced motion).
 * Styles: base.css ("tswitch").
 */
import { flushSync } from "react-dom";
import { useSession } from "@/engine/store";

const Sun = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
  </svg>
);

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => unknown };

export function ThemeButton() {
  const theme = useSession((s) => s.theme);
  const toggleTheme = useSession((s) => s.toggleTheme);
  const dark = theme === "dark";
  const label = dark ? "رفتن به حالت روشن" : "رفتن به حالت تیره";

  const toggle = () => {
    const doc = document as ViewTransitionDoc;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) return toggleTheme();
    // Apply the theme inside the transition so the browser can cross-fade old and new.
    doc.startViewTransition(() => {
      flushSync(toggleTheme);
      document.documentElement.dataset.theme = useSession.getState().theme;
    });
  };

  return (
    <button type="button" role="switch" aria-checked={dark} aria-label={label} title={label} className="tswitch" data-mode={theme} onClick={toggle}>
      <span className="tswitch-track" aria-hidden="true">
        <span className="tswitch-icon sun"><Sun /></span>
        <span className="tswitch-icon moon"><Moon /></span>
        <span className="tswitch-knob">
          <span className="sun"><Sun /></span>
          <span className="moon"><Moon /></span>
        </span>
      </span>
    </button>
  );
}
