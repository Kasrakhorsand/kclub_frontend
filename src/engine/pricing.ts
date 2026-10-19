"use client";
/**
 * Prices the admin can change from the panel. Until the backend stores
 * them, overrides are kept in this browser (localStorage "kclub-pricing").
 */
import { create } from "zustand";
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

/** Subscribe to price changes and get the current rental prices map. */
export const useRentalPrices = () => usePricing((s) => s.rentalPrices);
