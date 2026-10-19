/**
 * Data access layer.
 * Today it serves sample data from memory. When the backend is ready, set
 * NEXT_PUBLIC_API_URL and replace each function body with a fetch() call —
 * the components only depend on these signatures.
 */
import { COACHES, NOTIFS, TICKETS, TXS, USERS, seedBookings } from "@/engine/mock";
import { COURTS, HOURS, priceOf, refundPercent } from "@/engine/venue";
import type { Booking, CartItem, Court, Notif, Role, Slot, Sport, Ticket, TicketCategory, TicketMessage, TicketStatus, Tx, User } from "@/engine/types";
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

/** A user's wallet transactions, newest first. */
export async function getTransactions(phone: string): Promise<Tx[]> {
  if (API) return (await fetch(`${API}/wallet/transactions?phone=${phone}`)).json();
  return wait(TXS.filter((t) => t.phone === phone).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)));
}

/**
 * Start a wallet top-up. The backend returns the bank gateway URL to send the
 * user to; the wallet is credited after the gateway confirms payment.
 */
export async function startTopUp(phone: string, amount: number): Promise<{ gatewayUrl: string | null }> {
  if (API) return (await fetch(`${API}/wallet/topup`, { method: "POST", body: JSON.stringify({ phone, amount }) })).json();
  return wait({ gatewayUrl: null }, 600);
}

/** "HH:mm" for now, used to stamp mock messages. */
const nowTime = () => new Date().toTimeString().slice(0, 5);

/**
 * Cancel a booking. The refund follows CANCEL_RULES and goes to the wallet;
 * returns the percent and amount refunded.
 */
export async function cancelBooking(booking: Booking): Promise<{ refundPercent: number; refundAmount: number }> {
  if (API) return (await fetch(`${API}/bookings/${booking.id}/cancel`, { method: "POST" })).json();
  const percent = refundPercent(booking.date, booking.hour);
  const stored = db().find((b) => b.id === booking.id);
  if (stored) stored.status = "cancelled";
  return wait({ refundPercent: percent, refundAmount: Math.round((booking.price * percent) / 100) }, 400);
}

/** A user's notifications, newest first. */
export async function getNotifications(phone: string): Promise<Notif[]> {
  if (API) return (await fetch(`${API}/notifications?phone=${phone}`)).json();
  // Copies, like a real response: the mock mutates NOTIFS and React Query must see new objects.
  return wait(structuredClone(NOTIFS).sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "")));
}

/** Mark notifications as read (all of them when `ids` is omitted). */
export async function markNotificationsRead(phone: string, ids?: string[]): Promise<void> {
  if (API) {
    await fetch(`${API}/notifications/read`, { method: "POST", body: JSON.stringify({ phone, ids }) });
    return;
  }
  NOTIFS.forEach((n) => {
    if (!ids || ids.includes(n.id)) n.read = true;
  });
  await wait(null, 80);
}

/** Tickets visible to a role: players see their own, staff see everyone's. */
export async function getTickets(phone: string, role: Role): Promise<Ticket[]> {
  if (API) return (await fetch(`${API}/tickets?phone=${phone}&role=${role}`)).json();
  const list = role === "player" ? TICKETS.filter((t) => t.phone === phone) : TICKETS;
  return wait(structuredClone(list).sort((a, b) => b.date.localeCompare(a.date)));
}

/** Open a new ticket with its first message. */
export async function createTicket(phone: string, title: string, category: TicketCategory, text: string): Promise<Ticket> {
  if (API) return (await fetch(`${API}/tickets`, { method: "POST", body: JSON.stringify({ phone, title, category, text }) })).json();
  const ticket: Ticket = {
    id: `T-${1060 + TICKETS.length}`,
    phone,
    title,
    category,
    status: "open",
    date: dayKey(new Date()),
    messages: [{ by: "user", text, time: nowTime() }],
  };
  TICKETS.unshift(ticket);
  return wait(structuredClone(ticket), 300);
}

/** Add a message to a ticket and update its status. */
export async function replyTicket(id: string, by: TicketMessage["by"], text: string): Promise<void> {
  if (API) {
    await fetch(`${API}/tickets/${id}/reply`, { method: "POST", body: JSON.stringify({ by, text }) });
    return;
  }
  const t = TICKETS.find((x) => x.id === id);
  if (!t) throw new Error("تیکت پیدا نشد");
  t.messages.push({ by, text, time: nowTime(), date: dayKey(new Date()) });
  // A player's message reopens the ticket (an escalated one stays with management); a staff reply answers it.
  if (by !== "user") t.status = "answered";
  else if (t.status !== "escalated") t.status = "open";
  await wait(null, 250);
}

/** Change a ticket's status (escalate to admin, close, reopen). */
export async function setTicketStatus(id: string, status: TicketStatus): Promise<void> {
  if (API) {
    await fetch(`${API}/tickets/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    return;
  }
  const t = TICKETS.find((x) => x.id === id);
  if (t) t.status = status;
  await wait(null, 150);
}

/** Save the user's name, email and national ID. */
export async function updateProfile(phone: string, patch: Pick<User, "first" | "last" | "email" | "nationalId">): Promise<void> {
  if (API) {
    const res = await fetch(`${API}/profile`, { method: "PUT", body: JSON.stringify({ phone, ...patch }) });
    if (!res.ok) throw new Error("ذخیره‌ی پروفایل انجام نشد");
    return;
  }
  if (USERS[phone]) Object.assign(USERS[phone], patch);
  await wait(null, 350);
}

/** Coach profiles for the coaches page. */
export async function getCoaches() {
  if (API) return (await fetch(`${API}/coaches`)).json();
  return wait(COACHES);
}
