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

const PI = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
);

export const ICONS: Record<string, React.ReactNode> = {
  dash: PI('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  book: PI('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  res: PI('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'),
  wallet: PI('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>'),
  notif: PI('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
  match: PI('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5M14 15c3 0 8 1 8 5"/>'),
  tour: PI('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/>'),
  coach: PI('<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  cafe: PI('<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/>'),
  shop: PI('<path d="M5 7h14l-1 13H6z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
  tickets: PI('<path d="M4 5h16v11H8l-4 4z"/>'),
  logout: PI('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>'),
  sched: PI('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12"/>'),
  newb: PI('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  users: PI('<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.5.5 4 2.5 4 5.5"/>'),
  wops: PI('<path d="M4 7h16M4 7l3-3M4 7l3 3M20 17H4M20 17l-3-3M20 17l-3 3"/>'),
  cash: PI('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
  courts: PI('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 12h16M12 3v18"/>'),
  close: PI('<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  pricing: PI('<path d="M3 12l9-9h9v9l-9 9z"/><circle cx="16" cy="8" r="1.5"/>'),
  settings: PI('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
  rfin: PI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  alltx: PI('<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>'),
  audit: PI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  profile: PI('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
};
