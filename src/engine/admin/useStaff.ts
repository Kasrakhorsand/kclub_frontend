"use client";
/**
 * Admin staff management: give any phone the front desk role (a new number
 * gets an account with the entered name), take roles away, and choose what
 * each front desk account may do with site content.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { findCustomer, getStaff, grantStaffRole, revokeStaffRole, setStaffPermissions } from "@/engine/api";
import { toLatinDigits } from "@/engine/format";
import { useSession } from "@/engine/store";
import type { StaffPermission } from "@/engine/types";

const PHONE = /^09\d{9}$/;

export function useStaff() {
  const client = useQueryClient();
  const me = useSession((s) => s.user?.phone);
  const { data: staff = [], isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: getStaff });

  const [phoneText, setPhoneText] = useState("");
  const phone = toLatinDigits(phoneText).replace(/\D/g, "").slice(0, 11);
  const phoneOk = PHONE.test(phone);
  const { data: found, isFetching: lookingUp } = useQuery({ queryKey: ["desk-customer", phone], queryFn: () => findCustomer(phone), enabled: phoneOk });
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const isNew = phoneOk && found === null;
  const already = staff.find((s) => s.phone === phone && s.roles.includes("secretary"));

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [confirm, setConfirm] = useState<{ phone: string; role: "secretary" | "admin" } | null>(null);

  const refresh = () => {
    for (const key of [["admin-staff"], ["desk-customers"], ["admin-audit"]]) client.invalidateQueries({ queryKey: key });
  };
  const run = async (key: string, task: () => Promise<string | void>) => {
    setBusy(key);
    setError("");
    setDone("");
    try {
      const msg = await task();
      if (msg) setDone(msg);
      refresh();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return {
    staff, loading: isLoading, me,
    phoneText, setPhoneText: (t: string) => { setPhoneText(t); setError(""); setDone(""); },
    phoneOk, lookingUp, found: found ?? null, isNew, already, first, setFirst, last, setLast,
    busy, error, done,
    grant: () =>
      run("grant", async () => {
        if (!phoneOk) throw new Error("شماره‌ی موبایل را کامل وارد کنید");
        if (isNew && (first.trim().length < 2 || last.trim().length < 2)) throw new Error("نام و نام خانوادگی را بنویسید");
        const m = await grantStaffRole(phone, "secretary", isNew ? { first: first.trim().slice(0, 40), last: last.trim().slice(0, 60) } : undefined);
        setPhoneText("");
        setFirst("");
        setLast("");
        return `${m.first} ${m.last} منشی شد؛ با ورود بعدی پنل پذیرش را می‌بیند.`;
      }),
    /** Removing a role asks once before doing it. */
    confirm, askRevoke: (p: string, role: "secretary" | "admin") => setConfirm({ phone: p, role }), cancelRevoke: () => setConfirm(null),
    revoke: () =>
      confirm &&
      run(`revoke-${confirm.phone}`, async () => {
        await revokeStaffRole(confirm.phone, confirm.role);
        setConfirm(null);
        return confirm.role === "admin" ? "نقش مدیر برداشته شد." : "نقش منشی برداشته شد.";
      }),
    togglePermission: (p: string, current: StaffPermission[], perm: StaffPermission) =>
      run(`perm-${p}`, async () => {
        const next = current.includes(perm) ? current.filter((x) => x !== perm) : [...current, perm];
        // Managing albums without adding photos makes no sense, so albums brings gallery with it.
        const withDeps = next.includes("albums") && !next.includes("gallery") ? [...next, "gallery" as const] : next;
        await setStaffPermissions(p, withDeps);
      }),
  };
}
