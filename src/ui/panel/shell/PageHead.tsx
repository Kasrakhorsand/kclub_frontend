"use client";
/** Page title row used at the top of every panel page. */


/** Panel page header: title, optional subtitle and an action on the opposite side. */
export const PageHead = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="ph">
    <div>
      <h2>{title}</h2>
      {sub && <p className="small muted">{sub}</p>}
    </div>
    {action}
  </div>
);
