"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Role, User } from "@/engine/types";
import { itemTotal } from "@/engine/pricing";

/** Client session, persisted to localStorage under "kclub-session". */
interface SessionState {
  user: User | null;
  /** Panel currently shown; users with several roles can switch. */
  role: Role | null;
  theme: "dark" | "light";
  cart: CartItem[];
  /** Where to go after login (e.g. back to checkout). */
  afterLogin: string | null;
  /** How the current session signed in; an SMS login may set a new password without the old one. */
  loginMethod: "otp" | "password" | null;
  setUser: (u: User | null, role?: Role | null, loginMethod?: "otp" | "password" | null) => void;
  setRole: (r: Role) => void;
  toggleTheme: () => void;
  /** Add the item, or remove it if the same court-hour is already in the cart. */
  toggleCart: (item: CartItem) => void;
  /** Set the rented equipment for one cart item (0 removes a rental). */
  setRentals: (item: CartItem, rentals: Record<string, number>) => void;
  clearCart: () => void;
  setAfterLogin: (p: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      theme: "light",
      cart: [],
      afterLogin: null,
      loginMethod: null,
      setUser: (user, role = user?.roles[0] ?? null, loginMethod = null) => set({ user, role, loginMethod: user ? loginMethod : null }),
      setRole: (role) => set({ role }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleCart: (item) => {
        const cart = get().cart;
        const index = cart.findIndex((x) => sameSlot(x, item));
        set({ cart: index >= 0 ? cart.filter((_, i) => i !== index) : [...cart, item] });
      },
      setRentals: (item, rentals) => {
        const clean = Object.fromEntries(Object.entries(rentals).filter(([, qty]) => qty > 0));
        set({ cart: get().cart.map((x) => (sameSlot(x, item) ? { ...x, rentals: clean } : x)) });
      },
      clearCart: () => set({ cart: [] }),
      setAfterLogin: (afterLogin) => set({ afterLogin }),
    }),
    { name: "kclub-session" },
  ),
);

/** Same court at the same date and hour. */
export const sameSlot = (a: CartItem, b: CartItem) => a.date === b.date && a.hour === b.hour && a.courtId === b.courtId;

/** Cart total in toman: courts plus rentals at current prices. */
export const cartTotal = (cart: CartItem[], rentalPrices?: Record<string, number>) =>
  cart.reduce((sum, item) => sum + itemTotal(item, rentalPrices), 0);
