"use client";
/** Row of KPI tiles at the top of dashboards and reports. */


/** One KPI tile: label, value and optional detail line. */
export type Kpi = [label: string, value: string, detail?: string];

/** Row of KPI tiles at the top of a dashboard or report. */
export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid kpis">
      {items.map(([label, value, detail]) => (
        <div className="card kpi" key={label}>
          <span className="small muted">{label}</span>
          <span className="v">{value}</span>
          {detail && <span className="d muted">{detail}</span>}
        </div>
      ))}
    </div>
  );
}
