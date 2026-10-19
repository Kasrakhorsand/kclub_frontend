/** K Club panel icons: menu key → Steel Edition 3D icon. Menu items themselves live in the engine (engine/panel/menus.ts). */
import type { Icon3DName } from "@/ui/kit/icons3d";

export const MENU_ICON: Record<string, Icon3DName> = {
  dash: "grid", book: "court", res: "list", wallet: "wallet", notif: "bell", match: "users", tour: "trophy",
  coach: "user", cafe: "cup", shop: "bag", tickets: "ticket", logout: "door", sched: "cal", newb: "plus",
  users: "users", wops: "swap", cash: "cash", courts: "court", close: "lock", pricing: "tag", settings: "gear",
  rfin: "chart", rbook: "trend", alltx: "swap", audit: "hist", profile: "user",
};
