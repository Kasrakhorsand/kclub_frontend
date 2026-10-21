"use client";
/** Admin booking rules: public booking window, gateway hold, daily release hour, per-player limit and cancellation refunds. */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getVenueSettings, saveVenueSettings } from "@/engine/api";
import type { VenueSettings } from "@/engine/types";

export const SETTING_LIMITS = {
  maxDaysAhead: [1, 90],
  holdMinutes: [3, 30],
  releaseHour: [0, 23],
  maxActivePerUser: [0, 50],
} as const;

/** Why these settings can't be saved, or "" when they can. */
function problemOf(s: VenueSettings) {
  for (const [key, [min, max]] of Object.entries(SETTING_LIMITS)) {
    const v = s[key as keyof typeof SETTING_LIMITS];
    if (!Number.isInteger(v) || v < min || v > max) return "یکی از عددها خارج از بازه‌ی مجاز است";
  }
  const rules = [...s.cancelRules].sort((a, b) => b.hours - a.hours);
  if (!rules.length) return "حداقل یک قانون لغو لازم است";
  if (rules.some((r) => r.percent < 0 || r.percent > 100 || r.hours < 0 || r.hours > 168)) return "درصد بین ۰ و ۱۰۰ و ساعت بین ۰ و ۱۶۸ باشد";
  if (new Set(rules.map((r) => r.hours)).size !== rules.length) return "دو قانون با ساعت یکسان دارید";
  if (rules.some((r, i) => i > 0 && r.percent > rules[i - 1].percent)) return "لغو دیرتر نباید بازگشت بیشتری داشته باشد";
  if (rules[rules.length - 1].hours !== 0) return "یک قانون برای «کمتر از …» با ساعت ۰ لازم است";
  return "";
}

export function useVenueSettings() {
  const client = useQueryClient();
  const { data: saved, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: getVenueSettings });
  const [draft, setDraft] = useState<VenueSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (saved && !draft) setDraft(structuredClone(saved));
  }, [saved, draft]);

  const s = draft ?? saved;
  const dirty = !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft);
  const edit = (fn: (d: VenueSettings) => void) => {
    setDone(false);
    setError("");
    setDraft((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      fn(next);
      return next;
    });
  };

  return {
    loading: isLoading || !s, s, dirty, busy, error, done,
    problem: s ? problemOf(s) : "",
    set: (key: keyof typeof SETTING_LIMITS, value: number) => edit((d) => { d[key] = value; }),
    setRule: (i: number, key: "hours" | "percent", value: number) => edit((d) => { d.cancelRules[i][key] = value; }),
    addRule: () => edit((d) => { d.cancelRules.splice(d.cancelRules.length - 1, 0, { hours: 12, percent: 75 }); }),
    removeRule: (i: number) => edit((d) => { d.cancelRules.splice(i, 1); }),
    reset: () => saved && setDraft(structuredClone(saved)),
    save: async () => {
      if (!draft) return;
      const p = problemOf(draft);
      if (p) return setError(p);
      setBusy(true);
      try {
        const sorted = { ...draft, cancelRules: [...draft.cancelRules].sort((a, b) => b.hours - a.hours) };
        await saveVenueSettings(sorted);
        // Show what was saved right away instead of refilling the form from the old cache.
        client.setQueryData(["admin-settings"], sorted);
        setDraft(null);
        setDone(true);
        for (const key of [["admin-settings"], ["admin-audit"], ["availability"]]) await client.invalidateQueries({ queryKey: key });
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
  };
}
