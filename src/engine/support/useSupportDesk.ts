"use client";
/**
 * Support desk (role "support"): the website's own technical team works
 * through every user's reports — queue with filters, full report and device
 * details, replies (with saved answers and screenshots), internal notes,
 * status / severity / area / assignee — plus the numbers for the dashboard
 * and browser errors grouped across reports.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addSupportNote, deleteCannedReply, getCannedReplies, getSupportAgents, getSupportQueue, replyAsSupport, saveCannedReply, updateSupportTicket } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import { useSession } from "@/engine/store";
import { SUPPORT_LIMITS, useAttachments } from "@/engine/support/useSupport";
import type { CannedReply, SupportArea, SupportQueueTicket, SupportSeverity, SupportStatus, SupportTicketPatch } from "@/engine/types";

const QUEUE_KEY = ["support-queue"];
const SEVERITY_RANK: Record<SupportSeverity, number> = { blocker: 0, major: 1, minor: 2 };
const OPEN: SupportStatus[] = ["new", "in_progress", "need_info"];
export const isOpen = (t: Pick<SupportQueueTicket, "status">) => OPEN.includes(t.status);

/** Every report, refreshed every 30 seconds so new ones show up. */
export function useSupportQueue() {
  const { data = [], isLoading, dataUpdatedAt } = useQuery({ queryKey: QUEUE_KEY, queryFn: getSupportQueue, refetchInterval: 30_000 });
  return { tickets: data, loading: isLoading, updatedAt: dataUpdatedAt };
}

export type QueueView = "open" | "mine" | "unassigned" | "need_info" | "done" | "all";
export type QueueFilters = { view: QueueView; severity: SupportSeverity | "all"; area: SupportArea | "all"; q: string };

/** Open work first: blockers, then the oldest waiting; finished work newest first. */
function sortQueue(list: SupportQueueTicket[]) {
  return [...list].sort((a, b) => {
    const ao = isOpen(a), bo = isOpen(b);
    if (ao !== bo) return ao ? -1 : 1;
    if (ao) return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.date + a.time).localeCompare(b.date + b.time);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function useSupportDesk() {
  const client = useQueryClient();
  const me = useSession((s) => (s.user ? `${s.user.first} ${s.user.last}` : ""));
  const { tickets, loading, updatedAt } = useSupportQueue();
  const { data: agents = [] } = useQuery({ queryKey: ["support-agents"], queryFn: getSupportAgents, staleTime: 10 * 60_000 });
  const { data: canned = [] } = useQuery({ queryKey: ["support-replies"], queryFn: getCannedReplies, staleTime: 5 * 60_000 });

  const [filters, setFilters] = useState<QueueFilters>({ view: "open", severity: "all", area: "all", q: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const files = useAttachments();

  const counts = useMemo(
    () => ({
      open: tickets.filter(isOpen).length,
      mine: tickets.filter((t) => isOpen(t) && t.assignee === me).length,
      unassigned: tickets.filter((t) => isOpen(t) && !t.assignee).length,
      need_info: tickets.filter((t) => t.status === "need_info").length,
      done: tickets.filter((t) => !isOpen(t)).length,
      all: tickets.length,
    }),
    [tickets, me],
  );

  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return sortQueue(
      tickets.filter((t) => {
        const inView =
          filters.view === "all" ? true
          : filters.view === "open" ? isOpen(t)
          : filters.view === "mine" ? isOpen(t) && t.assignee === me
          : filters.view === "unassigned" ? isOpen(t) && !t.assignee
          : filters.view === "need_info" ? t.status === "need_info"
          : !isOpen(t);
        if (!inView) return false;
        if (filters.severity !== "all" && t.severity !== filters.severity) return false;
        if (filters.area !== "all" && t.area !== filters.area) return false;
        if (!q) return true;
        return [t.ref, t.subject, t.actual, t.steps, t.refCode ?? "", t.reporter.name, t.reporter.phone ?? ""].some((x) => x.toLowerCase().includes(q));
      }),
    );
  }, [tickets, filters, me]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const run = async (task: () => Promise<void>, done?: string) => {
    setBusy(true);
    setError("");
    setFlash("");
    try {
      await task();
      await client.invalidateQueries({ queryKey: QUEUE_KEY });
      // The reporter's own list (if the agent also reports) and lookups.
      client.invalidateQueries({ queryKey: ["support"] });
      client.invalidateQueries({ queryKey: ["support-user"] });
      if (done) setFlash(done);
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const update = (patch: SupportTicketPatch, done = "ذخیره شد.") => run(async () => { if (selected) await updateSupportTicket(selected.id, patch); }, done);

  return {
    loading,
    updatedAt,
    me,
    agents,
    canned,
    counts,
    filters,
    setFilters: (patch: Partial<QueueFilters>) => setFilters((f) => ({ ...f, ...patch })),
    list,
    selected,
    select: (id: string | null) => {
      setSelectedId(id);
      setReply("");
      setNote("");
      files.clear();
      setError("");
      setFlash("");
    },
    busy,
    error,
    flash,

    update,
    assignToMe: () => update({ assignee: me, ...(selected?.status === "new" ? { status: "in_progress" as const } : {}) }, "به شما سپرده شد."),

    reply,
    setReply,
    files,
    /** Put a saved answer into the reply box (after what is already written). */
    insertCanned: (c: CannedReply) => setReply((r) => (r.trim() ? `${r.trim()}\n\n${c.text}` : c.text)),
    /** Send the reply; `status` moves the report at the same time (e.g. need_info, resolved). */
    sendReply: (status?: SupportStatus) =>
      run(async () => {
        if (!selected) return;
        const text = reply.trim();
        if (!text && !files.files.length) throw new Error("متن پاسخ را بنویسید");
        if (text.length > SUPPORT_LIMITS.reply) throw new Error("پاسخ طولانی است");
        await replyAsSupport(selected.id, text, files.files, status);
        setReply("");
        files.clear();
      }, status === "resolved" ? "پاسخ رفت و گزارش حل‌شده علامت خورد." : status === "need_info" ? "پاسخ رفت؛ منتظر توضیح کاربر." : "پاسخ فرستاده شد."),

    note,
    setNote,
    addNote: () =>
      run(async () => {
        if (!selected) return;
        const text = note.trim();
        if (!text) return;
        if (text.length > SUPPORT_LIMITS.reply) throw new Error("یادداشت طولانی است");
        await addSupportNote(selected.id, text);
        setNote("");
      }, "یادداشت ثبت شد."),
  };
}

/** Numbers for the support dashboard, from the queue. */
export function useSupportStats() {
  const { tickets, loading } = useSupportQueue();
  return useMemo(() => {
    const open = tickets.filter(isOpen);
    const weekAgo = dayKey(addDays(new Date(), -7));
    const responses = tickets.map((t) => t.firstResponseMins).filter((m): m is number => m !== undefined).sort((a, b) => a - b);
    const median = responses.length ? responses[Math.floor(responses.length / 2)] : null;
    const count = <K extends string>(items: SupportQueueTicket[], key: (t: SupportQueueTicket) => K) =>
      items.reduce<Record<string, number>>((acc, t) => ((acc[key(t)] = (acc[key(t)] ?? 0) + 1), acc), {});
    // Last 14 days: reports in per day.
    const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), i - 13)));
    return {
      loading,
      total: tickets.length,
      open: open.length,
      fresh: tickets.filter((t) => t.status === "new").length,
      blockers: open.filter((t) => t.severity === "blocker").length,
      needInfo: tickets.filter((t) => t.status === "need_info").length,
      unassigned: open.filter((t) => !t.assignee).length,
      resolvedWeek: tickets.filter((t) => !isOpen(t) && t.updatedAt.slice(0, 10) >= weekAgo).length,
      medianFirstResponseMins: median,
      waitingNoReply: open.filter((t) => !t.messages.some((m) => m.by === "support")).length,
      byArea: count(open, (t) => t.area),
      byDevice: count(tickets, (t) => t.diagnostics?.device ?? "unknown"),
      byBrowser: count(tickets, (t) => (t.diagnostics?.browser ?? "نامشخص").split(" ")[0]),
      perDay: days.map((d) => ({ date: d, count: tickets.filter((t) => t.date === d).length })),
      urgent: sortQueue(open).filter((t) => t.severity === "blocker" || t.status === "new").slice(0, 5),
    };
  }, [tickets, loading]);
}

export type ErrorGroup = { message: string; count: number; reports: { id: string; ref: string }[]; pages: string[]; browsers: string[]; last: string };

/** Browser errors attached to reports, grouped by message (numbers and ids folded so repeats match). */
export function useErrorGroups() {
  const { tickets, loading } = useSupportQueue();
  const groups = useMemo(() => {
    const map = new Map<string, ErrorGroup>();
    for (const t of tickets) {
      for (const e of t.diagnostics?.recentErrors ?? []) {
        const key = e.message.replace(/\d+/g, "#").replace(/'[^']*'/g, "'…'").slice(0, 200);
        const g = map.get(key) ?? { message: e.message, count: 0, reports: [], pages: [], browsers: [], last: "" };
        g.count++;
        if (!g.reports.some((r) => r.id === t.id)) g.reports.push({ id: t.id, ref: t.ref });
        if (!g.pages.includes(e.page)) g.pages.push(e.page);
        const browser = `${t.diagnostics?.browser} · ${t.diagnostics?.os}`;
        if (!g.browsers.includes(browser)) g.browsers.push(browser);
        const when = `${t.date} ${e.time}`;
        if (when > g.last) g.last = when;
        map.set(key, g);
      }
    }
    return [...map.values()].sort((a, b) => b.reports.length - a.reports.length || b.last.localeCompare(a.last));
  }, [tickets]);
  return { groups, loading };
}

/** Saved answers: list, add, edit, delete. */
export function useCannedReplies() {
  const client = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["support-replies"], queryFn: getCannedReplies });
  const [draft, setDraft] = useState<{ id?: string; title: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = () => client.invalidateQueries({ queryKey: ["support-replies"] });
  return {
    replies: data,
    loading: isLoading,
    draft,
    startNew: () => { setDraft({ title: "", text: "" }); setError(""); },
    edit: (c: CannedReply) => { setDraft({ ...c }); setError(""); },
    cancel: () => setDraft(null),
    setDraft: (patch: Partial<{ title: string; text: string }>) => setDraft((d) => (d ? { ...d, ...patch } : d)),
    busy,
    error,
    save: async () => {
      if (!draft) return;
      if (draft.title.trim().length < 3) return setError("یک عنوان کوتاه بنویسید");
      if (draft.text.trim().length < 10) return setError("متن پاسخ کوتاه است");
      if (draft.text.length > SUPPORT_LIMITS.reply) return setError("متن طولانی است");
      setBusy(true);
      try {
        await saveCannedReply({ id: draft.id, title: draft.title.trim().slice(0, 60), text: draft.text.trim() });
        setDraft(null);
        await refresh();
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
    remove: async (id: string) => {
      setBusy(true);
      try {
        await deleteCannedReply(id);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
  };
}
