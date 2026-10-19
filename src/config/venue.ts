/**
 * Venue setup for this club: sports, courts, prices, opening hours and
 * booking rules. Everything the booking modules need about the physical
 * venue comes from here; a different club only edits this file.
 */
import type { Court, PriceBand, SportDef } from "@/modules/core/types";

export const OPEN_HOUR = 8;
/** Last session ends at this hour (24 = midnight). */
export const CLOSE_HOUR = 24;
/** How far ahead players can book. */
export const MAX_DAYS_AHEAD = 30;
/** Minutes a court is held while the player is at the payment gateway. */
export const HOLD_MINUTES = 10;

/** Refund on cancellation: `percent` back if cancelled at least `hours` before start (first match wins). */
export const CANCEL_RULES = [
  { hours: 24, percent: 100 },
  { hours: 6, percent: 50 },
  { hours: 0, percent: 0 },
];

export const SPORTS: SportDef[] = [
  {
    id: "padel",
    name: "پدل",
    latin: "Padel",
    layout: "padel",
    indoor: true,
    icon: "racket",
    priceNote: "هر سانس یک ساعت · تا ۴ بازیکن",
    games: [{ id: "padel", name: "پدل", latin: "Padel", model: "padel", summary: "۳ زمین سرپوشیده · چمن آبی و مشکی" }],
  },
  {
    id: "beach",
    name: "ساحلی",
    latin: "Beach",
    layout: "sand",
    indoor: false,
    icon: "court",
    priceNote: "هر سانس یک ساعت · زمین ماسه‌ای",
    games: [
      { id: "tennis", name: "تنیس ساحلی", latin: "Beach Tennis", model: "tennis", summary: "۳ زمین ماسه‌ای" },
      { id: "volley", name: "والیبال ساحلی", latin: "Beach Volley", model: "volley", summary: "۳ زمین ماسه‌ای" },
    ],
  },
];

const BLUE_TURF = "#1B4F9C";
const BLACK_TURF = "#111214";
const SAND = "#D7BD86";

export const COURTS: Court[] = [
  { id: "P1", sport: "padel", n: 1, name: "زمین پدل ۱", surface: "چمن آبی", floor: BLUE_TURF, active: true },
  { id: "P2", sport: "padel", n: 2, name: "زمین پدل ۲", surface: "چمن آبی", floor: BLUE_TURF, active: true },
  { id: "P3", sport: "padel", n: 3, name: "زمین پدل ۳", surface: "چمن مشکی", floor: BLACK_TURF, active: true },
  { id: "B1", sport: "beach", n: 1, name: "زمین ساحلی ۱", surface: "ماسه", floor: SAND, active: true },
  { id: "B2", sport: "beach", n: 2, name: "زمین ساحلی ۲", surface: "ماسه", floor: SAND, active: true },
  { id: "B3", sport: "beach", n: 3, name: "زمین ساحلی ۳", surface: "ماسه", floor: SAND, active: true },
];

/** Price per session by sport and start-hour band, in toman. */
export const PRICING: Record<string, PriceBand[]> = {
  padel: [
    { from: 8, to: 12, price: 500_000 },
    { from: 12, to: 24, price: 800_000 },
  ],
  beach: [
    { from: 8, to: 12, price: 400_000 },
    { from: 12, to: 24, price: 600_000 },
  ],
};
