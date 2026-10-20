"use client";
/**
 * Panel page header. The page name is already shown large in the top bar, so
 * here the title is only for screen readers; the row shows the subtitle and
 * an action, and disappears when there are neither.
 */
export const PageHead = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <>
    <h2 className="sr-only">{title}</h2>
    {(sub || action) && (
      <div className="ph">
        {sub ? <p className="small muted">{sub}</p> : <span />}
        {action}
      </div>
    )}
  </>
);
