"use client";
import { useEffect } from "react";

/**
 * Fades and lifts every `[data-reveal]` section in as it enters the viewport.
 * Sections stay fully visible without JavaScript or with reduced motion,
 * because the hidden state only applies under `html.rv-ready`. Sections that
 * appear later (e.g. coaches once their data has loaded) are picked up too,
 * so nothing stays hidden.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const seen = new WeakSet<Element>();
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
    const watch = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        observer.observe(el);
      });
    };
    root.classList.add("rv-ready");
    watch(document);
    // Sections rendered after the first paint (data-driven ones) need watching too.
    const added = new MutationObserver((records) => {
      for (const r of records)
        r.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches("[data-reveal]")) watch(node.parentElement ?? document);
          else watch(node);
        });
    });
    added.observe(document.body, { childList: true, subtree: true });
    return () => {
      added.disconnect();
      observer.disconnect();
      root.classList.remove("rv-ready");
    };
  }, []);
  return null;
}
