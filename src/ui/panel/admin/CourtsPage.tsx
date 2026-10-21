"use client";
/**
 * Admin › Courts (/panel/courts). One card per court grouped by sport, with
 * a switch to show or hide it in online booking and a link to close it for
 * a time range. Styles: admin.css ("co-").
 */
import Link from "next/link";
import clsx from "clsx";
import { useCourtsAdmin } from "@/engine/admin/useCourtsAdmin";
import { SPORTS, sportTitle } from "@/engine/venue";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function CourtsView() {
  const c = useCourtsAdmin();
  return (
    <div className="ad">
      <PageHead title="زمین‌ها" sub="زمین غیرفعال در رزرو آنلاین دیده نمی‌شود؛ رزروهای قبلی‌اش سر جایشان می‌مانند." action={<Link className="btn soft sm" href="/panel/close">بستن زمین برای یک بازه</Link>} />
      {SPORTS.map((sport) => (
        <section key={sport.id} className="co-group">
          <h3>{sport.name}<small>{sport.games.length > 1 ? sportTitle(sport) : sport.indoor ? "سرپوشیده" : "روباز"}</small></h3>
          <div className="co-grid">
            {c.courts.filter((x) => x.sport === sport.id).map((court) => (
              <article key={court.id} className={clsx("co-card", !court.active && "off")}>
                <span className="co-floor" style={{ background: court.floor }} aria-hidden />
                <div className="co-body">
                  <b>{court.name}</b>
                  <small>{court.surface}</small>
                </div>
                <label className="co-switch">
                  <input type="checkbox" role="switch" checked={court.active} disabled={c.busyId === court.id} onChange={(e) => c.toggle(court.id, e.target.checked)} />
                  <span aria-hidden />
                  <em>{court.active ? "فعال" : "غیرفعال"}</em>
                </label>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
