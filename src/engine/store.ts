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
  /** Update the signed-in user's details, keeping role and login method. */
  updateUser: (patch: Partial<User>) => void;
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
      // Only a role the user actually has; the backend checks permissions on every request anyway.
      setRole: (role) => {
        if (get().user?.roles.includes(role)) set({ role });
      },
      updateUser: (patch) => {
        const user = get().user;
        if (user) set({ user: { ...user, ...patch } });
      },
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
    {
      name: "kclub-session",
      // Keep only what the UI needs between visits; the cart and theme are harmless,
      // the user is re-checked against the server on load (see EngineProvider).
      partialize: (s) => ({
        // Personal details like email and national ID stay out of localStorage.
        user: s.user && { phone: s.user.phone, first: s.user.first, last: s.user.last, roles: s.user.roles, wallet: s.user.wallet, vip: s.user.vip, permissions: s.user.permissions },
        role: s.role,
        theme: s.theme,
        cart: s.cart,
        afterLogin: s.afterLogin,
        loginMethod: s.loginMethod,
      }),
      // A role edited in localStorage that the user doesn't have falls back to their first role.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SessionState>;
        const role = p.user && p.role && p.user.roles.includes(p.role) ? p.role : (p.user?.roles[0] ?? null);
        return { ...current, ...p, role };
      },
    },
  ),
);

/** Same court at the same date and hour. */
export const sameSlot = (a: CartItem, b: CartItem) => a.date === b.date && a.hour === b.hour && a.courtId === b.courtId;

/** Cart total in toman: courts plus rentals at current prices. */
export const cartTotal = (cart: CartItem[], rentalPrices?: Record<string, number>) =>
  cart.reduce((sum, item) => sum + itemTotal(item, rentalPrices), 0);
