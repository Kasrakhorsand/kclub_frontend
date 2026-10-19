"use client";
/** Notifications — every role. */
import { NOTIFS } from "@/engine/mock";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Full notification list; unread items get a "new" pill. */
export function NotificationsView() {
  return (
    <>
      <PageHead title="اعلان‌ها" />
      <div className="card list">
        {NOTIFS.map((n) => (
          <div className="li" key={n.id}>
            <span><b>{n.title}</b><br /><span className="small muted">{n.text}</span></span>
            {!n.read && <span className="pill red">جدید</span>}
          </div>
        ))}
      </div>
    </>
  );
}
