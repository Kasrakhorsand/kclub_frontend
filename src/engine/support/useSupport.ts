"use client";
/**
 * Technical support for every role: report a website problem to the site's
 * support team (not the venue's front desk), follow its status and talk to
 * support. A report collects the area, severity, steps, what happened and
 * what was expected, screenshots, and (if the user agrees) device details.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { closeSupportTicket, createSupportTicket, getSupportTickets, replySupportTicket } from "@/engine/api";
import { SUPPORT_UPLOAD } from "@/engine/config";
import { useSession } from "@/engine/store";
import { collectDiagnostics } from "@/engine/support/diagnostics";
import type { NewSupportTicket, SupportArea, SupportDiagnostics, SupportSeverity, SupportTicket, SupportWhen } from "@/engine/types";

export const SUPPORT_LIMITS = { subject: 120, steps: 2000, actual: 2000, expected: 1000, refCode: 40, reply: 2000 } as const;

export const SUPPORT_AREAS: { id: SupportArea; label: string }[] = [
  { id: "login", label: "ورود و ثبت‌نام" },
  { id: "booking", label: "رزرو زمین" },
  { id: "payment", label: "پرداخت و درگاه" },
  { id: "wallet", label: "کیف پول" },
  { id: "panel", label: "پنل کاربری" },
  { id: "display", label: "نمایش و ظاهر" },
  { id: "speed", label: "کندی یا قطعی" },
  { id: "other", label: "سایر" },
];

export const SUPPORT_SEVERITIES: { id: SupportSeverity; label: string; hint: string }[] = [
  { id: "blocker", label: "کارم کاملاً متوقف شده", hint: "نمی‌توانم ادامه بدهم؛ مثلاً ورود یا پرداخت انجام نمی‌شود" },
  { id: "major", label: "مشکل جدی ولی راه دیگری هست", hint: "با تلاش دوباره یا روش دیگر کار انجام می‌شود" },
  { id: "minor", label: "جزئی یا ظاهری", hint: "به هم ریختگی صفحه، متن اشتباه، پیشنهاد" },
];

export const SUPPORT_WHEN: { id: SupportWhen; label: string }[] = [
  { id: "now", label: "همین الان" },
  { id: "today", label: "امروز" },
  { id: "yesterday", label: "دیروز" },
  { id: "earlier", label: "قبل‌تر" },
];

const supportKey = (phone: string) => ["support", phone];

type Picked = { file: File; preview: string };

/** Screenshot picker with type, size and count checks; frees previews when files go away. */
function useAttachments() {
  const [items, setItems] = useState<Picked[]>([]);
  const [error, setError] = useState("");
  const live = useRef(items);
  live.current = items;
  useEffect(() => () => live.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const add = (list: FileList | File[] | null | undefined) => {
    if (!list) return;
    const incoming = Array.from(list);
    const room = SUPPORT_UPLOAD.maxFiles - items.length;
    const problems: string[] = [];
    const ok: Picked[] = [];
    for (const file of incoming) {
      if (!(SUPPORT_UPLOAD.types as readonly string[]).includes(file.type)) problems.push(`«${file.name}» عکس نیست؛ فقط PNG، JPG یا WEBP`);
      else if (file.size > SUPPORT_UPLOAD.maxBytes) problems.push(`«${file.name}» بیشتر از ${SUPPORT_UPLOAD.maxBytes / 1024 / 1024} مگابایت است`);
      else if (ok.length >= room) problems.push(`حداکثر ${SUPPORT_UPLOAD.maxFiles} عکس`);
      else ok.push({ file, preview: URL.createObjectURL(file) });
    }
    setError([...new Set(problems)].join("؛ "));
    if (ok.length) setItems((cur) => [...cur, ...ok]);
  };
  const remove = (index: number) =>
    setItems((cur) => {
      URL.revokeObjectURL(cur[index].preview);
      return cur.filter((_, i) => i !== index);
    });
  const clear = () =>
    setItems((cur) => {
      cur.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });

  return { items, files: items.map((p) => p.file), add, remove, clear, error, full: items.length >= SUPPORT_UPLOAD.maxFiles, limit: SUPPORT_UPLOAD };
}

const EMPTY: Omit<NewSupportTicket, "diagnostics"> = {
  area: "booking", severity: "major", subject: "", steps: "", actual: "", expected: "", when: "now", whenTime: "", refCode: "", allowCall: false,
};

export function useSupport() {
  const phone = useSession((s) => s.user?.phone ?? "");
  const role = useSession((s) => s.role);
  const client = useQueryClient();
  const { data: tickets = [], isLoading } = useQuery({ queryKey: supportKey(phone), queryFn: getSupportTickets, enabled: !!phone });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [shareDiagnostics, setShareDiagnostics] = useState(true);
  const [diagnostics, setDiagnostics] = useState<SupportDiagnostics | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const newFiles = useAttachments();
  const replyFiles = useAttachments();

  const selected: SupportTicket | null = tickets.find((t) => t.id === selectedId) ?? null;
  const refresh = () => client.invalidateQueries({ queryKey: ["support"] });

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

  const validate = () => {
    const f = form;
    if (f.subject.trim().length < 5) return "یک عنوان کوتاه برای مشکل بنویسید (حداقل ۵ حرف)";
    if (f.actual.trim().length < 10) return "بنویسید دقیقاً چه اتفاقی افتاد (حداقل ۱۰ حرف)";
    if (f.steps.trim().length < 10) return "مراحلی را که انجام دادید بنویسید (حداقل ۱۰ حرف)";
    if (f.whenTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.whenTime)) return "ساعت را به شکل ۲۱:۳۰ بنویسید";
    if (f.refCode && !/^[A-Za-z0-9-]{3,40}$/.test(f.refCode.trim())) return "کد رهگیری فقط حروف لاتین، عدد و خط تیره است";
    for (const [k, max] of Object.entries(SUPPORT_LIMITS)) {
      const v = (f as Record<string, unknown>)[k];
      if (typeof v === "string" && v.length > max) return "یکی از متن‌ها طولانی است";
    }
    return "";
  };

  return {
    role,
    loading: isLoading,
    tickets,
    openCount: tickets.filter((t) => t.status !== "closed" && t.status !== "resolved").length,
    needInfoCount: tickets.filter((t) => t.status === "need_info").length,
    selected,
    select: (id: string | null) => {
      setSelectedId(id);
      setComposing(false);
      setCreated(null);
      setReply("");
      replyFiles.clear();
      setError("");
    },
    busy,
    error,

    /* ----- new report ----- */
    composing,
    startCompose: () => {
      setComposing(true);
      setSelectedId(null);
      setCreated(null);
      setError("");
      setDiagnostics(collectDiagnostics(role));
    },
    cancelCompose: () => {
      setComposing(false);
      newFiles.clear();
      setError("");
    },
    form,
    setForm: (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch })),
    files: newFiles,
    shareDiagnostics,
    setShareDiagnostics,
    /** What will be sent if sharing is on; shown to the user in full. */
    diagnostics,
    /** Ref of the report just sent, for the success message. */
    created,
    submit: () =>
      run(async () => {
        const problem = validate();
        if (problem) throw new Error(problem);
        const f = form;
        const input: NewSupportTicket = {
          area: f.area,
          severity: f.severity,
          subject: f.subject.trim(),
          steps: f.steps.trim(),
          actual: f.actual.trim(),
          expected: f.expected?.trim() || undefined,
          when: f.when,
          whenTime: f.whenTime || undefined,
          refCode: f.refCode?.trim() || undefined,
          allowCall: f.allowCall,
          diagnostics: shareDiagnostics ? collectDiagnostics(role) : undefined,
        };
        const t = await createSupportTicket(input, newFiles.files);
        setForm(EMPTY);
        newFiles.clear();
        setComposing(false);
        setSelectedId(t.id);
        setCreated(t.ref);
      }),

    /* ----- conversation ----- */
    reply,
    setReply,
    replyFiles,
    sendReply: () =>
      run(async () => {
        if (!selected) return;
        const text = reply.trim();
        if (!text && !replyFiles.files.length) return;
        if (text.length > SUPPORT_LIMITS.reply) throw new Error("پیام طولانی است");
        await replySupportTicket(selected.id, text, replyFiles.files);
        setReply("");
        replyFiles.clear();
      }),
    canClose: !!selected && selected.status !== "closed",
    close: () => run(async () => { if (selected) await closeSupportTicket(selected.id); }),
  };
}
