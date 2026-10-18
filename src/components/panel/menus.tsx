import type { Icon3DName } from "../ui/icons3d";
import type { Role } from "@/lib/types";

export type MenuItem = { key: string; label: string; soon?: boolean };

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
    { key: "profile", label: "پروفایل" },
  ],
  secretary: [
    { key: "dash", label: "داشبورد" },
    { key: "sched", label: "جدول رزروها" },
    { key: "newb", label: "رزرو جدید" },
    { key: "users", label: "کاربران" },
    { key: "wops", label: "کیف پول و تراکنش‌ها" },
    { key: "tickets", label: "تیکت‌ها" },
    { key: "notif", label: "اعلان‌ها" },
    { key: "cash", label: "گزارش صندوق روزانه" },
  ],
  admin: [
    { key: "dash", label: "داشبورد" },
    { key: "sched", label: "جدول رزروها" },
    { key: "newb", label: "رزرو جدید" },
    { key: "users", label: "کاربران و نقش‌ها" },
    { key: "courts", label: "زمین‌ها" },
    { key: "close", label: "بستن زمین" },
    { key: "pricing", label: "قیمت‌گذاری" },
    { key: "settings", label: "تنظیمات و قوانین" },
    { key: "rfin", label: "گزارش‌های مالی" },
    { key: "alltx", label: "تراکنش‌ها" },
    { key: "tickets", label: "تیکت‌ها" },
    { key: "audit", label: "تاریخچه تغییرات" },
    { key: "notif", label: "اعلان‌ها" },
  ],
};

export const ROLE_FA: Record<Role, string> = { player: "بازیکن", secretary: "منشی", admin: "ادمین" };
export const ROLE_EN: Record<Role, string> = { player: "Player", secretary: "Front Desk", admin: "Admin" };

/** Menu key → Steel Edition 3D icon. */
export const MENU_ICON: Record<string, Icon3DName> = {
  dash: "grid", book: "court", res: "list", wallet: "wallet", notif: "bell", match: "users", tour: "trophy",
  coach: "user", cafe: "cup", shop: "bag", tickets: "ticket", logout: "door", sched: "cal", newb: "plus",
  users: "users", wops: "swap", cash: "cash", courts: "court", close: "lock", pricing: "tag", settings: "gear",
  rfin: "chart", rbook: "trend", alltx: "swap", audit: "hist", profile: "user",
};
