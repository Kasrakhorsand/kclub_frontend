"use client";
/** Admin › Courts (/panel/courts): courts and their active state. */
import type { Court } from "@/engine/types";
import { COURTS, sportById, sportTitle } from "@/engine/venue";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** e.g. "سرپوشیده · چمن آبی" or "ماسه · تنیس ساحلی و والیبال ساحلی". */
function courtDescription(court: Court) {
  const sport = sportById(court.sport);
  if (!sport) return court.surface;
  return sport.games.length > 1 ? `${court.surface} · ${sportTitle(sport)}` : `${sport.indoor ? "سرپوشیده" : "روباز"} · ${court.surface}`;
}

export function CourtsView() {
  return (
    <>
      <PageHead title="زمین‌ها" />
      <div className="grid courts">
        {COURTS.map((c) => (
          <div className="card stack" key={c.id}>
            <b>{c.name}</b>
            <span className="small muted">{courtDescription(c)}</span>
            <label className="row small"><input type="checkbox" defaultChecked={c.active} /> فعال</label>
          </div>
        ))}
      </div>
    </>
  );
}
