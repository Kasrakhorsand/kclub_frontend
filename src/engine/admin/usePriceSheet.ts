"use client";
/**
 * Admin pricing: edit session prices per time band for each sport and the
 * equipment rental prices as one draft, see what changed, and save it.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPriceSheet, savePriceSheet } from "@/engine/api";
import { toLatinDigits } from "@/engine/format";
import type { PriceSheet } from "@/engine/types";

/** Prices are whole toman between 10,000 and 100 million. */
const MIN = 10_000;
const MAX = 100_000_000;
const parse = (text: string) => Number(toLatinDigits(text).replace(/\D/g, "")) || 0;

export function usePriceSheet() {
  const client = useQueryClient();
  const { data: saved, isLoading } = useQuery({ queryKey: ["admin-prices"], queryFn: getPriceSheet });
  const [draft, setDraft] = useState<PriceSheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (saved && !draft) setDraft(structuredClone(saved));
  }, [saved, draft]);

  const sheet = draft ?? saved;
  const changes: { label: string; before: number; after: number }[] = [];
  if (saved && draft) {
    for (const [sport, bands] of Object.entries(draft.bands))
      bands.forEach((b, i) => {
        const was = saved.bands[sport]?.[i]?.price;
        if (was !== undefined && was !== b.price) changes.push({ label: `${sport}|${b.from}|${b.to}`, before: was, after: b.price });
      });
    for (const [id, p] of Object.entries(draft.rentals)) if (saved.rentals[id] !== p) changes.push({ label: `rental|${id}`, before: saved.rentals[id] ?? 0, after: p });
  }
  const invalid = !!sheet && [...Object.values(sheet.bands).flat().map((b) => b.price), ...Object.values(sheet.rentals)].some((p) => p < MIN || p > MAX);

  return {
    loading: isLoading || !sheet, sheet, changes, invalid, busy, error, done,
    setBand: (sport: string, index: number, text: string) => {
      setDone(false);
      setDraft((d) => {
        if (!d) return d;
        const next = structuredClone(d);
        next.bands[sport][index].price = parse(text);
        return next;
      });
    },
    setRental: (id: string, text: string) => {
      setDone(false);
      setDraft((d) => (d ? { ...d, rentals: { ...d.rentals, [id]: parse(text) } } : d));
    },
    reset: () => {
      if (saved) setDraft(structuredClone(saved));
      setError("");
    },
    save: async () => {
      if (!draft || !changes.length) return;
      if (invalid) return setError("هر قیمت باید بین ۱۰ هزار و ۱۰۰ میلیون تومان باشد");
      setBusy(true);
      setError("");
      try {
        await savePriceSheet(draft);
        client.setQueryData(["admin-prices"], draft);
        setDraft(null);
        setDone(true);
        for (const key of [["admin-prices"], ["rental-prices"], ["slots"], ["admin-audit"]]) await client.invalidateQueries({ queryKey: key });
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
  };
}
