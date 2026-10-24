"use client";
/**
 * Prices on the client: usePrices() reads the public price sheet the admin
 * sets (GET /site/pricing), with the venue config as the first paint. In
 * sample-data mode the admin's rental overrides live in this browser
 * (localStorage "kclub-pricing").
 */
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { getPublicPricing } from "@/engine/api";
import { CONFIG_FACTS, sessionPrice } from "@/engine/siteFacts";
import { persist } from "zustand/middleware";
import { RENTALS } from "@/engine/venue";
import type { CartItem } from "@/engine/types";

type PricingState = {
  /** Rental id → price in toman, when the admin changed it. */
  rentalPrices: Record<string, number>;
  setRentalPrices: (prices: Record<string, number>) => void;
};

export const usePricing = create<PricingState>()(
  persist(
    (set) => ({
      rentalPrices: {},
      setRentalPrices: (prices) => set((s) => ({ rentalPrices: { ...s.rentalPrices, ...prices } })),
    }),
    { name: "kclub-pricing" },
  ),
);

/** Current price of one rental item (admin override, else the config default). */
export const rentalPriceOf = (id: string, overrides: Record<string, number> = usePricing.getState().rentalPrices) =>
  overrides[id] ?? RENTALS.find((r) => r.id === id)?.price ?? 0;

/** Rental cost of one cart item. */
export const rentalCostOf = (item: CartItem, overrides?: Record<string, number>) =>
  Object.entries(item.rentals ?? {}).reduce((sum, [id, qty]) => sum + qty * rentalPriceOf(id, overrides), 0);

/** Court plus rentals for one cart item. */
export const itemTotal = (item: CartItem, overrides?: Record<string, number>) => item.price + rentalCostOf(item, overrides);

/** The current price sheet (sessions per sport and time band, rentals); config until it loads. */
export function usePrices() {
  // Re-read when the sample-data rental overrides change in this browser.
  const local = usePricing((s) => s.rentalPrices);
  const { data } = useQuery({ queryKey: ["site-pricing", local], queryFn: getPublicPricing, staleTime: 5 * 60_000 });
  const sheet = data ?? CONFIG_FACTS.pricing;
  return {
    sheet,
    /** Price of one session of `sport` starting at `hour`. */
    session: (sport: string, hour: number) => sessionPrice(sheet, sport, hour),
    /** Lowest session price of a sport. */
    from: (sport: string) => Math.min(...(sheet.bands[sport] ?? []).map((b) => b.price)),
    rentals: sheet.rentals,
  };
}

/** Current rental prices (rental id → toman). */
export function useRentalPrices() {
  return usePrices().rentals;
}
