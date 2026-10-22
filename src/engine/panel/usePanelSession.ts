"use client";
/**
 * Everything a panel shell needs besides markup: waits for the persisted
 * session, sends guests to login, knows the current section and menu,
 * badge counts, role switching and logout.
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/engine/store";
import { logout as apiLogout } from "@/engine/api";
import { useUnreadNotifications } from "@/engine/notifications/useNotifications";
import { usePendingTickets } from "@/engine/tickets/useTickets";
import { useCan } from "@/engine/content/permissions";
import type { Role } from "@/engine/types";
import { MENUS, sectionHref } from "./menus";

export function usePanelSession() {
  const router = useRouter();
  const path = usePathname();
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.role);
  const setUser = useSession((s) => s.setUser);
  const setRole = useSession((s) => s.setRole);
  // The session lives in localStorage, so it is only known after the first client render.
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !useSession.getState().user) router.replace("/login");
  }, [ready, user, router]);

  const section = path.split("/")[2] ?? "dash";
  const content = useCan();
  const menu = (role ? MENUS[role] : []).filter((m) => !m.needs || m.needs.some(content.can));

  const unreadNotifs = useUnreadNotifications();
  const pendingTickets = usePendingTickets();
  /** Badge number for a menu item (unread notifications, tickets waiting for this role). */
  const badgeFor = (key: string) => (key === "notif" ? unreadNotifs : key === "tickets" ? pendingTickets : 0);

  return {
    /** False until the session is loaded and a user with a role is present; render nothing until then. */
    ready: ready && !!user && !!role,
    user,
    role,
    path,
    section,
    menu,
    currentLabel: menu.find((m) => m.key === section)?.label ?? menu[0]?.label ?? "",
    href: sectionHref,
    badgeFor,
    switchRole: (r: Role) => {
      setRole(r);
      router.push("/panel");
    },
    /** End the session on the server, clear the local copy, go home. */
    logout: async () => {
      await apiLogout();
      setUser(null);
      router.push("/");
    },
  };
}
