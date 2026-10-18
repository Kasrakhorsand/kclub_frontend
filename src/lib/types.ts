/** Shared domain types. Dates are local "yyyy-MM-dd" keys; hours are 0–23 session start hours. */

/** Beach courts host both beach tennis and beach volley. */
export type Sport = "padel" | "beach";
/** "secretary" is the front desk. */
export type Role = "player" | "secretary" | "admin";

export interface Court {
  id: string;
  sport: Sport;
  /** Court number within its sport (1–3). */
  n: number;
  name: string;
  surface: string;
  /** Padel only. */
  turf?: "blue" | "black";
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
  price: number;
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

export interface Ticket {
  id: string;
  phone: string;
  title: string;
  status: "open" | "answered" | "escalated" | "closed";
  date: string;
  messages: { by: "user" | "staff" | "admin"; text: string }[];
}

export interface Notif {
  id: string;
  title: string;
  text: string;
  read: boolean;
  date: string;
}

/** Audit-log entry for an admin or staff change. */
export interface Audit {
  date: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}
