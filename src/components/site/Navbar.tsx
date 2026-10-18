"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Brand } from "./Brand";
import { Button3D, LockIcon } from "../ui/Buttons";
import { ThemeButton } from "../ui/ThemeButton";
import { useSession } from "@/lib/store";
import { toast } from "../ui/Toast";

const LINKS = [
  { href: "/sport", label: "رزرو زمین", match: ["/sport", "/book"] },
  { href: "/coaches", label: "معرفی مربیان", match: ["/coaches"] },
  { href: "/#how", label: "راهنمای رزرو", match: [] as string[] },
];

/** Floating glass navbar with a sliding gold indicator under the hovered link. */
export function Navbar() {
  const path = usePathname();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const [solid, setSolid] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const home = path === "/";

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const moveTo = (el: HTMLElement | null, instant = false) => {
    const i = ind.current;
    if (!i || !nav.current) return;
    nav.current.querySelectorAll(".nl").forEach((x) => x.classList.toggle("hot", x === el));
    if (!el) {
      i.style.opacity = "0";
      return;
    }
    if (instant) i.style.transition = "none";
    i.style.opacity = "1";
    i.style.width = `${el.offsetWidth}px`;
    i.style.height = `${el.offsetHeight}px`;
    i.style.transform = `translate(${el.offsetLeft}px,${el.offsetTop}px)`;
    i.classList.toggle("lk", el.classList.contains("lock"));
    if (instant) requestAnimationFrame(() => (i.style.transition = ""));
  };
  const active = () => nav.current?.querySelector<HTMLElement>(".nl.on") ?? null;
  useLayoutEffect(() => moveTo(active(), true), [path]);

  return (
    <>
      <header className={clsx("topbar fl", !home && "opq", solid && "solid")}>
        <div className="navin">
          <Link className="logo" href="/" aria-label="صفحه اصلی کی کلاب">
            <Brand sub="Padel · Beach Club" />
          </Link>
          <nav className="lnk" aria-label="منوی اصلی" ref={nav} onPointerLeave={() => moveTo(active())}>
            <span className="ind" ref={ind} aria-hidden="true" />
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx("nl", l.match.some((m) => path.startsWith(m)) && "on")}
                onPointerEnter={(e) => moveTo(e.currentTarget)}
                onFocus={(e) => moveTo(e.currentTarget)}
              >
                {l.label}
              </Link>
            ))}
            <button
              className="nl lock"
              aria-disabled="true"
              onPointerEnter={(e) => moveTo(e.currentTarget)}
              onClick={() => toast("فروشگاه در فاز بعدی باز می‌شود")}
            >
              <LockIcon />
              فروشگاه
            </button>
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
