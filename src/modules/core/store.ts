"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Role, User } from "@/modules/core/types";

/** Client session, persisted to localStorage under "kclub-session". */
interface SessionState {
  user: User | null;
  /** Panel currently shown; users with several roles can switch. */
  role: Role | null;
  theme: "dark" | "light";
  cart: CartItem[];
  /** Where to go after login (e.g. back to checkout). */
  afterLogin: string | null;
  setUser: (u: User | null, role?: Role | null) => void;
  setRole: (r: Role) => void;
  toggleTheme: () => void;
  /** Add the item, or remove it if the same court-hour is already in the cart. */
  toggleCart: (item: CartItem) => void;
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
      setUser: (user, role = user?.roles[0] ?? null) => set({ user, role }),
      setRole: (role) => set({ role }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleCart: (item) => {
        const cart = get().cart;
        const index = cart.findIndex((x) => x.date === item.date && x.hour === item.hour && x.courtId === item.courtId);
        set({ cart: index >= 0 ? cart.filter((_, i) => i !== index) : [...cart, item] });
      },
      clearCart: () => set({ cart: [] }),
      setAfterLogin: (afterLogin) => set({ afterLogin }),
    }),
    { name: "kclub-session" },
  ),
);

/** Sum of cart prices in toman. */
export const cartTotal = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.price, 0);
