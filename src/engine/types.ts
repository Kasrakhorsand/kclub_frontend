/** Shared domain types. Dates are local "yyyy-MM-dd" keys; hours are 0–23 session start hours. */

/** Sport id from the venue config (e.g. "padel", "beach"). */
export type Sport = string;

/** 3D model shown for a game on the sport picker. */
export type SportModel = "padel" | "tennis" | "volley";

/** Court drawing on the booking map: walled padel court or open sand court. */
export type CourtLayout = "padel" | "sand";

/** A game played on a sport's courts (beach courts host beach tennis and beach volley). */
export interface GameDef {
  id: string;
  name: string;
  latin: string;
  model: SportModel;
  /** One-line description for sport cards. */
  summary: string;
}

/** A bookable sport: its own courts, prices and one or more games. */
export interface SportDef {
  id: Sport;
  /** Short name, e.g. "پدل" or "ساحلی". */
  name: string;
  latin: string;
  layout: CourtLayout;
  /** Indoor courts get a roofed look on the map. */
  indoor: boolean;
  /** 3D icon name for pricing cards. */
  icon: string;
  /** Games played on this sport's courts; a single entry means the sport is the game. */
  games: GameDef[];
  /** Short note under the price, e.g. "هر سانس یک ساعت · تا ۴ بازیکن". */
  priceNote: string;
}
/** "secretary" is the front desk. */
export type Role = "player" | "secretary" | "admin";

export interface Court {
  id: string;
  sport: Sport;
  /** Court number within its sport (1–3). */
  n: number;
  name: string;
  surface: string;
  /** Floor colour on the map and board (hex). */
  floor: string;
  /** Inactive courts are hidden from online booking. */
  active: boolean;
}

/** Price per session (toman) for start hours from `from` up to, not including, `to`. */
export interface PriceBand {
  from: number;
  to: number;
  price: number;
}

export interface Booking {
  id: string;
  courtId: string;
  date: string; // yyyy-MM-dd
  hour: number; // start hour
  userPhone: string;
  userName: string;
  /** Total paid: court plus rentals. */
  price: number;
  rentals?: Record<string, number>;
  /** "staff" = entered by the front desk. */
  source: "online" | "staff";
  status: "active" | "cancelled";
  /** The front desk marked the player as arrived. */
  checkedIn?: boolean;
}

export interface User {
  phone: string;
  first: string;
  last: string;
  /** Optional, for receipts. */
  email?: string;
  /** Iranian national ID (کد ملی), 10 digits. */
  nationalId?: string;
  /** First role is the default panel after login. */
  roles: Role[];
  /** Wallet balance in toman. */
  wallet: number;
  vip?: boolean;
}

/** One court-hour in the booking cart; price is fixed when added. */
export interface CartItem {
  date: string;
  hour: number;
  courtId: string;
  /** Court price for this hour, fixed when added. */
  price: number;
  /** Game played (e.g. "tennis" on a beach court); decides which rentals are offered. */
  game?: string;
  /** Rented equipment: rental id → quantity. */
  rentals?: Record<string, number>;
}

/** Equipment players can rent with a court (e.g. rackets), priced per item per session. */
export interface RentalDef {
  id: string;
  /** e.g. "اجاره‌ی راکت" */
  name: string;
  /** e.g. "راکت" */
  unit: string;
  /** Game ids that can rent it (e.g. padel and beach tennis, not beach volley). */
  games: string[];
  maxPerBooking: number;
  /** Default price in toman; the admin can override it in the panel. */
  price: number;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  level: string;
  years: number;
  students: number;
  satisfaction: number;
  rating: number;
  reviews: number;
  tags: string[];
  price: number;
  photo?: string;
}

/** A court on the booking map at the chosen hour: free = bookable, sel = in the cart, taken = booked. */
export type CourtState = "free" | "sel" | "taken";

/** One bookable hour of a day for a sport. */
export interface Slot {
  hour: number;
  past: boolean;
  /** IDs of active courts still free at this hour. */
  freeCourts: string[];
  price: number;
}

/** Wallet transaction; `amount` is negative for payments. */
export interface Tx {
  id: string;
  date: string;
  phone: string;
  type: "charge" | "pay" | "refund";
  amount: number;
  desc: string;
  method: string;
  /** Who recorded it (system, front-desk name, ...). */
  actor: string;
  /** Account holder's name, on staff lists. */
  userName?: string;
}

export type TicketStatus = "open" | "answered" | "escalated" | "closed";
export type TicketCategory = "booking" | "payment" | "facility" | "other";

export interface TicketMessage {
  by: "user" | "staff" | "admin";
  text: string;
  /** "HH:mm" when it was sent. */
  time?: string;
  /** Day key when it was sent (defaults to the ticket date). */
  date?: string;
}

export interface Ticket {
  id: string;
  phone: string;
  title: string;
  status: TicketStatus;
  category?: TicketCategory;
  date: string;
  messages: TicketMessage[];
}

/** What a notification is about; decides its icon and grouping. */
export type NotifKind = "booking" | "wallet" | "ticket" | "system";

export interface Notif {
  id: string;
  title: string;
  text: string;
  read: boolean;
  date: string;
  kind?: NotifKind;
  /** "HH:mm" */
  time?: string;
  /** Where tapping it should go, e.g. "/panel/res". */
  href?: string;
}

/** Audit-log entry for an admin or staff change. */
export interface Audit {
  date: string;
  /** "HH:mm", when known. */
  time?: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

/* ===== Technical support (the website's own support team, not the venue) ===== */

/** Part of the website the problem is in. */
export type SupportArea = "login" | "booking" | "payment" | "wallet" | "panel" | "display" | "speed" | "other";
/** blocker: can't continue at all · major: works with a workaround · minor: small or cosmetic. */
export type SupportSeverity = "blocker" | "major" | "minor";
/** new → in progress → (need info ↔ user replies) → resolved → closed. */
export type SupportStatus = "new" | "in_progress" | "need_info" | "resolved" | "closed";
/** When the user saw it. */
export type SupportWhen = "now" | "today" | "yesterday" | "earlier";

export interface SupportAttachment {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  type: string;
  /** Where to load the image from (backend URL, or a blob: URL in mock mode). */
  url: string;
}

/** A browser error seen shortly before the report: message only, no stack or data. */
export interface ClientErrorEntry {
  time: string;
  page: string;
  message: string;
}

/** Device and app details collected (with the user's consent) to reproduce a problem. No personal data. */
export interface SupportDiagnostics {
  page: string;
  /** The last few in-app pages, oldest first. */
  recentPages: string[];
  browser: string;
  os: string;
  device: "mobile" | "tablet" | "desktop";
  screen: string;
  viewport: string;
  pixelRatio: number;
  language: string;
  timeZone: string;
  online: boolean;
  connection?: string;
  theme?: string;
  role?: Role;
  appVersion: string;
  /** ISO time when the report was made. */
  reportedAt: string;
  recentErrors: ClientErrorEntry[];
}

export interface SupportMessage {
  by: "user" | "support";
  text: string;
  date: string;
  time: string;
  attachments?: SupportAttachment[];
}

export interface SupportTicket {
  id: string;
  /** Short reference shown to the user, e.g. "SUP-1024". */
  ref: string;
  area: SupportArea;
  severity: SupportSeverity;
  subject: string;
  /** What the user was doing, step by step. */
  steps: string;
  /** What actually happened (error text, blank page, ...). */
  actual: string;
  /** What they expected instead. */
  expected?: string;
  when: SupportWhen;
  /** "HH:mm" if they remember. */
  whenTime?: string;
  /** Booking tracking code or transaction id involved, if any. */
  refCode?: string;
  /** The user agrees to a phone call if support needs one. */
  allowCall: boolean;
  status: SupportStatus;
  date: string;
  time: string;
  diagnostics?: SupportDiagnostics;
  attachments: SupportAttachment[];
  messages: SupportMessage[];
}

/** What the form sends; files go alongside as multipart parts. */
export type NewSupportTicket = Pick<SupportTicket, "area" | "severity" | "subject" | "steps" | "actual" | "expected" | "when" | "whenTime" | "refCode" | "allowCall"> & {
  diagnostics?: SupportDiagnostics;
};
/* ===== Bank gateway payments ===== */

/** What the backend says about a gateway payment after the bank sends the user back. */
export interface PaymentResult {
  ref: string;
  status: "paid" | "failed" | "pending";
  kind: "booking" | "topup";
  /** Toman. */
  amount: number;
  /** Booking tracking code, for paid bookings. */
  tracking?: string;
  /** Bank reference number shown to the user. */
  bankRef?: string;
  /** Wallet balance after the payment, if it changed. */
  wallet?: number;
  /** Why it failed, in Persian, if the backend knows. */
  message?: string;
}
/* ===== Front desk booking (walk-in or phone) ===== */

/** A customer as the front desk sees them when typing a phone number. */
export interface DeskCustomer {
  phone: string;
  first: string;
  last: string;
  wallet: number;
  vip?: boolean;
  /** Upcoming active bookings. */
  upcoming: number;
}

/** How a desk booking is paid. "link" texts a gateway link; "later" leaves it unpaid until arrival. */
export type DeskPayment = "pos" | "cash" | "wallet" | "link" | "later";

export interface DeskBookingInput {
  phone: string;
  /** Only for a new customer. */
  first?: string;
  last?: string;
  items: Pick<CartItem, "courtId" | "date" | "hour" | "game" | "rentals">[];
  payment: DeskPayment;
  note?: string;
}

export interface DeskBookingResult {
  tracking: string;
  /** Toman, as priced by the backend. */
  total: number;
  /** Booked court-hours (items the backend accepted). */
  count: number;
}
/* ===== Front desk: customers, wallet operations, cash drawer ===== */

/** One row of the front desk's customer list. */
export interface CustomerRow extends DeskCustomer {
  roles: Role[];
  /** Day key of the last booking, if any. */
  lastVisit?: string;
  totalBookings: number;
}

export type CustomerFilter = "all" | "vip" | "upcoming" | "inactive";

/** Everything the desk sees when a customer is opened. */
export interface CustomerDetail {
  customer: CustomerRow;
  upcoming: Booking[];
  recent: Booking[];
  transactions: Tx[];
}

/** Money taken or given back at the desk. */
export type DeskMethod = "pos" | "cash";

/** One day's cash drawer for the signed-in front desk user. */
export interface CashReport {
  date: string;
  rows: Tx[];
  byMethod: { method: string; received: number; refunded: number; count: number }[];
  received: number;
  refunded: number;
  /** Cash expected in the drawer (cash received − cash refunded). */
  expectedCash: number;
  /** Set once the drawer was counted and closed. */
  closed?: { counted: number; difference: number; at: string; note?: string };
}
/* ===== Admin: revenue, courts, closures, pricing, settings ===== */

/** One day of revenue in toman, per sport id, with the number of bookings. */
export interface RevenueDay {
  date: string;
  bySport: Record<string, number>;
  bookings: number;
}

export interface RevenueReport {
  days: RevenueDay[];
  total: number;
  bySport: Record<string, number>;
  /** Revenue per court id. */
  byCourt: Record<string, number>;
  /** Booked hours per court id, to read against the opening hours. */
  hoursByCourt: Record<string, number>;
  /** Share of bookings made online (0–1); the rest were entered at the desk. */
  onlineShare: number;
  bookings: number;
}

/** A court closed for a time range (maintenance, tournament). */
export interface Closure {
  id: string;
  courtIds: string[];
  date: string;
  /** First closed start hour and the hour it opens again. */
  from: number;
  to: number;
  reason: string;
  /** Bookings that were cancelled because of it. */
  affected: number;
  createdBy: string;
}

export type NewClosure = Pick<Closure, "courtIds" | "date" | "from" | "to" | "reason"> & { fullRefund: boolean };

/** Session prices per sport and the equipment rental prices, as the admin edits them. */
export interface PriceSheet {
  bands: Record<string, PriceBand[]>;
  rentals: Record<string, number>;
}

/** Booking rules the admin can change. */
export interface VenueSettings {
  /** How many days ahead the public can book. */
  maxDaysAhead: number;
  /** Minutes a court is held while the player is at the bank gateway. */
  holdMinutes: number;
  /** Hour of day when a new day opens for booking (0–23). */
  releaseHour: number;
  /** Most active bookings one player may hold (0 = no limit). */
  maxActivePerUser: number;
  /** Refund `percent` if cancelled at least `hours` before the start (checked from the largest `hours`). */
  cancelRules: { hours: number; percent: number }[];
}
