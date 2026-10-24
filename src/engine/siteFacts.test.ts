import { describe, expect, it } from "vitest";
import { CONFIG_FACTS, loadSiteFacts, refundPercentFor, sessionPrice } from "@/engine/siteFacts";
import { itemTotal, rentalCostOf } from "@/engine/pricing";
import type { CartItem } from "@/engine/types";

describe("sessionPrice", () => {
  const sheet = { bands: { padel: [{ from: 8, to: 16, price: 500_000 }, { from: 16, to: 24, price: 800_000 }] }, rentals: {} };
  it("finds the band of the hour", () => {
    expect(sessionPrice(sheet, "padel", 8)).toBe(500_000);
    expect(sessionPrice(sheet, "padel", 15)).toBe(500_000);
    expect(sessionPrice(sheet, "padel", 16)).toBe(800_000);
  });
  it("is 0 outside bands or for unknown sports", () => {
    expect(sessionPrice(sheet, "padel", 3)).toBe(0);
    expect(sessionPrice(sheet, "golf", 10)).toBe(0);
  });
  it("config has a price for every opening hour", () => {
    for (const sport of Object.keys(CONFIG_FACTS.pricing.bands)) expect(sessionPrice(CONFIG_FACTS.pricing, sport, 10)).toBeGreaterThan(0);
  });
});

describe("refundPercentFor", () => {
  const rules = { cancelRules: [{ hours: 0, percent: 0 }, { hours: 24, percent: 100 }, { hours: 6, percent: 50 }] };
  const now = new Date("2026-03-01T10:00:00").getTime();
  it("follows the ladder whatever its order", () => {
    expect(refundPercentFor(rules, "2026-03-02", 12, now)).toBe(100);
    expect(refundPercentFor(rules, "2026-03-02", 10, now)).toBe(100);
    expect(refundPercentFor(rules, "2026-03-01", 18, now)).toBe(50);
    expect(refundPercentFor(rules, "2026-03-01", 12, now)).toBe(0);
  });
  it("gives nothing after the start", () => expect(refundPercentFor(rules, "2026-03-01", 9, now)).toBe(0));
});

describe("cart totals", () => {
  const item = { courtId: "P1", date: "2026-03-01", hour: 10, price: 500_000, rentals: { racket: 2 } } as unknown as CartItem;
  it("adds rentals at the given prices", () => {
    expect(rentalCostOf(item, { racket: 100_000 })).toBe(200_000);
    expect(itemTotal(item, { racket: 100_000 })).toBe(700_000);
  });
});

describe("loadSiteFacts", () => {
  it("uses the config without a backend", async () => {
    expect(await loadSiteFacts()).toEqual(CONFIG_FACTS);
  });
});
