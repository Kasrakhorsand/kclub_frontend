"use client";
/** Panel frame for every role: side menu with role switch and badges, top bar, and the page area. */
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fa } from "@/engine/format";
import { ROLE_EN, ROLE_FA } from "@/engine/panel/menus";
import { usePanelSession } from "@/engine/panel/usePanelSession";
import { SITE } from "@/config/site";
import { Icon3D } from "@/ui/kit/Icon3D";
import { ThemeButton } from "@/ui/kit/ThemeButton";
import { Brand } from "@/ui/layout/Brand";
import { MENU_ICON } from "@/ui/panel/shell/menuIcons";

/** Drawer-navigation shell shared by the player, front-desk and admin panels. */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const panel = usePanelSession();
  const [open, setOpen] = useState(false); // menu drawer, opened from the top-bar button
  useEffect(() => setOpen(false), [panel.path]);
  // Esc closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!panel.ready) return null;
  const user = panel.user!;
  const role = panel.role!;

  return (
    <div className={clsx("pnl2", open && "open")}>
      <aside className="sb" id="panel-menu" aria-label="منوی پنل">
        <div className="sb-top">
          <Link className="logo" href="/" aria-label="بازگشت به سایت">
            <Brand sub={SITE.panelTagline} />
          </Link>
          <button className="sb-col" onClick={() => setOpen(false)} aria-label="بستن منو">
            ✕
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
              <button key={r} className={clsx("chip", r === role && "on")} onClick={() => panel.switchRole(r)}>
                {ROLE_FA[r]}
              </button>
            ))}
          </div>
        )}
        <nav className="sb-nav">
          {panel.menu.map((m) => {
            const badge = panel.badgeFor(m.key);
            return (
              <Link key={m.key} href={panel.href(m.key)} className={clsx("sb-it", panel.section === m.key && "on", m.soon && "soon")} title={m.label}>
                <Icon3D name={MENU_ICON[m.key] ?? "grid"} className="ic" />
                <span className="sb-hide tl">{m.label}</span>
                {m.soon && <span className="pill sb-hide">به‌زودی</span>}
                {badge > 0 && <span className="cnt">{fa(badge)}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sb-foot">
          <button className="sb-it out" onClick={panel.logout} title="خروج">
            <Icon3D name="door" className="ic" />
            <span className="sb-hide tl">خروج</span>
          </button>
        </div>
      </aside>
      {open && <div className="sb-scrim" onClick={() => setOpen(false)} />}
      <div className="pmain">
        <header className="pbar">
          <button className="sb-burger" onClick={() => setOpen(!open)} aria-label={open ? "بستن منو" : "باز کردن منو"} aria-expanded={open} aria-controls="panel-menu">
            <span className="sb-lines"><span /><span /><span /></span>
            <span className="sb-label">منو</span>
          </button>
          <div className="pbar-title">
            <span className="lat">{ROLE_EN[role]}</span>
            <b>{panel.currentLabel}</b>
          </div>
          <span className="pbar-sp" />
          <ThemeButton />
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
