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
import { CONTENT_UPLOAD, USE_MOCK, SUPPORT_UPLOAD } from "@/engine/config";
import { ApiError, http } from "@/engine/http";
import { AUDIT, COACHES, NOTIFS, SUPPORT, TICKETS, TXS, USERS, seedBookings } from "@/engine/mock";
import { courtById, COURTS, HOURS, priceOf, refundPercent } from "@/engine/venue";
import { useSession } from "@/engine/store";
import type { Album, Audit, Booking, CartItem, CashReport, Closure, Coach, CoachInput, Court, CustomerDetail, CustomerFilter, CustomerRow, DeskBookingInput, DeskBookingResult, DeskCustomer, DeskMethod, MediaItem, NewClosure, NewSupportTicket, Notif, PaymentResult, PriceSheet, RevenueReport, Role, Slot, Sport, StaffMember, StaffPermission, SupportAttachment, SupportTicket, Ticket, TicketCategory, TicketStatus, Tx, User, VenueSettings } from "@/engine/types";
import { addDays, dayKey, hm, toLatinDigits } from "@/engine/format";
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
  return wait(structuredClone(db().filter((b) => b.date === date && b.status === "active")));
}

/** Front desk: look a customer up by phone; null if they have no account yet. */
export async function findCustomer(phone: string): Promise<DeskCustomer | null> {
  if (!USE_MOCK) return http<DeskCustomer | null>("/staff/customers", { query: { phone } }).catch((ex) => (ex instanceof ApiError && ex.status === 404 ? null : Promise.reject(ex)));
  const u = USERS[phone];
  if (!u) return wait(null, 150);
  const today = dayKey(new Date());
  const upcoming = db().filter((b) => b.userPhone === phone && b.status === "active" && b.date >= today).length;
  return wait({ phone, first: u.first, last: u.last, wallet: mockWallet(phone), vip: u.vip, upcoming }, 150);
}

/**
 * Front desk: book court-hours for a customer (creating the account if the
 * phone is new). The backend prices it, checks every slot (409 SLOT_TAKEN),
 * charges the wallet or texts a payment link, and sends the confirmation SMS.
 */
export async function createDeskBooking(input: DeskBookingInput): Promise<DeskBookingResult> {
  if (!USE_MOCK) return http("/staff/bookings", { method: "POST", body: input });
  for (const it of input.items)
    if (takenSync(it.date, it.courtId, it.hour)) throw new ApiError("یکی از سانس‌ها همین الان رزرو شد", 409, "SLOT_TAKEN");
  const name = USERS[input.phone] ? `${USERS[input.phone].first} ${USERS[input.phone].last}` : `${input.first ?? ""} ${input.last ?? ""}`.trim();
  const created = input.items.map<Booking>((it) => ({
    id: `B-${Date.now()}-${it.courtId}-${it.date}-${it.hour}`,
    courtId: it.courtId, date: it.date, hour: it.hour,
    userPhone: input.phone, userName: name || input.phone,
    price: itemTotal({ ...it, price: priceOf(courtById(it.courtId)!.sport, it.hour) }),
    rentals: it.rentals, source: "staff", status: "active",
  }));
  const total = created.reduce((a, b) => a + b.price, 0);
  if (input.payment === "wallet") {
    if (mockWallet(input.phone) < total) throw new ApiError("موجودی کیف پول مشتری کافی نیست", 422, "LOW_BALANCE");
    wallets.set(input.phone, mockWallet(input.phone) - total);
  }
  db().push(...created);
  return wait({ tracking: String(Math.floor(100000 + Math.random() * 899999)), total, count: created.length }, 500);
}

/** Front desk: mark a booking's player as arrived. */
export async function checkInBooking(id: string): Promise<void> {
  if (!USE_MOCK) return http(`/staff/bookings/${seg(id)}/checkin`, { method: "POST" });
  const b = db().find((x) => x.id === id);
  if (b) b.checkedIn = true;
  await wait(null, 200);
}

/** Coach profiles for the coaches page. */
export async function getCoaches(): Promise<Coach[]> {
  if (!USE_MOCK) return http("/coaches");
  // Public: published profiles in page order (photos replaced from the panel stay in memory in sample data).
  return wait(mockCoaches().filter((c) => c.published));
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
/* ------------------------------------------------------------------ */
/* Front desk: customers, wallet operations, transactions, cash drawer */
/* ------------------------------------------------------------------ */

const DESK_METHOD_FA: Record<DeskMethod, string> = { pos: "کارتخوان", cash: "نقدی" };
/** Mock: who is at the desk, as "منشی: name". */
const deskActor = () => {
  const u = sessionUser();
  return u ? `${u.roles.includes("admin") ? "مدیر" : "منشی"}: ${u.first} ${u.last}` : "منشی";
};
const nameOf = (phone: string) => (USERS[phone] ? `${USERS[phone].first} ${USERS[phone].last}` : db().find((b) => b.userPhone === phone)?.userName ?? phone);

function mockCustomerRow(phone: string): CustomerRow {
  const u = USERS[phone];
  const today = dayKey(new Date());
  const mine = db().filter((b) => b.userPhone === phone && b.status === "active");
  const [first, ...rest] = (u ? `${u.first} ${u.last}` : nameOf(phone)).split(" ");
  return {
    phone,
    first: u?.first ?? first,
    last: u?.last ?? rest.join(" "),
    wallet: mockWallet(phone),
    vip: u?.vip,
    roles: u?.roles ?? ["player"],
    upcoming: mine.filter((b) => b.date >= today).length,
    totalBookings: mine.length,
    lastVisit: mine.filter((b) => b.date <= today).map((b) => b.date).sort().pop(),
  };
}

/** Front desk: customers, searched by name or phone, with a quick filter. */
export async function getCustomers(q: string, filter: CustomerFilter): Promise<CustomerRow[]> {
  if (!USE_MOCK) return http("/staff/customers/list", { query: { q, filter } });
  const phones = new Set([...Object.keys(USERS), ...db().map((b) => b.userPhone)]);
  const needle = toLatinDigits(q.trim()).toLowerCase();
  const rows = [...phones]
    .map(mockCustomerRow)
    .filter((c) => !needle || c.phone.includes(needle) || `${c.first} ${c.last}`.includes(q.trim()))
    // The backend scopes by role: the front desk sees players only, admin sees staff accounts too.
    .filter((c) => useSession.getState().role === "admin" || (c.roles.length === 1 && c.roles[0] === "player"))
    .filter((c) => (filter === "vip" ? c.vip : filter === "upcoming" ? c.upcoming > 0 : filter === "inactive" ? !c.upcoming : true))
    .sort((a, b) => b.upcoming - a.upcoming || `${a.first}${a.last}`.localeCompare(`${b.first}${b.last}`, "fa"));
  return wait(rows, 150);
}

/** Front desk: one customer's bookings and wallet history. */
export async function getCustomerDetail(phone: string): Promise<CustomerDetail> {
  if (!USE_MOCK) return http(`/staff/customers/${seg(phone)}`);
  const today = dayKey(new Date());
  const mine = db().filter((b) => b.userPhone === phone && b.status === "active");
  return wait(structuredClone({
    customer: mockCustomerRow(phone),
    upcoming: mine.filter((b) => b.date > today || (b.date === today && !isPast(b.date, b.hour))).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour),
    recent: mine.filter((b) => b.date < today || (b.date === today && isPast(b.date, b.hour))).sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour).slice(0, 10),
    transactions: TXS.filter((t) => t.phone === phone).sort((a, b) => b.date.localeCompare(a.date)),
  }), 150);
}

/** Front desk: top up (charge) or pay back (refund) a customer's wallet at the desk. */
export async function deskWalletOp(phone: string, kind: "charge" | "refund", amount: number, method: DeskMethod, note?: string): Promise<{ balance: number }> {
  if (!USE_MOCK) return http(`/staff/customers/${seg(phone)}/wallet`, { method: "POST", body: { kind, amount, method, note } });
  const balance = mockWallet(phone);
  if (kind === "refund" && amount > balance) throw new ApiError("مبلغ بیشتر از موجودی کیف پول است", 422, "LOW_BALANCE");
  const next = kind === "charge" ? balance + amount : balance - amount;
  wallets.set(phone, next);
  TXS.unshift({
    id: `TX-${Date.now()}`, date: dayKey(new Date()), phone, type: kind === "charge" ? "charge" : "refund",
    amount: kind === "charge" ? amount : -amount,
    desc: note || (kind === "charge" ? "شارژ حضوری" : "برگشت وجه از کیف پول"),
    method: DESK_METHOD_FA[method], actor: deskActor(),
  });
  return wait({ balance: next }, 300);
}

/** Front desk / admin: all wallet transactions in a date range, newest first. */
export async function getAllTransactions(from: string, to: string): Promise<Tx[]> {
  if (!USE_MOCK) return http("/staff/transactions", { query: { from, to } });
  return wait(structuredClone(TXS.filter((t) => t.date >= from && t.date <= to).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map((t) => ({ ...t, userName: nameOf(t.phone) }))), 150);
}

/** Mock: closed drawers per date. */
const drawers = new Map<string, NonNullable<CashReport["closed"]>>();

/** Front desk: what the signed-in desk user took and paid back on a day, by method. */
export async function getCashReport(date: string): Promise<CashReport> {
  if (!USE_MOCK) return http("/staff/cash", { query: { date } });
  const me = deskActor();
  const rows = TXS.filter((t) => t.date === date && t.actor === me).map((t) => ({ ...t, userName: nameOf(t.phone) }));
  const methods = [...new Set(rows.map((t) => t.method))];
  const byMethod = methods.map((method) => {
    const of = rows.filter((t) => t.method === method);
    // Desk money: a charge or a desk-paid booking comes in; a refund goes out.
    return {
      method,
      received: of.filter((t) => t.type !== "refund").reduce((a, t) => a + Math.abs(t.amount), 0),
      refunded: of.filter((t) => t.type === "refund").reduce((a, t) => a + Math.abs(t.amount), 0),
      count: of.length,
    };
  });
  const cash = byMethod.find((m) => m.method === DESK_METHOD_FA.cash);
  return wait(structuredClone({
    date, rows, byMethod,
    received: byMethod.reduce((a, m) => a + m.received, 0),
    refunded: byMethod.reduce((a, m) => a + m.refunded, 0),
    expectedCash: (cash?.received ?? 0) - (cash?.refunded ?? 0),
    closed: drawers.get(date),
  }), 150);
}

/** Front desk: count the cash drawer and close the day. */
export async function closeCashDrawer(date: string, counted: number, note?: string): Promise<void> {
  if (!USE_MOCK) return http("/staff/cash/close", { method: "POST", body: { date, counted, note } });
  const report = await getCashReport(date);
  drawers.set(date, { counted, difference: counted - report.expectedCash, at: new Date().toTimeString().slice(0, 5), note });
  await wait(null, 200);
}

/** Front desk: cancel a booking for a customer; the refund follows the venue rules unless `fullRefund`. */
export async function deskCancelBooking(id: string, reason: string, fullRefund = false): Promise<{ refundAmount: number }> {
  if (!USE_MOCK) return http(`/staff/bookings/${seg(id)}/cancel`, { method: "POST", body: { reason, fullRefund } });
  const b = db().find((x) => x.id === id);
  if (!b) throw new ApiError("رزرو پیدا نشد", 404);
  b.status = "cancelled";
  const refundAmount = fullRefund ? b.price : Math.round((b.price * refundPercent(b.date, b.hour)) / 100);
  if (refundAmount) {
    wallets.set(b.userPhone, mockWallet(b.userPhone) + refundAmount);
    TXS.unshift({ id: `TX-${Date.now()}`, date: dayKey(new Date()), phone: b.userPhone, type: "refund", amount: refundAmount, desc: `بازگشت وجه لغو ${courtById(b.courtId)?.name ?? ""} · ${reason}`, method: "کیف پول", actor: deskActor() });
  }
  return wait({ refundAmount }, 300);
}
/* ------------------------------------------------------------------ */
/* Admin: revenue, courts, closures, pricing, settings, audit          */
/* ------------------------------------------------------------------ */

/** Admin: revenue for the last `days` days (bookings by start date, cancelled ones excluded). */
export async function getRevenue(days: number): Promise<RevenueReport> {
  if (!USE_MOCK) return http("/admin/revenue", { query: { days } });
  const start = addDays(new Date(), -days + 1);
  const from = dayKey(start);
  const to = dayKey(new Date());
  // Sample data: seedBookings covers two weeks from its start, so stitch windows together.
  const windows = Array.from({ length: Math.ceil(days / 14) + 1 }, (_, i) => seedBookings(addDays(start, i * 14)));
  const seen = new Set<string>();
  const list = [...windows.flat(), ...db()].filter((b) => {
    const key = `${b.date}|${b.courtId}|${b.hour}`;
    if (b.status !== "active" || b.date < from || b.date > to || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sportOf = (courtId: string) => courtById(courtId)?.sport ?? "";
  const daysOut = Array.from({ length: days }, (_, i) => {
    const date = dayKey(addDays(start, i));
    const of = list.filter((b) => b.date === date);
    const bySport: Record<string, number> = {};
    for (const b of of) bySport[sportOf(b.courtId)] = (bySport[sportOf(b.courtId)] ?? 0) + b.price;
    return { date, bySport, bookings: of.length };
  });
  const bySport: Record<string, number> = {};
  const byCourt: Record<string, number> = {};
  const hoursByCourt: Record<string, number> = {};
  for (const b of list) {
    bySport[sportOf(b.courtId)] = (bySport[sportOf(b.courtId)] ?? 0) + b.price;
    byCourt[b.courtId] = (byCourt[b.courtId] ?? 0) + b.price;
    hoursByCourt[b.courtId] = (hoursByCourt[b.courtId] ?? 0) + 1;
  }
  return wait({
    days: daysOut, bySport, byCourt, hoursByCourt,
    total: list.reduce((a, b) => a + b.price, 0),
    onlineShare: list.length ? list.filter((b) => b.source === "online").length / list.length : 0,
    bookings: list.length,
  }, 200);
}

/** Mock: admin changes kept in memory. */
const adminState = {
  courts: new Map<string, boolean>(),
  closures: [] as Closure[],
  bands: null as PriceSheet["bands"] | null,
  settings: null as VenueSettings | null,
};

/** Admin: every court with its active flag. */
export async function getAdminCourts(): Promise<Court[]> {
  if (!USE_MOCK) return http("/admin/courts");
  return wait(COURTS.map((c) => ({ ...c, active: adminState.courts.get(c.id) ?? c.active })), 100);
}

/** Admin: show or hide a court in online booking. */
export async function setCourtActive(id: string, active: boolean): Promise<void> {
  if (!USE_MOCK) return http(`/admin/courts/${seg(id)}`, { method: "PATCH", body: { active } });
  adminState.courts.set(id, active);
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: active ? "فعال کردن زمین" : "غیرفعال کردن زمین", target: courtById(id)?.name ?? id, detail: active ? "نمایش در رزرو آنلاین" : "حذف از رزرو آنلاین" });
  await wait(null, 150);
}

/** Bookings a closure would cancel. */
const closureHits = (c: Pick<Closure, "courtIds" | "date" | "from" | "to">) =>
  db().filter((b) => b.status === "active" && b.date === c.date && c.courtIds.includes(b.courtId) && b.hour >= c.from && b.hour < c.to);

/** Admin: closures from today on. */
export async function getClosures(): Promise<Closure[]> {
  if (!USE_MOCK) return http("/admin/closures");
  const today = dayKey(new Date());
  return wait(structuredClone(adminState.closures.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.from - b.from)), 100);
}

/** Admin: the bookings a closure would cancel, before confirming it. */
export async function previewClosure(c: Pick<Closure, "courtIds" | "date" | "from" | "to">): Promise<Booking[]> {
  if (!USE_MOCK) return http("/admin/closures/preview", { method: "POST", body: c });
  return wait(structuredClone(closureHits(c)), 150);
}

/** Admin: close courts for a time range; their bookings are cancelled, refunded and texted. */
export async function createClosure(input: NewClosure): Promise<Closure> {
  if (!USE_MOCK) return http("/admin/closures", { method: "POST", body: input });
  const hits = closureHits(input);
  for (const b of hits) {
    b.status = "cancelled";
    const refund = input.fullRefund ? b.price : Math.round((b.price * refundPercent(b.date, b.hour)) / 100);
    if (refund) wallets.set(b.userPhone, mockWallet(b.userPhone) + refund);
  }
  const closure: Closure = { id: `CL-${Date.now()}`, courtIds: input.courtIds, date: input.date, from: input.from, to: input.to, reason: input.reason, affected: hits.length, createdBy: deskActor() };
  adminState.closures.push(closure);
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "بستن زمین", target: input.courtIds.map((id) => courtById(id)?.name ?? id).join("، "), detail: `${input.reason} · ${hm(input.from)} تا ${hm(input.to)} · ${hits.length.toLocaleString("fa-IR")} رزرو لغو شد` });
  return wait(structuredClone(closure), 300);
}

/** Admin: reopen a closed range (cancelled bookings stay cancelled). */
export async function deleteClosure(id: string): Promise<void> {
  if (!USE_MOCK) return http(`/admin/closures/${seg(id)}`, { method: "DELETE" });
  adminState.closures = adminState.closures.filter((c) => c.id !== id);
  await wait(null, 100);
}

/** Admin: session prices per sport and rental prices. */
export async function getPriceSheet(): Promise<PriceSheet> {
  if (!USE_MOCK) return http("/admin/pricing");
  const { PRICING: defaults, RENTALS: rentalDefs } = await import("@/engine/venue");
  const { usePricing } = await import("@/engine/pricing");
  const overrides = usePricing.getState().rentalPrices;
  return wait(structuredClone({
    bands: adminState.bands ?? defaults,
    rentals: Object.fromEntries(rentalDefs.map((r) => [r.id, overrides[r.id] ?? r.price])),
  }), 100);
}

/** Admin: save prices; new bookings use them right away (the backend prices every booking). */
export async function savePriceSheet(sheet: PriceSheet): Promise<void> {
  if (!USE_MOCK) return http("/admin/pricing", { method: "PUT", body: sheet });
  adminState.bands = structuredClone(sheet.bands);
  const { usePricing } = await import("@/engine/pricing");
  usePricing.getState().setRentalPrices(sheet.rentals);
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "تغییر قیمت", target: "قیمت سانس‌ها و اجاره", detail: "ذخیره‌ی جدول قیمت" });
  await wait(null, 200);
}

/** Admin: booking rules. */
export async function getVenueSettings(): Promise<VenueSettings> {
  if (!USE_MOCK) return http("/admin/settings");
  const v = await import("@/engine/venue");
  return wait(structuredClone(adminState.settings ?? { maxDaysAhead: v.MAX_DAYS_AHEAD, holdMinutes: v.HOLD_MINUTES, releaseHour: 0, maxActivePerUser: 0, cancelRules: v.CANCEL_RULES }), 100);
}

/** Admin: save booking rules. */
export async function saveVenueSettings(settings: VenueSettings): Promise<void> {
  if (!USE_MOCK) return http("/admin/settings", { method: "PUT", body: settings });
  adminState.settings = structuredClone(settings);
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "تغییر تنظیمات", target: "قوانین رزرو", detail: `بازه‌ی رزرو ${settings.maxDaysAhead.toLocaleString("fa-IR")} روز · نگه‌داشت ${settings.holdMinutes.toLocaleString("fa-IR")} دقیقه` });
  await wait(null, 200);
}

/** Admin: who changed what, newest first. */
export async function getAuditLog(from: string): Promise<Audit[]> {
  if (!USE_MOCK) return http("/admin/audit", { query: { from } });
  return wait(structuredClone(AUDIT.filter((a) => a.date >= from)), 120);
}
/* ------------------------------------------------------------------ */
/* Admin: staff roles and content permissions                          */
/* ------------------------------------------------------------------ */

/** Mock: content permissions per phone. */
const staffPerms = new Map<string, StaffPermission[]>();
const staffOf = (phone: string): StaffMember => {
  const u = USERS[phone];
  return { phone, first: u?.first ?? "", last: u?.last ?? "", roles: u?.roles ?? ["player"], permissions: staffPerms.get(phone) ?? u?.permissions ?? [] };
};

/** Admin: every account with a front desk or admin role. */
export async function getStaff(): Promise<StaffMember[]> {
  if (!USE_MOCK) return http("/admin/staff");
  return wait(Object.keys(USERS).filter((p) => USERS[p].roles.some((r) => r !== "player")).map(staffOf), 120);
}

/**
 * Admin: give a phone the front desk role. A number without an account gets
 * one with the given name. The person sees the front desk panel on next login.
 */
export async function grantStaffRole(phone: string, role: "secretary", name?: { first: string; last: string }): Promise<StaffMember> {
  if (!USE_MOCK) return http("/admin/staff", { method: "POST", body: { phone, role, ...name } });
  if (!USERS[phone]) {
    if (!name) throw new ApiError("این شماره حساب ندارد؛ نام را وارد کنید", 422, "NAME_REQUIRED");
    USERS[phone] = { phone, first: name.first, last: name.last, roles: ["player"], wallet: 0 };
  }
  const u = USERS[phone];
  if (!u.roles.includes(role)) u.roles = [...u.roles, role];
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "دادن نقش", target: `${u.first} ${u.last}`, detail: `نقش منشی به ${phone}` });
  return wait(staffOf(phone), 200);
}

/** Admin: take a staff role away. Your own admin role and the last admin can't be removed. */
export async function revokeStaffRole(phone: string, role: "secretary" | "admin"): Promise<void> {
  if (!USE_MOCK) return http(`/admin/staff/${seg(phone)}/roles/${seg(role)}`, { method: "DELETE" });
  const u = USERS[phone];
  if (!u) throw new ApiError("کاربر پیدا نشد", 404);
  if (role === "admin" && phone === sessionPhone()) throw new ApiError("نقش مدیر خودتان را نمی‌توانید بردارید", 409, "SELF_ADMIN");
  if (role === "admin" && Object.values(USERS).filter((x) => x.roles.includes("admin")).length <= 1) throw new ApiError("حداقل یک مدیر باید بماند", 409, "LAST_ADMIN");
  u.roles = u.roles.filter((r) => r !== role);
  if (!u.roles.length) u.roles = ["player"];
  if (role === "secretary") staffPerms.delete(phone);
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "برداشتن نقش", target: `${u.first} ${u.last}`, detail: role === "admin" ? "نقش مدیر" : "نقش منشی" });
  await wait(null, 200);
}

/** Admin: what a front desk account may do with site content. */
export async function setStaffPermissions(phone: string, permissions: StaffPermission[]): Promise<void> {
  if (!USE_MOCK) return http(`/admin/staff/${seg(phone)}/permissions`, { method: "PUT", body: { permissions } });
  staffPerms.set(phone, permissions);
  if (USERS[phone]) USERS[phone].permissions = permissions;
  AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action: "تغییر دسترسی", target: USERS[phone] ? `${USERS[phone].first} ${USERS[phone].last}` : phone, detail: permissions.length ? permissions.join("، ") : "بدون دسترسی محتوا" });
  await wait(null, 150);
}

/* ------------------------------------------------------------------ */
/* Site content: gallery albums, coach photos, home page media         */
/* ------------------------------------------------------------------ */

/** Mock: content lives in memory; uploaded files are shown through blob: URLs until reload. */
const content = {
  albums: [] as Album[],
  coachPhotos: new Map<string, string>(),
  siteMedia: new Map<string, MediaItem>(),
};
const mediaFromFile = (f: File): MediaItem => ({ id: `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: f.type.startsWith("video/") ? "video" : "image", url: URL.createObjectURL(f), alt: f.name.replace(/\.[^.]+$/, "") });
const filesForm = (files: File[], data?: unknown) => {
  const form = new FormData();
  if (data !== undefined) form.append("data", JSON.stringify(data));
  for (const f of files) form.append("files", f, f.name);
  return form;
};
const touch = (a: Album) => { a.updatedAt = new Date().toISOString(); };
const logContent = (action: string, target: string, detail = "") => AUDIT.unshift({ date: dayKey(new Date()), time: nowTime(), actor: deskActor(), action, target, detail });

/** Public: published albums with their photos, for the home page gallery. */
export async function getGallery(): Promise<Album[]> {
  if (!USE_MOCK) return http("/site/gallery");
  return wait(structuredClone(content.albums.filter((a) => a.published && a.items.length)), 100);
}

/** Staff: every album, published or not. */
export async function getAlbums(): Promise<Album[]> {
  if (!USE_MOCK) return http("/staff/albums");
  return wait(structuredClone(content.albums), 100);
}

/** Staff (albums permission): new empty, unpublished album. */
export async function createAlbum(title: string): Promise<Album> {
  if (!USE_MOCK) return http("/staff/albums", { method: "POST", body: { title } });
  const album: Album = { id: `AL-${Date.now()}`, title, published: false, items: [], updatedAt: new Date().toISOString() };
  content.albums.push(album);
  logContent("ساخت آلبوم", title);
  return wait(structuredClone(album), 150);
}

/** Staff (albums permission): rename, publish/hide or set the cover. */
export async function updateAlbum(id: string, patch: Partial<Pick<Album, "title" | "published" | "coverId">>): Promise<void> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(id)}`, { method: "PATCH", body: patch });
  const a = content.albums.find((x) => x.id === id);
  if (!a) throw new ApiError("آلبوم پیدا نشد", 404);
  Object.assign(a, patch);
  touch(a);
  if (patch.published !== undefined) logContent(patch.published ? "انتشار آلبوم" : "پنهان کردن آلبوم", a.title);
  await wait(null, 120);
}

/** Staff (albums permission): delete an album and its photos. */
export async function deleteAlbum(id: string): Promise<void> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(id)}`, { method: "DELETE" });
  const a = content.albums.find((x) => x.id === id);
  content.albums = content.albums.filter((x) => x.id !== id);
  if (a) logContent("حذف آلبوم", a.title, `${a.items.length.toLocaleString("fa-IR")} عکس`);
  await wait(null, 120);
}

/** Staff (gallery permission): add photos to an album. */
export async function addAlbumPhotos(id: string, files: File[]): Promise<Album> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(id)}/items`, { method: "POST", body: filesForm(files), timeoutMs: CONTENT_UPLOAD.timeoutMs });
  const a = content.albums.find((x) => x.id === id);
  if (!a) throw new ApiError("آلبوم پیدا نشد", 404);
  a.items.push(...files.map(mediaFromFile));
  a.coverId ??= a.items[0]?.id;
  touch(a);
  logContent("افزودن عکس به گالری", a.title, `${files.length.toLocaleString("fa-IR")} عکس`);
  return wait(structuredClone(a), 300);
}

/** Staff (gallery permission): caption or alt text of one photo. */
export async function updateAlbumPhoto(albumId: string, itemId: string, patch: Pick<MediaItem, "caption" | "alt">): Promise<void> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(albumId)}/items/${seg(itemId)}`, { method: "PATCH", body: patch });
  const it = content.albums.find((x) => x.id === albumId)?.items.find((i) => i.id === itemId);
  if (it) Object.assign(it, patch);
  await wait(null, 80);
}

/** Staff (gallery permission): remove a photo. */
export async function removeAlbumPhoto(albumId: string, itemId: string): Promise<void> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(albumId)}/items/${seg(itemId)}`, { method: "DELETE" });
  const a = content.albums.find((x) => x.id === albumId);
  if (a) {
    a.items = a.items.filter((i) => i.id !== itemId);
    if (a.coverId === itemId) a.coverId = a.items[0]?.id;
    touch(a);
    logContent("حذف عکس از گالری", a.title);
  }
  await wait(null, 100);
}

/** Staff (gallery permission): new photo order. */
export async function reorderAlbum(albumId: string, ids: string[]): Promise<void> {
  if (!USE_MOCK) return http(`/staff/albums/${seg(albumId)}/order`, { method: "PUT", body: { ids } });
  const a = content.albums.find((x) => x.id === albumId);
  if (a) a.items = ids.map((id) => a.items.find((i) => i.id === id)).filter((i): i is MediaItem => !!i);
  await wait(null, 80);
}

/** Staff (coaches permission): replace a coach's photo, or remove it with `file = null`. */
export async function setCoachPhoto(coachId: string, file: File | null): Promise<string | null> {
  if (!USE_MOCK)
    return file
      ? (await http<{ url: string }>(`/staff/coaches/${seg(coachId)}/photo`, { method: "PUT", body: filesForm([file]), timeoutMs: CONTENT_UPLOAD.timeoutMs })).url
      : (await http(`/staff/coaches/${seg(coachId)}/photo`, { method: "DELETE" }), null);
  const coach = COACHES.find((c) => c.id === coachId);
  if (file) content.coachPhotos.set(coachId, URL.createObjectURL(file));
  else content.coachPhotos.delete(coachId);
  logContent(file ? "تعویض عکس مربی" : "حذف عکس مربی", coach?.name ?? coachId);
  return wait(content.coachPhotos.get(coachId) ?? null, 200);
}

/** Public: the home page photos and videos the staff replaced, by slot id (missing = config default). */
export async function getSiteMedia(): Promise<Record<string, MediaItem>> {
  if (!USE_MOCK) return http("/site/media");
  return wait(Object.fromEntries(content.siteMedia), 60);
}

/** Staff (home permission): replace one home page photo or video. */
export async function setSiteMedia(slot: string, file: File): Promise<MediaItem> {
  if (!USE_MOCK) return http(`/staff/site-media/${seg(slot)}`, { method: "PUT", body: filesForm([file]), timeoutMs: CONTENT_UPLOAD.timeoutMs });
  const item = mediaFromFile(file);
  content.siteMedia.set(slot, item);
  logContent("تعویض رسانه‌ی صفحه‌ی اصلی", slot, file.name);
  return wait(structuredClone(item), 300);
}

/** Staff (home permission): go back to the default photo or video of a slot. */
export async function resetSiteMedia(slot: string): Promise<void> {
  if (!USE_MOCK) return http(`/staff/site-media/${seg(slot)}`, { method: "DELETE" });
  content.siteMedia.delete(slot);
  logContent("برگرداندن رسانه‌ی پیش‌فرض", slot);
  await wait(null, 100);
}
/* ------------------------------------------------------------------ */
/* Coach profiles (front desk with the coaches permission, and admin)  */
/* ------------------------------------------------------------------ */

const mockCoaches = () => structuredClone([...COACHES].sort((a, b) => a.order - b.order)).map((c) => ({ ...c, photo: content.coachPhotos.get(c.id) ?? c.photo }));

/** Staff: every coach profile, published or not. */
export async function getStaffCoaches(): Promise<Coach[]> {
  if (!USE_MOCK) return http("/staff/coaches");
  return wait(mockCoaches(), 120);
}

/** Staff: create (no id) or update a coach profile. */
export async function saveCoach(input: CoachInput, id?: string): Promise<Coach> {
  if (!USE_MOCK) return http(id ? `/staff/coaches/${seg(id)}` : "/staff/coaches", { method: id ? "PUT" : "POST", body: input });
  if (id) {
    const c = COACHES.find((x) => x.id === id);
    if (!c) throw new ApiError("مربی پیدا نشد", 404);
    Object.assign(c, input);
    logContent("ویرایش پروفایل مربی", c.name);
    return wait(mockCoaches().find((x) => x.id === id)!, 200);
  }
  const coach: Coach = { ...input, id: `c${Date.now()}`, order: Math.max(0, ...COACHES.map((c) => c.order)) + 1 };
  COACHES.push(coach);
  logContent("افزودن مربی", coach.name);
  return wait(structuredClone(coach), 200);
}

/** Staff: delete a coach profile and its photo. */
export async function deleteCoach(id: string): Promise<void> {
  if (!USE_MOCK) return http(`/staff/coaches/${seg(id)}`, { method: "DELETE" });
  const i = COACHES.findIndex((c) => c.id === id);
  if (i >= 0) {
    logContent("حذف مربی", COACHES[i].name);
    COACHES.splice(i, 1);
  }
  content.coachPhotos.delete(id);
  await wait(null, 150);
}

/** Staff: order of coaches on the site. */
export async function reorderCoaches(ids: string[]): Promise<void> {
  if (!USE_MOCK) return http("/staff/coaches/order", { method: "PUT", body: { ids } });
  ids.forEach((id, i) => {
    const c = COACHES.find((x) => x.id === id);
    if (c) c.order = i + 1;
  });
  await wait(null, 100);
}
