"use client";
/** Panel router: picks the page for the current role and URL section (/panel/<section>).
 * Unknown sections fall back to the role's dashboard. See README.md for the page → file map. */
import type { ReactNode } from "react";
import { useSession } from "@/engine/store";
import type { Role } from "@/engine/types";
import { SITE } from "@/config/site";
import { AuditLogView } from "@/ui/panel/admin/AuditLogPage";
import { CloseCourtView } from "@/ui/panel/admin/CloseCourtPage";
import { CourtsView } from "@/ui/panel/admin/CourtsPage";
import { AdminDashboard } from "@/ui/panel/admin/DashboardPage";
import { FinanceReportsView } from "@/ui/panel/admin/FinanceReportsPage";
import { PricingView } from "@/ui/panel/admin/PricingPage";
import { SettingsView } from "@/ui/panel/admin/SettingsPage";
import { ComingSoon } from "@/ui/panel/common/ComingSoonPage";
import { NotificationsView } from "@/ui/panel/common/NotificationsPage";
import { ProfileView } from "@/ui/panel/common/ProfilePage";
import { SupportView } from "@/ui/panel/common/SupportPage";
import { TicketsView } from "@/ui/panel/common/TicketsPage";
import { PlayerDashboard } from "@/ui/panel/player/DashboardPage";
import { MyBookingsView } from "@/ui/panel/player/MyBookingsPage";
import { WalletView } from "@/ui/panel/player/WalletPage";
import { DailyCashView } from "@/ui/panel/secretary/DailyCashPage";
import { FrontDeskDashboard } from "@/ui/panel/secretary/DashboardPage";
import { NewBookingView } from "@/ui/panel/secretary/NewBookingPage";
import { ScheduleView } from "@/ui/panel/secretary/SchedulePage";
import { AllTransactionsView } from "@/ui/panel/secretary/TransactionsPage";
import { UsersView } from "@/ui/panel/secretary/UsersPage";

/** Sections that only show a "next phase" placeholder for now. */
const COMING_SOON: Record<string, [title: string, lines: string[]]> = {
  match: ["هم‌بازی", ["پیدا کردن هم‌بازی هم‌سطح."]],
  tour: ["مسابقات", [`ثبت‌نام و جدول مسابقات ${SITE.name}.`]],
  coach: ["پکیج مربی", ["خرید پکیج جلسات با مربیان مجموعه."]],
  cafe: ["کافه", ["سفارش از کافه‌ی مجموعه و پرداخت با کیف پول."]],
  shop: ["فروشگاه", ["خرید تجهیزات و پرداخت با کیف پول."]],
};

type Routes = Record<string, () => ReactNode>;

const COMMON: Routes = {
  tickets: () => <TicketsView />,
  support: () => <SupportView />,
  notif: () => <NotificationsView />,
  profile: () => <ProfileView />,
};

const BY_ROLE: Record<Role, Routes> = {
  player: {
    dash: () => <PlayerDashboard />,
    res: () => <MyBookingsView />,
    wallet: () => <WalletView />,
  },
  secretary: {
    dash: () => <FrontDeskDashboard />,
    sched: () => <ScheduleView />,
    newb: () => <NewBookingView />,
    users: () => <UsersView />,
    wops: () => <AllTransactionsView title="کیف پول و تراکنش‌ها" />,
    cash: () => <DailyCashView />,
  },
  admin: {
    dash: () => <AdminDashboard />,
    // The next three pages are the front desk's (src/ui/panel/secretary), shared with admin.
    sched: () => <ScheduleView />,
    newb: () => <NewBookingView />,
    users: () => <UsersView />,
    courts: () => <CourtsView />,
    close: () => <CloseCourtView />,
    pricing: () => <PricingView />,
    settings: () => <SettingsView />,
    rfin: () => <FinanceReportsView />,
    alltx: () => <AllTransactionsView title="تراکنش‌ها" />, // front desk page, admin title
    audit: () => <AuditLogView />,
  },
};

export function PanelView({ section }: { section: string }) {
  const role = useSession((s) => s.role);
  if (!role) return null;
  if (COMING_SOON[section]) {
    const [title, lines] = COMING_SOON[section];
    return <ComingSoon title={title} lines={lines} />;
  }
  const render = BY_ROLE[role][section] ?? COMMON[section] ?? BY_ROLE[role].dash;
  return <>{render()}</>;
}
