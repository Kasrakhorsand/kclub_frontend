/**
 * Data access layer.
 * Today it serves sample data from memory. When the backend is ready, set
 * NEXT_PUBLIC_API_URL and replace each function body with a fetch() call —
 * the components only depend on these signatures.
 */
import { seedBookings, USERS, COACHES } from "@/engine/mock";
import { COURTS, HOURS, priceOf } from "@/engine/venue";
import type { Booking, CartItem, Court, Slot, Sport, User } from "@/engine/types";
import { dayKey } from "@/engine/format";
import { itemTotal } from "@/engine/pricing";

const API = process.env.NEXT_PUBLIC_API_URL;
/** In-memory booking store, seeded lazily on first use. */
let bookings: Booking[] | null = null;
const db = () => (bookings ??= seedBookings());
/** Resolve after a short delay, to mimic network latency. */
const wait = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

/** True once a session has started (an hour that began more than an hour ago, or any earlier day). */
export const isPast = (date: string, hour: number, now = new Date()) => {
  const today = dayKey(now);
  return date < today || (date === today && hour <= now.getHours() - 1);
};

/** Courts, optionally for one sport. */
export async function getCourts(sport?: Sport): Promise<Court[]> {
  if (API) return (await fetch(`${API}/courts${sport ? `?sport=${sport}` : ""}`)).json();
  return wait(sport ? COURTS.filter((c) => c.sport === sport) : COURTS);
}

/** Active booking at this court and hour, if any (mock store only). */
export function takenSync(date: string, courtId: string, hour: number) {
  return db().find((b) => b.date === date && b.courtId === courtId && b.hour === hour && b.status === "active");
}

/** Every opening hour of a day for a sport, with price and free courts. */
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

/** All active bookings on a day (live board). */
export async function getDayBoard(date: string): Promise<Booking[]> {
  if (API) return (await fetch(`${API}/bookings?date=${date}`)).json();
  return wait(db().filter((b) => b.date === date && b.status === "active"));
}

/**
 * Mock password store for development only: SHA-256 hashes in this browser's
 * localStorage. The real backend must hash with a slow algorithm (argon2/bcrypt)
 * server-side; the client only ever sends the password over HTTPS.
 */
const PASSWORDS_KEY = "kclub-mock-passwords";
const readPasswords = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(PASSWORDS_KEY) ?? "{}");
  } catch {
    return {};
  }
};
const sha256 = async (text: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const WRONG_LOGIN = "شماره یا رمز عبور درست نیست";

/** Whether a phone has an account and has set a password (decides which login methods to offer). */
export async function lookupPhone(phone: string): Promise<{ exists: boolean; hasPassword: boolean }> {
  if (API) return (await fetch(`${API}/auth/lookup`, { method: "POST", body: JSON.stringify({ phone }) })).json();
  return wait({ exists: !!USERS[phone], hasPassword: !!readPasswords()[phone] }, 250);
}

/** Log in with phone and password. Throws with a user-facing message when they don't match. */
export async function loginWithPassword(phone: string, password: string): Promise<User> {
  if (API) {
    const res = await fetch(`${API}/auth/password`, { method: "POST", body: JSON.stringify({ phone, password }) });
    if (!res.ok) throw new Error(WRONG_LOGIN);
    return res.json();
  }
  const stored = readPasswords()[phone];
  const user = USERS[phone];
  // Same message whether the phone or the password is wrong, so accounts can't be probed.
  if (!stored || !user || stored !== (await sha256(password))) {
    await wait(null, 500);
    throw new Error(WRONG_LOGIN);
  }
  return wait(user, 300);
}

/**
 * Set or change the signed-in user's password. Changing an existing password
 * needs the current one, unless the session signed in with an SMS code
 * (`viaOtp`; the backend should check that from the session token, not trust it).
 */
export async function setPassword(phone: string, password: string, currentPassword?: string, viaOtp = false): Promise<void> {
  if (API) {
    const res = await fetch(`${API}/auth/set-password`, { method: "POST", body: JSON.stringify({ phone, password, currentPassword }) });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "رمز عبور ذخیره نشد");
    return;
  }
  const all = readPasswords();
  if (all[phone] && !viaOtp && all[phone] !== (await sha256(currentPassword ?? ""))) throw new Error("رمز فعلی درست نیست");
  all[phone] = await sha256(password);
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(all));
  await wait(null, 300);
}

/** Whether the user has a password set. */
export async function hasPassword(phone: string): Promise<boolean> {
  return (await lookupPhone(phone)).hasPassword;
}

/** Send a login code by SMS. */
export async function sendOtp(phone: string): Promise<{ ok: boolean }> {
  if (API) return (await fetch(`${API}/auth/otp`, { method: "POST", body: JSON.stringify({ phone }) })).json();
  return wait({ ok: /^09\d{9}$/.test(phone) }, 400);
}

/** Check the code; `user` is null for a new phone number, which then registers. */
export async function verifyOtp(phone: string, code: string): Promise<{ user: User | null; isNew: boolean }> {
  if (API) return (await fetch(`${API}/auth/verify`, { method: "POST", body: JSON.stringify({ phone, code }) })).json();
  if (code.length !== 5) throw new Error("کد باید ۵ رقم باشد");
  const user = USERS[phone] ?? null;
  return wait({ user, isNew: !user }, 400);
}

/** Pay for the cart and create bookings; returns a tracking code. */
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
    price: itemTotal(it),
    rentals: it.rentals,
    source: "online",
    status: "active",
  }));
  db().push(...created);
  return wait({ ok: true, tracking: String(Math.floor(100000 + Math.random() * 899999)), bookings: created }, 600);
}

/** Coach profiles for the coaches page. */
export async function getCoaches() {
  if (API) return (await fetch(`${API}/coaches`)).json();
  return wait(COACHES);
}
