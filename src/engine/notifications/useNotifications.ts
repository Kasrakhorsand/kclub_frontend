"use client";
/** Notifications: list grouped by day, unread filter and count, mark one or all as read. */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsRead } from "@/engine/api";
import { useSession } from "@/engine/store";
import type { Notif } from "@/engine/types";

export type NotifFilter = "all" | "unread";

/** Query key shared with the panel badge so both update together. */
export const notificationsKey = (phone: string) => ["notifications", phone];

/** Just the unread count (panel menu badge). */
export function useUnreadNotifications() {
  const phone = useSession((s) => s.user?.phone ?? "");
  const { data = [] } = useQuery({ queryKey: notificationsKey(phone), queryFn: () => getNotifications(phone), enabled: !!phone });
  return data.filter((n) => !n.read).length;
}

export function useNotifications() {
  const phone = useSession((s) => s.user?.phone ?? "");
  const client = useQueryClient();
  const { data: all = [], isLoading } = useQuery({ queryKey: notificationsKey(phone), queryFn: () => getNotifications(phone), enabled: !!phone });
  const [filter, setFilter] = useState<NotifFilter>("all");

  const shown = filter === "unread" ? all.filter((n) => !n.read) : all;
  const days: { date: string; items: Notif[] }[] = [];
  for (const n of shown) {
    const last = days[days.length - 1];
    if (last?.date === n.date) last.items.push(n);
    else days.push({ date: n.date, items: [n] });
  }

  const refresh = () => client.invalidateQueries({ queryKey: notificationsKey(phone) });

  return {
    loading: isLoading,
    days,
    filter,
    setFilter,
    unread: all.filter((n) => !n.read).length,
    total: all.length,
    markRead: async (id: string) => {
      await markNotificationsRead(phone, [id]);
      refresh();
    },
    markAllRead: async () => {
      await markNotificationsRead(phone);
      refresh();
    },
  };
}
