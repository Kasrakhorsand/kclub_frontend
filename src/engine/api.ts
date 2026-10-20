/**
 * Data access layer: the only place that talks to the backend.
 *
 * Each function calls the REST API through `http()` when NEXT_PUBLIC_API_URL
 * is set, and otherwise serves sample data so the UI can be built before the
 * backend exists. The endpoint contract is in docs/api-contract.md.
 *
 * Security rules this file follows (the backend must enforce them too):
 * - Who the user is comes from the session cookie. User endpoints live under
 *   /me and never take a phone or user id from the browser.
 * - The browser never sends prices or totals; the backend prices bookings,
 *   rentals and top-ups itself.
 * - Path segments are URL-encoded; query values go through URLSearchParams.
 */
import { USE_MOCK, SUPPORT_UPLOAD } from "@/engine/config";
import { ApiError, http } from "@/engine/http";
import { COACHES, NOTIFS, SUPPORT, TICKETS, TXS, USERS, seedBookings } from "@/engine/mock";
import { COURTS, HOURS, priceOf, refundPercent } from "@/engine/venue";
import { useSession } from "@/engine/store";
import type { Booking, CartItem, Coach, Court, NewSupportTicket, Notif, PaymentResult, Role, Slot, Sport, SupportAttachment, SupportTicket, Ticket, TicketCategory, TicketStatus, Tx, User } from "@/engine/types";
import { addDays, dayKey } from "@/engine/format";
import { itemTotal } from "@/engine/pricing";

/* ------------------------------------------------------------------ */
/* Mock helpers (sample data only)                                     */
/* ------------------------------------------------------------------ */

/** In-memory booking store, seeded lazily on first use. */
let bookings: Booking[] | null = null;
const db = () => (bookings ??= seedBookings());
/** Resolve after a short delay, to mimic network latency. */
const wait = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));
/** The signed-in user's phone, as the backend would read it from the session. */
const sessionPhone = () => useSession.getState().user?.phone ?? "";
const sessionUser = () => useSession.getState().user;
/** Mock wallet balances per phone, starting from the signed-in user's cached balance. */
const wallets = new Map<string, number>();
const mockWallet = (phone = sessionPhone()) => {
  if (!wallets.has(phone)) wallets.set(phone, USERS[phone]?.wallet ?? sessionUser()?.wallet ?? 0);
  return wallets.get(phone)!;
};
/** "HH:mm" for now, used to stamp mock messages. */
const nowTime = () => new Date().toTimeString().slice(0, 5);
const seg = encodeURIComponent;

/** True once a session has started (an hour that began more than an hour ago, or any earlier day). */
export const isPast = (date: string, hour: number, now = new Date()) => {
  const today = dayKey(now);
  return date < today || (date === today && hour <= now.getHours() - 1);
};

/**
 * Whether a court-hour is already booked, from the sample data.
 * With a real backend this is unknown locally and returns false; the backend
 * rejects taken slots when the booking is placed (409 SLOT_TAKEN).
 */
export function takenSync(date: string, courtId: string, hour: number) {
  if (!USE_MOCK) return undefined;
  return db().find((b) => b.date === date && b.courtId === courtId && b.hour === hour && b.status === "active");
}

/* ------------------------------------------------------------------ */
/* Venue and availability (public)                                     */
/* ------------------------------------------------------------------ */

/** Courts, optionally for one sport. */
export async function getCourts(sport?: Sport): Promise<Court[]> {
  if (!USE_MOCK) return http("/courts", { query: { sport } });
  return wait(sport ? COURTS.filter((c) => c.sport === sport) : COURTS);
}

/** Every opening hour of a day for a sport, with price and free courts. */
export async function getSlots(sport: Sport, date: string): Promise<Slot[]> {
  if (!USE_MOCK) return http("/slots", { query: { sport, date } });
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

/** Free sessions per day for the next `days` days (the booking date strip). */
export async function getAvailability(sport: Sport, days: number): Promise<{ date: string; free: number }[]> {
  if (!USE_MOCK) return http("/availability", { query: { sport, from: dayKey(new Date()), days } });
  const courts = COURTS.filter((c) => c.sport === sport && c.active);
  return Array.from({ length: days }, (_, i) => {
    const date = dayKey(addDays(new Date(), i));
    return { date, free: HOURS.filter((h) => !isPast(date, h) && courts.some((c) => !takenSync(date, c.id, h))).length };
  });
}

/** All active bookings on a day (front desk / admin live board). */
export async function getDayBoard(date: string): Promise<Booking[]> {
  if (!USE_MOCK) return http("/staff/board", { query: { date } });
  return wait(db().filter((b) => b.date === date && b.status === "active"));
}

/** Coach profiles for the coaches page. */
export async function getCoaches(): Promise<Coach[]> {
  if (!USE_MOCK) return http("/coaches");
  return wait(COACHES);
}

/** Current price per item for each rental (set by the admin). */
export async function getRentalPrices(): Promise<Record<string, number>> {
  if (!USE_MOCK) return http("/pricing/rentals");
  return wait({});
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

/**
 * Mock password store for development only: SHA-256 hashes in this browser's
 * localStorage. The real backend hashes with argon2/bcrypt server-side.
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

/**
 * Which login methods to offer for a phone. The backend should rate-limit
 * this and may answer `hasPassword: false` for unknown numbers so it can't be
 * used to list accounts.
 */
export async function lookupPhone(phone: string): Promise<{ hasPassword: boolean }> {
  if (!USE_MOCK) return http("/auth/lookup", { method: "POST", body: { phone } });
  return wait({ hasPassword: !!USERS[phone] && !!readPasswords()[phone] }, 250);
}

/** Log in with phone and password; the backend sets the session cookie. */
export async function loginWithPassword(phone: string, password: string): Promise<User> {
  if (!USE_MOCK) {
    try {
      return await http<User>("/auth/login/password", { method: "POST", body: { phone, password }, silent401: true });
    } catch (ex) {
      // Same message for unknown phone and wrong password.
      if (ex instanceof ApiError && (ex.status === 401 || ex.status === 404)) throw new ApiError(WRONG_LOGIN, ex.status);
      throw ex;
    }
  }
  const stored = readPasswords()[phone];
  const user = USERS[phone];
  if (!stored || !user || stored !== (await sha256(password))) {
    await wait(null, 500);
    throw new ApiError(WRONG_LOGIN, 401);
  }
  return wait(user, 300);
}

/** Send a login code by SMS (the backend rate-limits per phone and IP). */
export async function sendOtp(phone: string): Promise<void> {
  if (!USE_MOCK) return http("/auth/otp/send", { method: "POST", body: { phone } });
  await wait(null, 400);
}

/**
 * Check the code. A known user is logged in (session cookie set); a new
 * number gets a short-lived sign-up session and must call `register()`.
 */
export async function verifyOtp(phone: string, code: string): Promise<{ user: User | null }> {
  if (!USE_MOCK) return http("/auth/otp/verify", { method: "POST", body: { phone, code }, silent401: true });
  if (code.length !== 5) throw new ApiError("کد باید ۵ رقم باشد", 422);
  return wait({ user: USERS[phone] ?? null }, 400);
}

/** Finish sign-up for a new number verified by `verifyOtp` (the phone comes from that sign-up session). */
export async function register(first: string, last: string, phone: string): Promise<User> {
  if (!USE_MOCK) return http("/auth/register", { method: "POST", body: { first, last } });
  const user: User = { phone, first, last, roles: ["player"], wallet: 0 };
  USERS[phone] = user;
  return wait(user, 300);
}

/** The signed-in user from the session cookie, or null when there is none. */
export async function getMe(): Promise<User | null> {
  if (!USE_MOCK) {
    try {
      return await http<User>("/auth/me", { silent401: true });
    } catch (ex) {
      if (ex instanceof ApiError && ex.status === 401) return null;
      throw ex;
    }
  }
  return sessionUser();
}

/** End the session on the server (clears the cookie). */
export async function logout(): Promise<void> {
  if (!USE_MOCK) {
    await http("/auth/logout", { method: "POST", silent401: true }).catch(() => undefined);
    return;
  }
}

/* ------------------------------------------------------------------ */
/* Signed-in user (/me)                                                */
/* ------------------------------------------------------------------ */

/** Whether the signed-in user has set a password. */
export async function hasPassword(): Promise<boolean> {
  if (!USE_MOCK) return (await http<{ hasPassword: boolean }>("/me/password")).hasPassword;
  return !!readPasswords()[sessionPhone()];
}

/**
 * Set or change the password. The backend requires `currentPassword` when a
 * password exists, unless this session was opened with an SMS code (it knows
 * that from the session, not from the browser).
 */
export async function setPassword(password: string, currentPassword?: string): Promise<void> {
  if (!USE_MOCK) return http("/me/password", { method: "PUT", body: { password, currentPassword } });
  const phone = sessionPhone();
  const viaOtp = useSession.getState().loginMethod === "otp";
  const all = readPasswords();
  if (all[phone] && !viaOtp && all[phone] !== (await sha256(currentPassword ?? ""))) throw new ApiError("رمز فعلی درست نیست", 422);
  all[phone] = await sha256(password);
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(all));
  await wait(null, 300);
}

/** Save name, email and national ID; returns the updated user. */
export async function updateProfile(patch: Pick<User, "first" | "last" | "email" | "nationalId">): Promise<User> {
  if (!USE_MOCK) return http("/me/profile", { method: "PUT", body: patch });
  const user = { ...sessionUser()!, ...patch };
  if (USERS[user.phone]) Object.assign(USERS[user.phone], patch);
  return wait(user, 350);
}

/** The signed-in player's bookings: upcoming (soonest first) or past (newest first). */
export async function getMyBookings(scope: "upcoming" | "past"): Promise<Booking[]> {
  if (!USE_MOCK) return http("/me/bookings", { query: { scope } });
  return wait(mockMyBookings(scope));
}

/**
 * Sample data only: the seed gives one name several games a day, so keep one
 * game per day and only every third day, to look like a real player.
 */
function mockMyBookings(scope: "upcoming" | "past") {
  const user = sessionUser();
  if (!user) return [];
  const today = dayKey(new Date());
  const source = scope === "upcoming" ? db() : [-30, -16, -2].flatMap((d) => seedBookings(addDays(new Date(), d)));
  const seen = new Set<string>();
  const mine = source.filter((b) => {
    if (!(b.userName === `${user.first} ${user.last}` || b.userName.startsWith(user.first))) return false;
    if (b.status !== "active" || Number(b.date.slice(8)) % 3 !== 0 || seen.has(b.date)) return false;
    seen.add(b.date);
    return true;
  });
  return scope === "upcoming"
    ? mine.filter((b) => b.date >= today && !isPast(b.date, b.hour)).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)
    : mine.filter((b) => b.date < today && b.date >= dayKey(addDays(new Date(), -30))).sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour);
}

/**
 * Place the cart. Only what was chosen is sent (court, date, hour, game,
 * rentals); the backend prices it, checks the slots are free (409 SLOT_TAKEN
 * otherwise) and either charges the wallet or returns a gateway URL.
 */
export async function createBookings(items: CartItem[], method: "wallet" | "gateway"): Promise<{ tracking: string; gatewayUrl?: string | null }> {
  const order = items.map(({ courtId, date, hour, game, rentals }) => ({ courtId, date, hour, game, rentals }));
  if (!USE_MOCK) return http("/bookings", { method: "POST", body: { items: order, method } });
  const user = sessionUser();
  if (!user) throw new ApiError("ابتدا وارد شوید", 401);
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
  if (method === "wallet") {
    const total = created.reduce((a, b) => a + b.price, 0);
    if (mockWallet() < total) throw new ApiError("موجودی کیف پول کافی نیست", 422, "LOW_BALANCE");
    wallets.set(user.phone, mockWallet() - total);
  }
  db().push(...created);
  return wait({ tracking: String(Math.floor(100000 + Math.random() * 899999)), gatewayUrl: null }, 600);
}

/** Cancel one of the signed-in player's bookings; the refund follows the venue rules. */
export async function cancelBooking(booking: Booking): Promise<{ refundPercent: number; refundAmount: number }> {
  if (!USE_MOCK) return http(`/me/bookings/${seg(booking.id)}/cancel`, { method: "POST" });
  const percent = refundPercent(booking.date, booking.hour);
  const stored = db().find((b) => b.id === booking.id);
  if (stored) stored.status = "cancelled";
  const refundAmount = Math.round((booking.price * percent) / 100);
  wallets.set(sessionPhone(), mockWallet() + refundAmount); // refunds go to the wallet
  return wait({ refundPercent: percent, refundAmount }, 400);
}

/** The signed-in user's wallet transactions, newest first. */
export async function getTransactions(): Promise<Tx[]> {
  if (!USE_MOCK) return http("/me/transactions");
  const phone = sessionPhone();
  return wait(TXS.filter((t) => t.phone === phone).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)));
}

/** The signed-in user's wallet balance (toman), always from the server. */
export async function getWalletBalance(): Promise<number> {
  if (!USE_MOCK) return (await http<{ balance: number }>("/me/wallet")).balance;
  return wait(mockWallet(), 80);
}

/** Start a wallet top-up; returns the bank gateway URL to send the user to. */
export async function startTopUp(amount: number): Promise<{ gatewayUrl: string | null }> {
  if (!USE_MOCK) return http("/me/wallet/topup", { method: "POST", body: { amount } });
  return wait({ gatewayUrl: null }, 600);
}

/** The signed-in user's notifications, newest first. */
export async function getNotifications(): Promise<Notif[]> {
  if (!USE_MOCK) return http("/me/notifications");
  // Copies, like a real response: the mock mutates NOTIFS and React Query must see new objects.
  return wait(structuredClone(NOTIFS).sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "")));
}

/** Mark notifications as read (all of them when `ids` is omitted). */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  if (!USE_MOCK) return http("/me/notifications/read", { method: "POST", body: { ids } });
  NOTIFS.forEach((n) => {
    if (!ids || ids.includes(n.id)) n.read = true;
  });
  await wait(null, 80);
}

/* ------------------------------------------------------------------ */
/* Tickets (the backend scopes the list by the session's role)         */
/* ------------------------------------------------------------------ */

/** Tickets visible to the current user: players see their own, staff see everyone's. */
export async function getTickets(role: Role): Promise<Ticket[]> {
  if (!USE_MOCK) return http("/tickets");
  const phone = sessionPhone();
  const list = role === "player" ? TICKETS.filter((t) => t.phone === phone) : TICKETS;
  return wait(structuredClone(list).sort((a, b) => b.date.localeCompare(a.date)));
}

/** Open a new ticket with its first message (players). */
export async function createTicket(title: string, category: TicketCategory, text: string): Promise<Ticket> {
  if (!USE_MOCK) return http("/tickets", { method: "POST", body: { title, category, text } });
  const ticket: Ticket = {
    id: `T-${1060 + TICKETS.length}`,
    phone: sessionPhone(),
    title,
    category,
    status: "open",
    date: dayKey(new Date()),
    messages: [{ by: "user", text, time: nowTime() }],
  };
  TICKETS.unshift(ticket);
  return wait(structuredClone(ticket), 300);
}

/** Add a message; the backend decides who it is from (user, staff, admin) from the session. */
export async function replyTicket(id: string, text: string): Promise<void> {
  if (!USE_MOCK) return http(`/tickets/${seg(id)}/messages`, { method: "POST", body: { text } });
  const role = useSession.getState().role;
  const by = role === "admin" ? "admin" : role === "secretary" ? "staff" : "user";
  const t = TICKETS.find((x) => x.id === id);
  if (!t) throw new ApiError("تیکت پیدا نشد", 404);
  t.messages.push({ by, text, time: nowTime(), date: dayKey(new Date()) });
  // A player's message reopens the ticket (an escalated one stays with management); a staff reply answers it.
  if (by !== "user") t.status = "answered";
  else if (t.status !== "escalated") t.status = "open";
  await wait(null, 250);
}

/** Change a ticket's status (staff: escalate, close). */
export async function setTicketStatus(id: string, status: TicketStatus): Promise<void> {
  if (!USE_MOCK) return http(`/tickets/${seg(id)}`, { method: "PATCH", body: { status } });
  const t = TICKETS.find((x) => x.id === id);
  if (t) t.status = status;
  await wait(null, 150);
}

/* ===== Technical support: reports go to the website's support team ===== */

/** Multipart body: the JSON fields as "data", each screenshot as a "files" part. */
function supportForm(data: unknown, files: File[]) {
  const form = new FormData();
  form.append("data", JSON.stringify(data));
  for (const f of files) form.append("files", f, f.name);
  return form;
}

/** Mock rows carry the owner's phone; the API never returns it. */
const withoutPhone = ({ phone, ...t }: SupportTicket & { phone: string }): SupportTicket => (void phone, structuredClone(t));

/** Mock only: keep picked files viewable via blob: URLs. */
const mockAttachments = (files: File[]): SupportAttachment[] =>
  files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f) }));

/** The signed-in user's own support reports, newest first. */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  if (!USE_MOCK) return http("/support/tickets");
  const phone = sessionPhone();
  return wait(SUPPORT.filter((t) => t.phone === phone).map(withoutPhone).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
}

/** Send a new report with up to SUPPORT_UPLOAD.maxFiles screenshots. */
export async function createSupportTicket(input: NewSupportTicket, files: File[]): Promise<SupportTicket> {
  if (!USE_MOCK) return http("/support/tickets", { method: "POST", body: supportForm(input, files), timeoutMs: SUPPORT_UPLOAD.timeoutMs });
  const now = new Date();
  const ticket = {
    ...input,
    id: `s${SUPPORT.length + 1}-${now.getTime()}`,
    ref: `SUP-${1019 + SUPPORT.length}`,
    phone: sessionPhone(),
    status: "new" as const,
    date: dayKey(now),
    time: nowTime(),
    attachments: mockAttachments(files),
    messages: [],
  };
  SUPPORT.unshift(ticket);
  return wait(withoutPhone(ticket), 500);
}

/** Add a message (and screenshots) to one of the user's reports; reopens it for support. */
export async function replySupportTicket(id: string, text: string, files: File[]): Promise<void> {
  if (!USE_MOCK) return http(`/support/tickets/${seg(id)}/messages`, { method: "POST", body: supportForm({ text }, files), timeoutMs: SUPPORT_UPLOAD.timeoutMs });
  const t = SUPPORT.find((x) => x.id === id && x.phone === sessionPhone());
  if (!t) throw new ApiError("گزارش پیدا نشد", 404);
  t.messages.push({ by: "user", text, date: dayKey(new Date()), time: nowTime(), attachments: mockAttachments(files) });
  if (t.status !== "in_progress") t.status = "in_progress";
  await wait(null, 300);
}

/** The user marks their report as solved or closes it. */
export async function closeSupportTicket(id: string): Promise<void> {
  if (!USE_MOCK) return http(`/support/tickets/${seg(id)}/close`, { method: "POST" });
  const t = SUPPORT.find((x) => x.id === id && x.phone === sessionPhone());
  if (t) t.status = "closed";
  await wait(null, 150);
}
/* ------------------------------------------------------------------ */
/* Bank gateway return                                                 */
/* ------------------------------------------------------------------ */

/**
 * Result of a gateway payment. The bank calls the backend, the backend
 * verifies the payment with the bank and then sends the user to
 * /payment/return?ref=<ref>. Only this server answer decides what is shown;
 * nothing in the return URL is trusted.
 */
export async function getPaymentResult(ref: string): Promise<PaymentResult> {
  if (!USE_MOCK) return http(`/payments/${seg(ref)}`);
  // Sample data: refs starting with "F" failed, "P" are still being verified, the rest are paid.
  const status = ref.startsWith("F") ? "failed" : ref.startsWith("P") ? "pending" : "paid";
  const kind = ref.includes("TOP") ? "topup" : "booking";
  return wait({ ref, status, kind, amount: 800_000, tracking: status === "paid" && kind === "booking" ? "482139" : undefined, bankRef: "72834910563", wallet: mockWallet() }, 500);
}
