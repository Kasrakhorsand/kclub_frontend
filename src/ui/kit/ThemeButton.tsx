"use client";
import { useSession } from "@/engine/store";

const SUN = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MOON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" />
  </svg>
);

/** Light/dark toggle; `withLabel` shows the text next to the icon (panel sidebar). */
export function ThemeButton({ withLabel }: { withLabel?: boolean }) {
  const { theme, toggleTheme } = useSession();
  const dark = theme === "dark";
  const label = dark ? "حالت روشن" : "حالت تیره";
  return (
    <button className="themebtn" onClick={toggleTheme} aria-label={label} title={label}>
      {dark ? SUN : MOON}
      {withLabel && <span>{label}</span>}
    </button>
  );
}
