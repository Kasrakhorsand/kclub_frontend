/**
 * Prices and booking rules for server-rendered pages (home prices section,
 * FAQ, structured data, llms.txt, page descriptions). Read from the public
 * API and refreshed every 5 minutes; the venue config is the fallback when
 * there's no backend yet or it can't be reached, so pages always render.
 * Client components use usePrices() / usePublicRules() instead.
 */
import { API_URL, USE_MOCK } from "@/engine/config";
import { CANCEL_RULES, HOLD_MINUTES, MAX_DAYS_AHEAD, PRICING, RENTALS } from "@/engine/venue";
import type { PriceSheet, PublicRules } from "@/engine/types";

export type SiteFacts = { pricing: PriceSheet; rules: PublicRules };

/** Seconds a server-rendered page keeps prices and rules before asking again. */
const REVALIDATE = 300;

export const CONFIG_FACTS: SiteFacts = {
  pricing: { bands: PRICING, rentals: Object.fromEntries(RENTALS.map((r) => [r.id, r.price])) },
  rules: { maxDaysAhead: MAX_DAYS_AHEAD, holdMinutes: HOLD_MINUTES, releaseHour: 0, maxActivePerUser: 0, cancelRules: [...CANCEL_RULES] },
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" }, next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadSiteFacts(): Promise<SiteFacts> {
  if (USE_MOCK) return CONFIG_FACTS;
  try {
    const [pricing, rules] = await Promise.all([getJson<PriceSheet>("/site/pricing"), getJson<PublicRules>("/site/rules")]);
    return { pricing, rules };
  } catch {
    return CONFIG_FACTS;
  }
}

/** Price of one session of `sport` starting at `hour`, from a price sheet. */
export const sessionPrice = (pricing: PriceSheet, sport: string, hour: number) =>
  (pricing.bands[sport] ?? []).find((b) => hour >= b.from && hour < b.to)?.price ?? 0;

/** Refund percent for a session under these rules, `now` defaults to the current time. */
export function refundPercentFor(rules: Pick<PublicRules, "cancelRules">, date: string, hour: number, now = Date.now()) {
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`).getTime();
  const hoursLeft = (start - now) / 36e5;
  return [...rules.cancelRules].sort((a, b) => b.hours - a.hours).find((r) => hoursLeft >= r.hours)?.percent ?? 0;
}
