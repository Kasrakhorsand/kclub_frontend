"use client";
/**
 * Panel router: picks the page for the current role and URL section
 * (`/panel/<section>`). Unknown sections fall back to the role's dashboard.
 */
import type { ReactNode } from "react";
import { useSession } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ComingSoon, NotificationsView, TicketsView } from "./shared";
import { MyBookingsView, PlayerDashboard, ProfileView, WalletView } from "./player";
import { AllTransactionsView, DailyCashView, FrontDeskDashboard, NewBookingView, ScheduleView, UsersView } from "./staff";
import { AdminDashboard, AuditLogView, CloseCourtView, CourtsView, FinanceReportsView, PricingView, SettingsView } from "./admin";

/** Sections that only show a "next phase" placeholder for now. */
const COMING_SOON: Record<string, [title: string, lines: string[]]> = {
  match: ["هم‌بازی", ["پیدا کردن هم‌بازی هم‌سطح برای پدل و ساحلی."]],
  tour: ["مسابقات", ["ثبت‌نام و جدول مسابقات کی کلاب."]],
  coach: ["پکیج مربی", ["خرید پکیج جلسات با مربیان پدل."]],
  cafe: ["کافه", ["سفارش از کافه‌ی مجموعه و پرداخت با کیف پول."]],
  shop: ["فروشگاه", ["خرید تجهیزات و پرداخت با کیف پول."]],
};

type Routes = Record<string, () => ReactNode>;

const COMMON: Routes = {
  tickets: () => <TicketsView />,
  notif: () => <NotificationsView />,
};

const BY_ROLE: Record<Role, Routes> = {
  player: {
    dash: () => <PlayerDashboard />,
    res: () => <MyBookingsView />,
    wallet: () => <WalletView />,
    profile: () => <ProfileView />,
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
    sched: () => <ScheduleView />,
    newb: () => <NewBookingView />,
    users: () => <UsersView />,
    courts: () => <CourtsView />,
    close: () => <CloseCourtView />,
    pricing: () => <PricingView />,
    settings: () => <SettingsView />,
    rfin: () => <FinanceReportsView />,
    alltx: () => <AllTransactionsView title="تراکنش‌ها" />,
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
