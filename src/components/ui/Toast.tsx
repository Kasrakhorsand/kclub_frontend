"use client";
import { create } from "zustand";
import { useEffect } from "react";

/** One toast at a time; a new message replaces the current one. */
const useToast = create<{ msg: string | null; show: (m: string) => void; hide: () => void }>((set) => ({
  msg: null,
  show: (msg) => set({ msg }),
  hide: () => set({ msg: null }),
}));

/** Show a short status message from anywhere (no hook needed). */
export const toast = (m: string) => useToast.getState().show(m);

/** Renders the current toast and hides it after 2.6 s; mounted once in Providers. */
export function ToastHost() {
  const { msg, hide } = useToast();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [msg, hide]);
  return msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
}
