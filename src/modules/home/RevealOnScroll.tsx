"use client";
import { useEffect } from "react";

/**
 * Fades and lifts every `[data-reveal]` section in as it enters the viewport.
 * Sections stay fully visible without JavaScript or with reduced motion,
 * because the hidden state only applies under `html.rv-ready`.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    root.classList.add("rv-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          observer.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => {
      observer.disconnect();
      root.classList.remove("rv-ready");
    };
  }, []);
  return null;
}
