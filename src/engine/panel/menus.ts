/**
 * Panel sections per role. Keys are the URL segment (/panel/<key>); labels
 * are the default menu text. Sites add their own icons on top.
 */
import type { Role, StaffPermission } from "@/engine/types";

/** `needs` hides the item from a front desk account that has none of these content permissions (admin sees everything). */
export type MenuItem = { key: string; label: string; soon?: boolean; needs?: StaffPermission[] };

export const MENUS: Record<Role, MenuItem[]> = {
  player: [
    { key: "dash", label: "داشبورد" },
    { key: "book", label: "رزرو زمین" },
    { key: "res", label: "رزروهای من" },
    { key: "wallet", label: "کیف پول" },
    { key: "notif", label: "اعلان‌ها" },
    { key: "match", label: "هم‌بازی", soon: true },
    { key: "tour", label: "مسابقات", soon: true },
    { key: "coach", label: "پکیج مربی", soon: true },
    { key: "cafe", label: "کافه", soon: true },
    { key: "shop", label: "فروشگاه", soon: true },
    { key: "tickets", label: "تیکت‌ها" },
    { key: "support", label: "پشتیبانی فنی سایت" },
    { key: "profile", label: "پروفایل و رمز عبور" },
  ],
  secretary: [
    { key: "dash", label: "داشبورد" },
    { key: "sched", label: "جدول رزروها" },
    { key: "newb", label: "رزرو جدید" },
    { key: "users", label: "کاربران" },
    { key: "wops", label: "کیف پول و تراکنش‌ها" },
    { key: "tickets", label: "تیکت‌ها" },
    { key: "support", label: "پشتیبانی فنی سایت" },
    { key: "notif", label: "اعلان‌ها" },
    { key: "cash", label: "گزارش صندوق روزانه" },
    { key: "coaches", label: "مربیان", needs: ["coaches"] },
    { key: "media", label: "گالری و رسانه", needs: ["gallery", "albums", "home"] },
    { key: "profile", label: "پروفایل و رمز عبور" },
  ],
  admin: [
    { key: "dash", label: "داشبورد" },
    { key: "sched", label: "جدول رزروها" },
    { key: "newb", label: "رزرو جدید" },
    { key: "users", label: "کاربران" },
    { key: "staff", label: "کارکنان و دسترسی‌ها" },
    { key: "courts", label: "زمین‌ها" },
    { key: "close", label: "بستن زمین" },
    { key: "pricing", label: "قیمت‌گذاری" },
    { key: "settings", label: "تنظیمات و قوانین" },
    { key: "rfin", label: "گزارش‌های مالی" },
    { key: "alltx", label: "تراکنش‌ها" },
    { key: "tickets", label: "تیکت‌ها" },
    { key: "support", label: "پشتیبانی فنی سایت" },
    { key: "coaches", label: "مربیان" },
    { key: "media", label: "گالری و رسانه" },
    { key: "audit", label: "تاریخچه تغییرات" },
    { key: "notif", label: "اعلان‌ها" },
    { key: "profile", label: "پروفایل و رمز عبور" },
  ],
  support: [
    { key: "dash", label: "داشبورد" },
    { key: "queue", label: "صف گزارش‌ها" },
    { key: "errors", label: "خطاهای سایت" },
    { key: "health", label: "وضعیت سامانه" },
    { key: "notice", label: "اطلاعیه‌ی سایت" },
    { key: "replies", label: "پاسخ‌های آماده" },
    { key: "lookup", label: "جستجوی کاربر" },
    { key: "profile", label: "پروفایل و رمز عبور" },
  ],
};

export const ROLE_FA: Record<Role, string> = { player: "بازیکن", secretary: "منشی", admin: "ادمین", support: "پشتیبانی فنی" };
export const ROLE_EN: Record<Role, string> = { player: "Player", secretary: "Front Desk", admin: "Admin", support: "Support" };

/** Menu key → URL; "book" leaves the panel for the public booking flow. */
export const sectionHref = (key: string) => (key === "book" ? "/sport" : key === "dash" ? "/panel" : `/panel/${key}`);
