"use client";
/** Admin revenue for a chosen period: daily series per sport, totals, per-court revenue and utilisation. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRevenue } from "@/engine/api";
import { HOURS, SPORTS } from "@/engine/venue";
import { useCourts } from "@/engine/useCourts";

export const REVENUE_PERIODS = [7, 30, 90] as const;
export type RevenuePeriod = (typeof REVENUE_PERIODS)[number];

export function useRevenue(initial: RevenuePeriod = 30) {
  const [days, setDays] = useState<RevenuePeriod>(initial);
  const { data, isLoading } = useQuery({ queryKey: ["admin-revenue", days], queryFn: () => getRevenue(days), staleTime: 60_000 });

  const courts = useCourts().map((court) => {
    const hours = data?.hoursByCourt[court.id] ?? 0;
    return { court, revenue: data?.byCourt[court.id] ?? 0, hours, utilisation: Math.round((hours / (HOURS.length * days)) * 100) };
  });

  return {
    days, setDays, loading: isLoading, report: data,
    sports: SPORTS.map((s) => ({ sport: s, revenue: data?.bySport[s.id] ?? 0 })),
    courts,
    avgPerDay: data ? data.total / days : 0,
    /** Chart rows: one per day, millions of toman per sport. */
    series: (data?.days ?? []).map((d) => ({ date: d.date, ...Object.fromEntries(SPORTS.map((s) => [s.id, (d.bySport[s.id] ?? 0) / 1e6])) })),
  };
}
