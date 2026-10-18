"use client";
import { create } from "zustand";
import { useEffect } from "react";

const useToast = create<{ msg: string | null; show: (m: string) => void; hide: () => void }>((set) => ({
  msg: null,
  show: (msg) => set({ msg }),
  hide: () => set({ msg: null }),
}));

export const toast = (m: string) => useToast.getState().show(m);

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
