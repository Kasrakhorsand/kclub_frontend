/**
 * Panel sections per role. Keys are the URL segment (/panel/<key>); labels
 * are the default menu text. Sites add their own icons on top.
 */
import type { Role } from "@/engine/types";

/** `needs: "content"` hides the item from a front desk account the admin gave no content permission. */
export type MenuItem = { key: string; label: string; soon?: boolean; needs?: "content" };

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
    { key: "media", label: "گالری و رسانه", needs: "content" },
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
    { key: "media", label: "گالری و رسانه" },
    { key: "audit", label: "تاریخچه تغییرات" },
    { key: "notif", label: "اعلان‌ها" },
    { key: "profile", label: "پروفایل و رمز عبور" },
  ],
};

export const ROLE_FA: Record<Role, string> = { player: "بازیکن", secretary: "منشی", admin: "ادمین" };
export const ROLE_EN: Record<Role, string> = { player: "Player", secretary: "Front Desk", admin: "Admin" };

/** Menu key → URL; "book" leaves the panel for the public booking flow. */
export const sectionHref = (key: string) => (key === "book" ? "/sport" : key === "dash" ? "/panel" : `/panel/${key}`);
