"use client";
import Link from "next/link";
import { useRef } from "react";
import clsx from "clsx";

type B3dProps = {
  children: React.ReactNode;
  variant?: "gold" | "dark";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

/** The tactile 3D button from the prototype: tilts toward the pointer and presses down. */
export function Button3D({ children, variant = "gold", size = "md", block, href, onClick, disabled, type = "button" }: B3dProps) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--tx", `${(((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(1)}deg`);
    el.style.setProperty("--ty", `${(-((e.clientY - r.top) / r.height - 0.5) * 14).toFixed(1)}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty("--tx", "0deg");
    ref.current?.style.setProperty("--ty", "0deg");
  };
  const cls = clsx("b3d", variant === "dark" && "dark", size !== "md" && size, block && "blk");
  const inner = <span>{children}</span>;
  if (href)
    return (
      <Link href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={cls} onPointerMove={move} onPointerLeave={leave}>
        {inner}
      </Link>
    );
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} className={cls} onClick={onClick} disabled={disabled} onPointerMove={move} onPointerLeave={leave}>
      {inner}
    </button>
  );
}

export const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Round black back button with a gold arrow. */
export function BackButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="bk">
      <i>
        <ArrowIcon />
      </i>
      <span>{children}</span>
    </Link>
  );
}

export const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
