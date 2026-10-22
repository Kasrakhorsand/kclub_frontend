"use client";
/**
 * Front desk coach profiles (coaches permission, or admin): list in site
 * order, add / edit every field with validation, publish or hide, reorder,
 * photo, and delete with a confirm step. Shared by every club site; each
 * site draws its own form.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCoach, getStaffCoaches, reorderCoaches, saveCoach, setCoachPhoto } from "@/engine/api";
import { checkFiles } from "@/engine/content/permissions";
import { toLatinDigits } from "@/engine/format";
import { SPORTS } from "@/engine/venue";
import type { Coach, CoachInput, CoachLevel } from "@/engine/types";

export const COACH_LEVELS: { id: CoachLevel; label: string; latin: string }[] = [
  { id: "head", label: "سرمربی", latin: "Head Coach" },
  { id: "coach", label: "مربی", latin: "Coach" },
  { id: "junior", label: "مربی کودکان و نوجوانان", latin: "Junior Coach" },
  { id: "guest", label: "مربی مهمان", latin: "Guest Coach" },
];

/** Persian day names, Saturday first (Coach.schedule day index). */
export const WEEK_DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

/** Every game the club offers, for the "teaches" picker. */
export const COACH_GAMES = SPORTS.flatMap((s) => s.games.map((g) => ({ id: g.id, name: g.name })));

export const COACH_LIMITS = { name: 60, title: 80, bio: 600, tag: 24, tags: 6, certificate: 60, certificates: 6, schedule: 14 } as const;

const EMPTY: CoachInput = { name: "", title: "", level: "coach", games: [], years: 0, price: 0, tags: [], bio: "", certificates: [], schedule: [], published: false };

/** Plain draft: numbers kept as typed text so the inputs stay editable. */
type Draft = Omit<CoachInput, "years" | "price" | "groupPrice"> & { years: string; price: string; groupPrice: string };
const toDraft = (c: CoachInput | Coach): Draft => ({
  name: c.name, title: c.title, level: c.level, games: [...c.games], tags: [...c.tags], bio: c.bio ?? "", certificates: [...(c.certificates ?? [])],
  gender: c.gender, schedule: (c.schedule ?? []).map((s) => ({ ...s })), published: c.published,
  years: c.years ? String(c.years) : "", price: c.price ? String(c.price) : "", groupPrice: c.groupPrice ? String(c.groupPrice) : "",
});
const num = (t: string) => Number(toLatinDigits(t).replace(/\D/g, "")) || 0;

/** Why this draft can't be saved, or "". */
function problemOf(d: Draft) {
  if (d.name.trim().length < 2) return "نام مربی را بنویسید";
  if (d.title.trim().length < 3) return "عنوان کوتاه مربی را بنویسید (مثلاً مربی پدل · سطح ۲)";
  if (!d.games.length) return "حداقل یک بازی که تدریس می‌کند را انتخاب کنید";
  if (num(d.years) > 60) return "سابقه بیشتر از ۶۰ سال نمی‌شود";
  const price = num(d.price);
  if (price < 50_000 || price > 50_000_000) return "قیمت جلسه‌ی خصوصی بین ۵۰ هزار و ۵۰ میلیون تومان باشد";
  const group = num(d.groupPrice);
  if (d.groupPrice && (group < 20_000 || group > price)) return "قیمت کلاس گروهی باید کمتر از جلسه‌ی خصوصی باشد";
  if (d.schedule?.some((s) => s.to <= s.from)) return "در برنامه‌ی هفتگی، ساعت پایان باید بعد از شروع باشد";
  return "";
}

export function useCoachEditor() {
  const client = useQueryClient();
  const { data: coaches = [], isLoading } = useQuery({ queryKey: ["staff-coaches"], queryFn: getStaffCoaches });
  /** null = list, "new" = add form, otherwise the coach id being edited. */
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft(EMPTY));
  const [tagText, setTagText] = useState("");
  const [certText, setCertText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const current = editing && editing !== "new" ? coaches.find((c) => c.id === editing) ?? null : null;
  const refresh = () => {
    for (const key of [["staff-coaches"], ["coaches"], ["admin-audit"]]) client.invalidateQueries({ queryKey: key });
  };
  const run = async (task: () => Promise<string | void>) => {
    setBusy(true);
    setError("");
    setDone("");
    try {
      const msg = await task();
      if (msg) setDone(msg);
      refresh();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const edit = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDone("");
    setError("");
  };

  return {
    coaches, loading: isLoading, editing, current, draft, busy, error, done,
    problem: editing ? problemOf(draft) : "",

    startNew: () => { setEditing("new"); setDraft(toDraft(EMPTY)); setConfirmDelete(false); setError(""); setDone(""); },
    startEdit: (c: Coach) => { setEditing(c.id); setDraft(toDraft(c)); setConfirmDelete(false); setError(""); setDone(""); },
    close: () => setEditing(null),

    set: edit,
    toggleGame: (id: string) => edit({ games: draft.games.includes(id) ? draft.games.filter((g) => g !== id) : [...draft.games, id] }),
    tagText, setTagText,
    addTag: () => {
      const t = tagText.trim().slice(0, COACH_LIMITS.tag);
      if (!t || draft.tags.includes(t) || draft.tags.length >= COACH_LIMITS.tags) return;
      edit({ tags: [...draft.tags, t] });
      setTagText("");
    },
    removeTag: (t: string) => edit({ tags: draft.tags.filter((x) => x !== t) }),
    certText, setCertText,
    addCert: () => {
      const t = certText.trim().slice(0, COACH_LIMITS.certificate);
      if (!t || (draft.certificates ?? []).length >= COACH_LIMITS.certificates) return;
      edit({ certificates: [...(draft.certificates ?? []), t] });
      setCertText("");
    },
    removeCert: (i: number) => edit({ certificates: (draft.certificates ?? []).filter((_, j) => j !== i) }),
    addSlot: () => (draft.schedule ?? []).length < COACH_LIMITS.schedule && edit({ schedule: [...(draft.schedule ?? []), { day: 0, from: 16, to: 20 }] }),
    setSlot: (i: number, patch: Partial<{ day: number; from: number; to: number }>) => edit({ schedule: (draft.schedule ?? []).map((s, j) => (j === i ? { ...s, ...patch } : s)) }),
    removeSlot: (i: number) => edit({ schedule: (draft.schedule ?? []).filter((_, j) => j !== i) }),

    save: () =>
      run(async () => {
        const p = problemOf(draft);
        if (p) throw new Error(p);
        const input: CoachInput = {
          name: draft.name.trim().slice(0, COACH_LIMITS.name),
          title: draft.title.trim().slice(0, COACH_LIMITS.title),
          level: draft.level,
          games: draft.games,
          years: num(draft.years),
          price: num(draft.price),
          groupPrice: draft.groupPrice ? num(draft.groupPrice) : undefined,
          tags: draft.tags,
          bio: draft.bio?.trim().slice(0, COACH_LIMITS.bio) || undefined,
          certificates: draft.certificates?.length ? draft.certificates : undefined,
          gender: draft.gender,
          schedule: draft.schedule?.length ? [...draft.schedule].sort((a, b) => a.day - b.day || a.from - b.from) : undefined,
          published: draft.published,
        };
        const saved = await saveCoach(input, current?.id);
        setEditing(saved.id);
        if (current) return "تغییرات ذخیره شد.";
        return input.published ? "مربی اضافه شد و در سایت دیده می‌شود. حالا عکسش را بگذارید." : "مربی به‌صورت پیش‌نویس اضافه شد؛ برای نمایش در سایت «منتشر شود» را روشن کنید.";
      }),
    /** Publish or hide straight from the list. */
    setPublished: (c: Coach, published: boolean) =>
      run(async () => {
        const { id: _id, photo: _p, order: _o, students: _s, satisfaction: _sa, rating: _r, reviews: _rv, ...input } = c;
        void [_id, _p, _o, _s, _sa, _r, _rv];
        await saveCoach({ ...input, published }, c.id);
      }),
    move: (c: Coach, dir: -1 | 1) =>
      run(async () => {
        const ids = coaches.map((x) => x.id);
        const i = ids.indexOf(c.id);
        const j = i + dir;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        await reorderCoaches(ids);
      }),
    photo: (list: FileList | null) =>
      current &&
      run(async () => {
        const { ok, errors } = checkFiles(list, "image", 1);
        if (!ok.length) throw new Error(errors.join("؛ ") || "فایلی انتخاب نشد");
        await setCoachPhoto(current.id, ok[0]);
      }),
    clearPhoto: () => current && run(async () => { await setCoachPhoto(current.id, null); }),
    confirmDelete, askDelete: () => setConfirmDelete(true), cancelDelete: () => setConfirmDelete(false),
    remove: () =>
      current &&
      run(async () => {
        await deleteCoach(current.id);
        setEditing(null);
        setConfirmDelete(false);
        return "مربی حذف شد.";
      }),
  };
}
