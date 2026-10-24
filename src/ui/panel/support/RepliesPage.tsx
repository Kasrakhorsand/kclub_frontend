"use client";
/** Support › Saved answers (/panel/replies): answers the team drops into replies with one click. */
import { fa } from "@/engine/format";
import { SUPPORT_LIMITS } from "@/engine/support/useSupport";
import { useCannedReplies } from "@/engine/support/useSupportDesk";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function SupportRepliesView() {
  const r = useCannedReplies();
  return (
    <div className="ad sd">
      <PageHead title="پاسخ‌های آماده" sub="در صف گزارش‌ها با یک کلیک داخل پاسخ قرار می‌گیرند و قبل از ارسال قابل ویرایش‌اند." action={!r.draft && <Button3D size="sm" onClick={r.startNew}>پاسخ آماده‌ی جدید</Button3D>} />

      {r.draft && (
        <form
          className="ad-card sd-form"
          onSubmit={(e) => {
            e.preventDefault();
            r.save();
          }}
        >
          <label className="f">عنوان<input className="input" maxLength={60} value={r.draft.title} onChange={(e) => r.setDraft({ title: e.target.value })} placeholder="مثلاً: پیگیری پرداخت" /></label>
          <label className="f">
            متن <small className="muted">{fa(r.draft.text.length)} از {fa(SUPPORT_LIMITS.reply)}</small>
            <textarea className="input" rows={4} maxLength={SUPPORT_LIMITS.reply} value={r.draft.text} onChange={(e) => r.setDraft({ text: e.target.value })} />
          </label>
          {r.error && <p className="su-err" role="alert">{r.error}</p>}
          <div className="tc-actions">
            <button type="button" className="btn ghost sm" onClick={r.cancel}>انصراف</button>
            <Button3D type="submit" size="sm" disabled={r.busy}>ذخیره</Button3D>
          </div>
        </form>
      )}

      {r.loading && <p className="muted small">در حال بارگذاری…</p>}
      <ul className="sd-replies">
        {r.replies.map((c) => (
          <li key={c.id} className="ad-card">
            <header><h3>{c.title}</h3>
              <span className="sd-actions">
                <button type="button" className="btn ghost sm" onClick={() => r.edit(c)}>ویرایش</button>
                <button type="button" className="btn ghost sm" disabled={r.busy} onClick={() => r.remove(c.id)} aria-label={`حذف ${c.title}`}>حذف</button>
              </span>
            </header>
            <p>{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
