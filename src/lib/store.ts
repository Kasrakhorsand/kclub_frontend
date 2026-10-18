"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Role, User } from "./types";

interface SessionState {
  user: User | null;
  role: Role | null;
  theme: "dark" | "light";
  cart: CartItem[];
  afterLogin: string | null;
  setUser: (u: User | null, role?: Role | null) => void;
  setRole: (r: Role) => void;
  toggleTheme: () => void;
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
      toggleCart: (it) => {
        const c = get().cart;
        const i = c.findIndex((x) => x.date === it.date && x.hour === it.hour && x.courtId === it.courtId);
        set({ cart: i >= 0 ? c.filter((_, j) => j !== i) : [...c, it] });
      },
      clearCart: () => set({ cart: [] }),
      setAfterLogin: (afterLogin) => set({ afterLogin }),
    }),
    { name: "kclub-session" },
  ),
);

export const cartTotal = (c: CartItem[]) => c.reduce((a, x) => a + x.price, 0);
