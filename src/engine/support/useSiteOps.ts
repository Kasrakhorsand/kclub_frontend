"use client";
/**
 * Site operations for the support team: the site-wide status banner, a
 * system health check (backend, its dependencies and the public endpoints
 * the site needs, with response times), and looking a user up by phone.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourts, getHealth, getPublicPricing, getPublicRules, getSiteNotice, getSlots, lookupSupportUser, setSiteNotice } from "@/engine/api";
import { API_URL, APP_VERSION, PAYMENT_HOSTS, USE_MOCK } from "@/engine/config";
import { dayKey, toLatinDigits } from "@/engine/format";
import type { HealthReport, SiteNotice } from "@/engine/types";

const NOTICE_KEY = ["site-notice"];

/** The banner to show now, or null (inactive, empty or past its end time). */
export function useSiteNotice() {
  const { data } = useQuery({ queryKey: NOTICE_KEY, queryFn: getSiteNotice, staleTime: 60_000, refetchInterval: 5 * 60_000 });
  if (!data?.active || !data.text) return null;
  if (data.until && new Date(data.until).getTime() < Date.now()) return null;
  return data;
}

export const NOTICE_LIMIT = 200;

/** Support: write, preview and publish (or take down) the banner. */
export function useNoticeEditor() {
  const client = useQueryClient();
  const { data: current, isLoading } = useQuery({ queryKey: NOTICE_KEY, queryFn: getSiteNotice });
  const [draft, setDraftState] = useState<SiteNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const value: SiteNotice = draft ?? current ?? { active: false, tone: "info", text: "" };

  const save = async (next: SiteNotice, done: string) => {
    setError("");
    setFlash("");
    if (next.active && next.text.trim().length < 5) return setError("متن اطلاعیه را بنویسید");
    if (next.text.length > NOTICE_LIMIT) return setError(`حداکثر ${NOTICE_LIMIT} حرف`);
    if (next.link && !next.link.startsWith("/")) return setError("پیوند باید یک مسیر داخل سایت باشد، مثل /terms");
    setBusy(true);
    try {
      const saved = await setSiteNotice(next);
      client.setQueryData(NOTICE_KEY, saved);
      setDraftState(null);
      setFlash(done);
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    loading: isLoading,
    current,
    value,
    dirty: draft !== null,
    set: (patch: Partial<SiteNotice>) => setDraftState({ ...value, ...patch }),
    reset: () => setDraftState(null),
    busy,
    error,
    flash,
    publish: () => save({ ...value, active: true }, "اطلاعیه روی سایت منتشر شد."),
    takeDown: () => save({ ...value, active: false }, "اطلاعیه برداشته شد."),
  };
}

export type CheckResult = { name: string; ok: boolean; ms: number; detail?: string };

async function timed(name: string, task: () => Promise<unknown>): Promise<CheckResult> {
  const start = performance.now();
  try {
    await task();
    return { name, ok: true, ms: Math.round(performance.now() - start) };
  } catch (ex) {
    return { name, ok: false, ms: Math.round(performance.now() - start), detail: (ex as Error).message };
  }
}

/** Run the health check on demand (and once on open). */
export function useSystemHealth() {
  const { data, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["support-health"],
    queryFn: async () => {
      let backend: HealthReport | null = null;
      const health = await timed("سلامت بک‌اند (/health)", async () => { backend = await getHealth(); });
      const endpoints = await Promise.all([
        timed("زمین‌ها (/courts)", () => getCourts()),
        timed("قیمت‌ها (/site/pricing)", getPublicPricing),
        timed("قوانین (/site/rules)", getPublicRules),
        timed("سانس‌های امروز (/slots)", () => getSlots("padel", dayKey(new Date()))),
        timed("اطلاعیه (/site/notice)", getSiteNotice),
      ]);
      return { health, backend: backend as HealthReport | null, endpoints };
    },
    staleTime: 0,
    gcTime: 0,
  });

  const browser = typeof navigator === "undefined" ? null : { online: navigator.onLine, language: navigator.language, ua: navigator.userAgent };
  const config = [
    { name: "حالت داده", value: USE_MOCK ? "داده‌ی نمونه (بدون بک‌اند)" : "بک‌اند واقعی", ok: !USE_MOCK },
    { name: "آدرس API", value: API_URL || "تنظیم نشده (NEXT_PUBLIC_API_URL)", ok: !!API_URL },
    { name: "درگاه‌های مجاز", value: PAYMENT_HOSTS.join("، ") || "تنظیم نشده", ok: PAYMENT_HOSTS.length > 0 },
    { name: "نسخه‌ی سایت", value: APP_VERSION, ok: APP_VERSION !== "dev" },
  ];

  const slow = (ms: number) => ms > 1500;
  return {
    running: isFetching,
    checkedAt: dataUpdatedAt,
    run: () => refetch(),
    health: data?.health,
    backend: data?.backend ?? null,
    endpoints: data?.endpoints ?? [],
    config,
    browser,
    slow,
    allOk: !!data && data.health.ok && !!data.backend?.ok && data.endpoints.every((e) => e.ok),
  };
}

/** Support: look up one user by phone. */
export function useSupportLookup() {
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const { data, isFetching } = useQuery({ queryKey: ["support-user", query], queryFn: () => lookupSupportUser(query), enabled: !!query });
  return {
    phone,
    setPhone,
    error,
    searching: isFetching,
    searched: !!query,
    user: data ?? null,
    search: () => {
      const p = toLatinDigits(phone).replace(/\D/g, "");
      if (!/^09\d{9}$/.test(p)) return setError("شماره‌ی موبایل ۱۱ رقمی با ۰۹ شروع می‌شود");
      setError("");
      setQuery(p);
    },
  };
}
