"use client";
/**
 * What a support report attaches about the device and app, so the support
 * team can reproduce a problem. Only technical facts: no names, phone
 * numbers, cookies, storage or page content. The user sees all of it and can
 * turn it off before sending.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { APP_VERSION } from "@/engine/config";
import type { ClientErrorEntry, Role, SupportDiagnostics } from "@/engine/types";

const MAX_ERRORS = 10;
const MAX_PAGES = 6;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

const errors: ClientErrorEntry[] = [];
const pages: string[] = [];
let installed = false;

/** Keep the last few uncaught browser errors (message only) for support reports. */
function installErrorCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const push = (message: string) => {
    // Drop query strings, which can carry tokens or codes.
    const clean = clip(message.replace(/\?[^\s)]*/g, ""), 300);
    errors.push({ time: new Date().toTimeString().slice(0, 8), page: location.pathname, message: clean });
    if (errors.length > MAX_ERRORS) errors.shift();
  };
  window.addEventListener("error", (e) => push(e.message || "Script error"));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: unknown } | undefined;
    push(typeof r?.message === "string" ? r.message : "Unhandled promise rejection");
  });
}

/** Mount once (EngineProvider): starts error capture and remembers recent in-app pages. */
export function useDiagnosticsCapture() {
  const path = usePathname();
  useEffect(installErrorCapture, []);
  useEffect(() => {
    if (!path || pages[pages.length - 1] === path) return;
    pages.push(clip(path, 120));
    if (pages.length > MAX_PAGES) pages.shift();
  }, [path]);
}

function browserOf(ua: string) {
  const m =
    ua.match(/Edg\/(\d+)/) ? ["Edge", ua.match(/Edg\/(\d+)/)![1]] :
    ua.match(/OPR\/(\d+)/) ? ["Opera", ua.match(/OPR\/(\d+)/)![1]] :
    ua.match(/Firefox\/(\d+)/) ? ["Firefox", ua.match(/Firefox\/(\d+)/)![1]] :
    ua.match(/Chrome\/(\d+)/) ? ["Chrome", ua.match(/Chrome\/(\d+)/)![1]] :
    ua.match(/Version\/(\d+).*Safari/) ? ["Safari", ua.match(/Version\/(\d+)/)![1]] : ["Other", ""];
  return m[1] ? `${m[0]} ${m[1]}` : m[0];
}

function osOf(ua: string) {
  if (/Android (\d+)/.test(ua)) return `Android ${ua.match(/Android (\d+)/)![1]}`;
  if (/(iPhone|iPad).*OS (\d+)/.test(ua)) return `iOS ${ua.match(/OS (\d+)/)![1]}`;
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

/** Snapshot of the device and app right now. */
export function collectDiagnostics(role?: Role | null): SupportDiagnostics {
  const ua = navigator.userAgent;
  const w = window.innerWidth;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return {
    page: location.pathname,
    recentPages: [...pages],
    browser: browserOf(ua),
    os: osOf(ua),
    device: /iPad|Tablet/.test(ua) || (w >= 768 && w < 1024 && navigator.maxTouchPoints > 0) ? "tablet" : /Mobi|Android|iPhone/.test(ua) ? "mobile" : "desktop",
    screen: `${screen.width}×${screen.height}`,
    viewport: `${w}×${window.innerHeight}`,
    pixelRatio: Math.round(window.devicePixelRatio * 100) / 100,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    online: navigator.onLine,
    connection: conn?.effectiveType,
    theme: document.documentElement.dataset.theme,
    role: role ?? undefined,
    appVersion: APP_VERSION,
    reportedAt: new Date().toISOString(),
    recentErrors: [...errors],
  };
}
