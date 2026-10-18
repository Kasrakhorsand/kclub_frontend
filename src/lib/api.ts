/**
 * Data access layer.
 * Today it serves sample data from memory. When the backend is ready, set
 * NEXT_PUBLIC_API_URL and replace each function body with a fetch() call —
 * the components only depend on these signatures.
 */
import { COURTS, HOURS, priceOf, seedBookings, USERS, COACHES } from "./mock";
import type { Booking, CartItem, Court, Slot, Sport, User } from "./types";
import { dayKey } from "./format";

const API = process.env.NEXT_PUBLIC_API_URL;
let bookings: Booking[] | null = null;
const db = () => (bookings ??= seedBookings());
const wait = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const isPast = (date: string, hour: number, now = new Date()) => {
  const today = dayKey(now);
  return date < today || (date === today && hour <= now.getHours() - 1);
};

export async function getCourts(sport?: Sport): Promise<Court[]> {
  if (API) return (await fetch(`${API}/courts${sport ? `?sport=${sport}` : ""}`)).json();
  return wait(sport ? COURTS.filter((c) => c.sport === sport) : COURTS);
}

export function takenSync(date: string, courtId: string, hour: number) {
  return db().find((b) => b.date === date && b.courtId === courtId && b.hour === hour && b.status === "active");
}

export async function getSlots(sport: Sport, date: string): Promise<Slot[]> {
  if (API) return (await fetch(`${API}/slots?sport=${sport}&date=${date}`)).json();
  const courts = COURTS.filter((c) => c.sport === sport && c.active);
  return wait(
    HOURS.map((h) => ({
      hour: h,
      past: isPast(date, h),
      price: priceOf(sport, h),
      freeCourts: courts.filter((c) => !takenSync(date, c.id, h)).map((c) => c.id),
    })),
  );
}

/** Number of free sessions on a day (for the date strip). */
export function freeCountSync(sport: Sport, date: string) {
  const courts = COURTS.filter((c) => c.sport === sport && c.active);
  return HOURS.filter((h) => !isPast(date, h) && courts.some((c) => !takenSync(date, c.id, h))).length;
}

export async function getDayBoard(date: string): Promise<Booking[]> {
  if (API) return (await fetch(`${API}/bookings?date=${date}`)).json();
  return wait(db().filter((b) => b.date === date && b.status === "active"));
}

export async function sendOtp(phone: string): Promise<{ ok: boolean }> {
  if (API) return (await fetch(`${API}/auth/otp`, { method: "POST", body: JSON.stringify({ phone }) })).json();
  return wait({ ok: /^09\d{9}$/.test(phone) }, 400);
}

export async function verifyOtp(phone: string, code: string): Promise<{ user: User | null; isNew: boolean }> {
  if (API) return (await fetch(`${API}/auth/verify`, { method: "POST", body: JSON.stringify({ phone, code }) })).json();
  if (code.length !== 5) throw new Error("کد باید ۵ رقم باشد");
  const user = USERS[phone] ?? null;
  return wait({ user, isNew: !user }, 400);
}

export async function createBookings(user: User, items: CartItem[], method: "wallet" | "gateway") {
  if (API)
    return (await fetch(`${API}/bookings`, { method: "POST", body: JSON.stringify({ items, method }) })).json();
  const created = items.map<Booking>((it) => ({
    id: `B-${Date.now()}-${it.courtId}-${it.hour}`,
    courtId: it.courtId,
    date: it.date,
    hour: it.hour,
    userPhone: user.phone,
    userName: `${user.first} ${user.last}`,
    price: it.price,
    source: "online",
    status: "active",
  }));
  db().push(...created);
  return wait({ ok: true, tracking: String(Math.floor(100000 + Math.random() * 899999)), bookings: created }, 600);
}

export async function getCoaches() {
  if (API) return (await fetch(`${API}/coaches`)).json();
  return wait(COACHES);
}
