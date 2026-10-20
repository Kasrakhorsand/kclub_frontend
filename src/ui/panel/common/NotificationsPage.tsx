"use client";
/**
 * Notifications — every role (/panel/notif): grouped by day, unread filter,
 * mark one or all as read; tapping one marks it read and opens its page.
 * Styles: common.css ("nt-").
 */
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { fa, jFull } from "@/engine/format";
import { useNotifications } from "@/engine/notifications/useNotifications";
import { safeInternalPath } from "@/engine/security";
import type { Notif, NotifKind } from "@/engine/types";
import { Icon3D } from "@/ui/kit/Icon3D";
import type { Icon3DName } from "@/ui/kit/icons3d";
import { PageHead } from "@/ui/panel/shell/PageHead";

const KIND: Record<NotifKind, { icon: Icon3DName; label: string }> = {
  booking: { icon: "cal", label: "رزرو" },
  wallet: { icon: "wallet", label: "کیف پول" },
  ticket: { icon: "ticket", label: "تیکت" },
  system: { icon: "bell", label: "مجموعه" },
};

export function NotificationsView() {
  const n = useNotifications();
  const router = useRouter();

  const open = async (item: Notif) => {
    if (!item.read) await n.markRead(item.id);
    // href comes from the backend: follow it only if it is an in-app path.
    if (item.href) router.push(safeInternalPath(item.href, "/panel/notif"));
  };

  return (
    <div className="nt">
      <PageHead
        title="اعلان‌ها"
        sub={n.unread ? `${fa(n.unread)} اعلان خوانده‌نشده` : "همه‌ی اعلان‌ها را خوانده‌اید"}
        action={n.unread ? <button className="btn ghost sm" onClick={n.markAllRead}>خواندن همه</button> : undefined}
      />

      <div className="nt-tabs" role="tablist" aria-label="فیلتر اعلان‌ها">
        <button role="tab" aria-selected={n.filter === "all"} className={clsx(n.filter === "all" && "on")} onClick={() => n.setFilter("all")}>
          همه <i>{fa(n.total)}</i>
        </button>
        <button role="tab" aria-selected={n.filter === "unread"} className={clsx(n.filter === "unread" && "on")} onClick={() => n.setFilter("unread")}>
          خوانده‌نشده <i>{fa(n.unread)}</i>
        </button>
      </div>

      {n.loading && <p className="muted small">در حال بارگذاری…</p>}
      {!n.loading && !n.days.length && (
        <div className="nt-empty">
          <Icon3D name="bell" />
          <h3>{n.filter === "unread" ? "اعلان خوانده‌نشده‌ای ندارید" : "هنوز اعلانی ندارید"}</h3>
        </div>
      )}

      {n.days.map((day) => (
        <section className="nt-day" key={day.date}>
          <h4>{jFull(day.date)}</h4>
          <ul>
            {day.items.map((item) => {
              const kind = KIND[item.kind ?? "system"];
              return (
                <li key={item.id}>
                  <button type="button" className={clsx("nt-item", !item.read && "unread", item.kind)} onClick={() => open(item)}>
                    <Icon3D name={kind.icon} />
                    <span className="nt-body">
                      <span className="nt-top">
                        <b>{item.title}</b>
                        <small>{kind.label}{item.time ? ` · ${fa(item.time)}` : ""}</small>
                      </span>
                      <span className="nt-text">{item.text}</span>
                    </span>
                    {!item.read && <span className="nt-dot" aria-label="خوانده‌نشده" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
