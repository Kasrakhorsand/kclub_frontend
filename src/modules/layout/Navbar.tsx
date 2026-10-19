"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Brand } from "@/modules/layout/Brand";
import { Button3D, LockIcon } from "@/modules/ui/Buttons";
import { ThemeButton } from "@/modules/ui/ThemeButton";
import { useSession } from "@/modules/core/store";
import { toast } from "@/modules/ui/Toast";
import { NAV_LINKS, NAV_SOON, SITE } from "@/config/site";

/** Floating glass navbar with a sliding gold indicator under the hovered link. */
export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const [solid, setSolid] = useState(false); // opaque background once the page scrolls
  const nav = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const home = path === "/";

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  /** Slide the gold indicator under `el` (or hide it); `instant` skips the transition. */
  const moveTo = (el: HTMLElement | null, instant = false) => {
    const indicator = ind.current;
    if (!indicator || !nav.current) return;
    nav.current.querySelectorAll(".nl").forEach((x) => x.classList.toggle("hot", x === el));
    if (!el) {
      indicator.style.opacity = "0";
      return;
    }
    if (instant) indicator.style.transition = "none";
    indicator.style.opacity = "1";
    indicator.style.width = `${el.offsetWidth}px`;
    indicator.style.height = `${el.offsetHeight}px`;
    indicator.style.transform = `translate(${el.offsetLeft}px,${el.offsetTop}px)`;
    indicator.classList.toggle("lk", el.classList.contains("lock"));
    if (instant) requestAnimationFrame(() => (indicator.style.transition = ""));
  };
  /** The link for the current route, where the indicator rests. */
  const active = () => nav.current?.querySelector<HTMLElement>(".nl.on") ?? null;
  useLayoutEffect(() => moveTo(active(), true), [path]);

  return (
    <>
      <header className={clsx("topbar fl", !home && "opq", solid && "solid")}>
        <div className="navin">
          <Link className="logo" href="/" aria-label={`صفحه اصلی ${SITE.name}`}>
            <Brand sub={SITE.tagline} />
          </Link>
          <nav className="lnk" aria-label="منوی اصلی" ref={nav} onPointerLeave={() => moveTo(active())}>
            <span className="ind" ref={ind} aria-hidden="true" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx("nl", link.match.some((prefix) => path.startsWith(prefix)) && "on")}
                onPointerEnter={(e) => moveTo(e.currentTarget)}
                onFocus={(e) => moveTo(e.currentTarget)}
              >
                {link.label}
              </Link>
            ))}
            {NAV_SOON && (
              <button
                className="nl lock"
                aria-disabled="true"
                onPointerEnter={(e) => moveTo(e.currentTarget)}
                onClick={() => toast(NAV_SOON!.message)}
              >
                <LockIcon />
                {NAV_SOON.label}
              </button>
            )}
          </nav>
          <div className="end">
            <ThemeButton />
            {user ? (
              <Button3D variant="dark" size="sm" onClick={() => router.push("/panel")}>
                پنل من
              </Button3D>
            ) : (
              <Button3D size="sm" href="/login">
                ورود / ثبت‌نام
              </Button3D>
            )}
          </div>
        </div>
      </header>
      {!home && <div className="navspace" />}
    </>
  );
}
