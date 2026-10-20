"use client";
/**
 * Tickets for the current role: players see and open their own; front desk
 * answers everyone's and can escalate to admin; admin sees all and can close.
 * Covers the list with a status filter, the open conversation, replying and
 * creating a ticket.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, getTickets, replyTicket, setTicketStatus } from "@/engine/api";
import { useSession } from "@/engine/store";
import type { Role, TechContext, Ticket, TicketCategory, TicketStatus } from "@/engine/types";

export type TicketFilter = "all" | TicketStatus;

/** Length limits, matched on the backend. */
export const TITLE_MAX = 120;
export const TEXT_MAX = 2000;

export const TICKET_CATEGORIES: { id: TicketCategory; label: string }[] = [
  { id: "booking", label: "رزرو" },
  { id: "payment", label: "پرداخت و کیف پول" },
  { id: "facility", label: "امکانات مجموعه" },
  { id: "tech", label: "مشکل فنی سایت" },
  { id: "other", label: "سایر" },
];

/** Page, browser and screen size for a technical ticket; trimmed so it can't carry much. */
export function techContext(): TechContext {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return {
    page: (document.referrer && new URL(document.referrer).origin === location.origin ? new URL(document.referrer).pathname : location.pathname).slice(0, 120),
    browser: `${browser} · ${os}`,
    screen: `${window.innerWidth}×${window.innerHeight}`,
    theme: document.documentElement.dataset.theme,
  };
}

export const ticketsKey = (phone: string, role: Role | null) => ["tickets", phone, role];

/** Tickets waiting on this role (panel menu badge): open for front desk, escalated for admin. */
export function usePendingTickets() {
  const phone = useSession((s) => s.user?.phone ?? "");
  const role = useSession((s) => s.role);
  const { data = [] } = useQuery({ queryKey: ticketsKey(phone, role), queryFn: () => getTickets(role!), enabled: !!phone && !!role });
  if (role === "admin") return data.filter((t) => t.status === "escalated").length;
  if (role === "secretary") return data.filter((t) => t.status === "open").length;
  return 0;
}

export function useTickets() {
  const phone = useSession((s) => s.user?.phone ?? "");
  const role = useSession((s) => s.role);
  const client = useQueryClient();
  const { data: all = [], isLoading } = useQuery({ queryKey: ticketsKey(phone, role), queryFn: () => getTickets(role!), enabled: !!phone && !!role });

  const [filter, setFilter] = useState<TicketFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<{ title: string; category: TicketCategory; text: string }>({ title: "", category: "booking", text: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => client.invalidateQueries({ queryKey: ["tickets"] });
  const shown = filter === "all" ? all : all.filter((t) => t.status === filter);
  const selected: Ticket | null = all.find((t) => t.id === selectedId) ?? null;
  const counts = Object.fromEntries((["open", "answered", "escalated", "closed"] as TicketStatus[]).map((s) => [s, all.filter((t) => t.status === s).length])) as Record<TicketStatus, number>;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
      await refresh();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    role,
    loading: isLoading,
    tickets: shown,
    total: all.length,
    counts,
    filter,
    setFilter,
    selected,
    select: (id: string | null) => {
      setSelectedId(id);
      setComposing(false);
      setReply("");
      setError("");
    },
    busy,
    error,

    reply,
    setReply,
    /** Send the reply on the open ticket. */
    sendReply: () =>
      run(async () => {
        if (!selected || !role || !reply.trim()) return;
        if (reply.trim().length > TEXT_MAX) throw new Error("پیام طولانی است");
        await replyTicket(selected.id, reply.trim());
        setReply("");
      }),

    /** Front desk hands a ticket to admin. */
    canEscalate: role === "secretary",
    escalate: () => run(async () => { if (selected) await setTicketStatus(selected.id, "escalated"); }),
    /** Staff close; anyone can reopen by replying. */
    canClose: role !== "player",
    close: () => run(async () => { if (selected) await setTicketStatus(selected.id, "closed"); }),

    /** New ticket form (players). */
    canCreate: role === "player",
    composing,
    /** Open the form, optionally on a category (e.g. "tech" from "report a website problem"). */
    startCompose: (category?: TicketCategory) => {
      if (category) setDraft((d) => ({ ...d, category }));
      setComposing(true);
      setSelectedId(null);
      setError("");
    },
    cancelCompose: () => setComposing(false),
    draft,
    setDraft: (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch })),
    /** Device details sent with a technical ticket (null for other categories). */
    techPreview: draft.category === "tech" && composing ? techContext() : null,
    submitDraft: () =>
      run(async () => {
        if (draft.title.trim().length < 4) throw new Error("موضوع تیکت را کامل‌تر بنویسید");
        if (draft.text.trim().length < 10) throw new Error("متن پیام حداقل ۱۰ کاراکتر باشد");
        if (draft.title.trim().length > TITLE_MAX || draft.text.trim().length > TEXT_MAX) throw new Error("متن تیکت طولانی است");
        const t = await createTicket(draft.title.trim(), draft.category, draft.text.trim(), draft.category === "tech" ? techContext() : undefined);
        setDraft({ title: "", category: "booking", text: "" });
        setComposing(false);
        setSelectedId(t.id);
      }),
  };
}
