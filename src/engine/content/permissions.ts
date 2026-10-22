"use client";
/**
 * Who may edit site content. The admin can do everything; a front desk
 * account only what the admin allowed (StaffPermission). The backend checks
 * the same rules on every request; this only decides what the panel shows.
 */
import { CONTENT_UPLOAD } from "@/engine/config";
import { useSession } from "@/engine/store";
import type { StaffPermission } from "@/engine/types";

export const STAFF_PERMISSIONS: { id: StaffPermission; label: string; hint: string }[] = [
  { id: "gallery", label: "عکس‌های گالری", hint: "افزودن، حذف و مرتب کردن عکس در آلبوم‌های موجود" },
  { id: "albums", label: "ساخت و انتشار آلبوم", hint: "ساختن، تغییر نام، انتشار و حذف آلبوم" },
  { id: "coaches", label: "پروفایل مربیان", hint: "افزودن، ویرایش، انتشار و حذف مربی‌ها، با عکس و برنامه‌ی هفتگی" },
  { id: "home", label: "عکس و ویدیوی صفحه‌ی اصلی", hint: "تعویض ویدیوهای بالای صفحه و عکس کارت‌ها" },
];

/** `can("gallery")` etc. for the signed-in panel role. */
export function useCan() {
  const role = useSession((s) => s.role);
  const perms = useSession((s) => s.user?.permissions);
  const can = (p: StaffPermission) => role === "admin" || (role === "secretary" && !!perms?.includes(p));
  return { can, any: STAFF_PERMISSIONS.some((p) => can(p.id)), isAdmin: role === "admin" };
}

/** Split picked files into accepted ones and Persian reasons for the rest. */
export function checkFiles(list: FileList | File[] | null | undefined, accept: "image" | "image+video", max: number = CONTENT_UPLOAD.maxBatch) {
  const files = Array.from(list ?? []);
  const ok: File[] = [];
  const errors: string[] = [];
  const mb = (n: number) => Math.round(n / 1024 / 1024).toLocaleString("fa-IR");
  for (const f of files) {
    const isImage = (CONTENT_UPLOAD.imageTypes as readonly string[]).includes(f.type);
    const isVideo = accept === "image+video" && (CONTENT_UPLOAD.videoTypes as readonly string[]).includes(f.type);
    if (!isImage && !isVideo) errors.push(`«${f.name}» پشتیبانی نمی‌شود؛ ${accept === "image" ? "فقط JPG، PNG یا WEBP" : "عکس JPG، PNG، WEBP یا ویدیوی MP4، WEBM"}`);
    else if (isImage && f.size > CONTENT_UPLOAD.maxImageBytes) errors.push(`«${f.name}» بیشتر از ${mb(CONTENT_UPLOAD.maxImageBytes)} مگابایت است`);
    else if (isVideo && f.size > CONTENT_UPLOAD.maxVideoBytes) errors.push(`«${f.name}» بیشتر از ${mb(CONTENT_UPLOAD.maxVideoBytes)} مگابایت است`);
    else if (ok.length >= max) errors.push(`در هر بار حداکثر ${max.toLocaleString("fa-IR")} فایل`);
    else ok.push(f);
  }
  return { ok, errors: [...new Set(errors)] };
}
