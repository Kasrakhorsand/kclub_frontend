"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useSession } from "@/lib/store";
import { jFull, dayKey, fa } from "@/lib/format";
import { NOTIFS, TICKETS } from "@/lib/mock";
import { Brand } from "../site/Brand";
import { ArrowIcon } from "../ui/Buttons";
import { ThemeButton } from "../ui/ThemeButton";
import { MENU_ICON, MENUS, ROLE_EN, ROLE_FA } from "./menus";
import { Icon3D } from "../ui/Icon3D";

/** Side-navigation shell shared by the player, front-desk and admin panels. */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { user, role, setUser, setRole } = useSession();
  const [mini, setMini] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);
  useEffect(() => setOpen(false), [path]);
  if (!ready || !user || !role) return null;

  const page = path.split("/")[2] ?? "dash";
  const menu = MENUS[role];
  const unread = NOTIFS.filter((n) => !n.read).length;
  const openT = TICKETS.filter((t) => (role === "admin" ? t.status === "escalated" : t.status === "open")).length;
  const current = menu.find((m) => m.key === page)?.label ?? "داشبورد";
  const href = (k: string) => (k === "book" ? "/sport" : k === "dash" ? "/panel" : `/panel/${k}`);

  return (
    <div className={clsx("pnl2", mini && "mini", open && "open")}>
      <aside className="sb" aria-label="منوی پنل">
        <div className="sb-top">
          <Link className="logo" href="/" aria-label="بازگشت به سایت">
            <Brand sub="Members Area" />
          </Link>
          <button className="sb-col" onClick={() => setMini(!mini)} aria-label={mini ? "باز کردن منو" : "جمع کردن منو"}>
            <ArrowIcon />
          </button>
        </div>
        <span className="rolebadge sb-hide">{ROLE_EN[role]}</span>
        <div className="sb-me" title={`${user.first} ${user.last}`}>
          <span className="avatar">{user.first[0]}</span>
          <span className="sb-hide">
            <b>
              {user.first} {user.last} {user.vip && <span className="pill ball">VIP</span>}
            </b>
            <span className="xs">پنل {ROLE_FA[role]}</span>
          </span>
        </div>
        {user.roles.length > 1 && (
          <div className="sb-hide" style={{ display: "flex", gap: 6 }}>
            {user.roles.map((r) => (
              <button key={r} className={clsx("chip", r === role && "on")} onClick={() => { setRole(r); router.push("/panel"); }}>
                {ROLE_FA[r]}
              </button>
            ))}
          </div>
        )}
        <nav className="sb-nav">
          {menu.map((m) => {
            const cnt = m.key === "notif" ? unread : m.key === "tickets" && role !== "player" ? openT : 0;
            return (
              <Link key={m.key} href={href(m.key)} className={clsx("sb-it", page === m.key && "on", m.soon && "soon")} title={m.label}>
                <Icon3D name={MENU_ICON[m.key] ?? "grid"} className="ic" />
                <span className="sb-hide tl">{m.label}</span>
                {m.soon && <span className="pill sb-hide">به‌زودی</span>}
                {cnt > 0 && <span className="cnt">{fa(cnt)}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sb-foot">
          <ThemeButton withLabel />
          <button className="sb-it out" onClick={() => { setUser(null); router.push("/"); }} title="خروج">
            <Icon3D name="door" className="ic" />
            <span className="sb-hide tl">خروج</span>
          </button>
        </div>
      </aside>
      {open && <div className="sb-scrim" onClick={() => setOpen(false)} />}
      <div className="pmain">
        <header className="pbar">
          <button className="sb-burger" onClick={() => setOpen(true)} aria-label="باز کردن منو">
            <span />
            <span />
            <span />
          </button>
          <b>{current}</b>
          <span className="pbar-sp" />
          <span className="xs muted">{jFull(dayKey(new Date()))}</span>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

export const PageHead = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="ph">
    <div>
      <h2>{title}</h2>
      {sub && <p className="small muted">{sub}</p>}
    </div>
    {action}
  </div>
);
