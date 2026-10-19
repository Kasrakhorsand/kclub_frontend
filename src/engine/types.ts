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
}

export interface User {
  phone: string;
  first: string;
  last: string;
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
  actor: string;
  action: string;
  target: string;
  detail: string;
}
