"use client";
import { useEffect, useRef, useState } from "react";
import { fa } from "@/engine/format";

const DURATION_MS = 1200;

/**
 * Counts from `from` up to `to` (Persian digits) the first time it scrolls
 * into view. Shows the final value straight away with reduced motion.
 */
export function CountUp({ to, from = 0 }: { to: number; from?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setValue(from);
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - (1 - t) ** 3;
        setValue(Math.round(from + (to - from) * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [from, to]);

  return <span ref={ref}>{fa(value)}</span>;
}
