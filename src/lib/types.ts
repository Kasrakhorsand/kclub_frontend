export type Sport = "padel" | "beach";
export type Role = "player" | "secretary" | "admin";

export interface Court {
  id: string;
  sport: Sport;
  n: number;
  name: string;
  surface: string;
  turf?: "blue" | "black";
  active: boolean;
}

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
  source: "online" | "staff";
  status: "active" | "cancelled";
}

export interface User {
  phone: string;
  first: string;
  last: string;
  roles: Role[];
  wallet: number;
  vip?: boolean;
}

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

export interface Slot {
  hour: number;
  past: boolean;
  freeCourts: string[];
  price: number;
}
