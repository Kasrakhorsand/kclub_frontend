"use client";
/**
 * Front desk (coaches permission) + Admin › Coaches (/panel/coaches). Every
 * coach profile in site order with publish and reorder; the form edits all
 * public details: photo, name, title, level, games, experience, prices,
 * tags, bio, certificates, gender and weekly hours. Styles: common.css ("ce-").
 */
import clsx from "clsx";
import { CONTENT_UPLOAD } from "@/engine/config";
import { COACH_GAMES, COACH_LEVELS, COACH_LIMITS, WEEK_DAYS, useCoachEditor } from "@/engine/content/useCoachEditor";
import { fa, hm, toman } from "@/engine/format";
import { HOURS } from "@/engine/venue";
import { Button3D } from "@/ui/kit/Buttons";
import { CoachPortrait } from "@/ui/coaches/CoachPortrait";
import { PageHead } from "@/ui/panel/shell/PageHead";

type E = ReturnType<typeof useCoachEditor>;

function List({ e }: { e: E }) {
  return (
    <aside className="ce-list" aria-label="فهرست مربیان">
      <Button3D size="sm" block onClick={e.startNew}>افزودن مربی</Button3D>
      {e.loading && <p className="ad-none">در حال بارگذاری…</p>}
      {!e.loading && !e.coaches.length && <p className="ad-none">هنوز مربی‌ای ثبت نشده است.</p>}
      <ol>
        {e.coaches.map((c, i) => (
          <li key={c.id} className={clsx(e.editing === c.id && "on", !c.published && "draft")}>
            <button type="button" className="ce-row" onClick={() => e.startEdit(c)}>
              <span className="ce-ph">
                {/* eslint-disable-next-line @next/next/no-img-element -- coach photo */}
                {c.photo ? <img src={c.photo} alt="" /> : <CoachPortrait name={c.name} />}
              </span>
              <span className="ce-who">
                <b>{c.name}</b>
                <small>{c.published ? COACH_LEVELS.find((l) => l.id === c.level)?.label : "پیش‌نویس · در سایت دیده نمی‌شود"}</small>
              </span>
            </button>
            <span className="ce-order">
              <button type="button" disabled={i === 0 || e.busy} onClick={() => e.move(c, -1)} aria-label={`${c.name} بالاتر`}>▲</button>
              <button type="button" disabled={i === e.coaches.length - 1 || e.busy} onClick={() => e.move(c, 1)} aria-label={`${c.name} پایین‌تر`}>▼</button>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function Form({ e }: { e: E }) {
  const d = e.draft;
  const isNew = e.editing === "new";
  return (
    <form className="ce-form" onSubmit={(ev) => { ev.preventDefault(); e.save(); }} noValidate>
      <header className="ce-head">
        <button type="button" className="cu-back" onClick={e.close} aria-label="بازگشت به فهرست">→</button>
        <h3>{isNew ? "مربی تازه" : d.name || "مربی"}</h3>
        <label className="ce-pub">
          <input type="checkbox" checked={d.published} onChange={(ev) => e.set({ published: ev.target.checked })} />
          منتشر شود
        </label>
      </header>

      <div className="ce-top">
        <div className="ce-photo">
          <div className="ce-photo-box">
            {/* eslint-disable-next-line @next/next/no-img-element -- coach photo */}
            {e.current?.photo ? <img src={e.current.photo} alt={d.name} /> : <CoachPortrait name={d.name || "؟"} />}
          </div>
          {isNew ? (
            <small>بعد از اولین ذخیره می‌توانید عکس بگذارید.</small>
          ) : (
            <div className="md-tools">
              <label className="md-pick">
                <input type="file" accept={CONTENT_UPLOAD.imageTypes.join(",")} disabled={e.busy} onChange={(ev) => { e.photo(ev.target.files); ev.target.value = ""; }} />
                {e.current?.photo ? "تعویض عکس" : "گذاشتن عکس"}
              </label>
              {e.current?.photo && <button type="button" className="md-del" onClick={e.clearPhoto}>حذف عکس</button>}
            </div>
          )}
          <small>عمودی ۴:۵، صورت در وسط؛ JPG، PNG یا WEBP تا ۸ مگابایت.</small>
        </div>

        <div className="ce-fields">
          <label className="f">نام و نام خانوادگی<input className="input" maxLength={COACH_LIMITS.name} value={d.name} onChange={(ev) => e.set({ name: ev.target.value })} /></label>
          <label className="f">عنوان کوتاه<input className="input" maxLength={COACH_LIMITS.title} value={d.title} onChange={(ev) => e.set({ title: ev.target.value })} placeholder="مثلاً: مربی پدل · سطح ۲ فدراسیون" /></label>
          <div className="ce-two">
            <label className="f">سطح
              <select className="input" value={d.level} onChange={(ev) => e.set({ level: ev.target.value as typeof d.level })}>
                {COACH_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
            <label className="f">جنسیت <small className="muted">برای فیلتر «مربی خانم»</small>
              <select className="input" value={d.gender ?? ""} onChange={(ev) => e.set({ gender: (ev.target.value || undefined) as typeof d.gender })}>
                <option value="">نمایش داده نشود</option>
                <option value="female">خانم</option>
                <option value="male">آقا</option>
              </select>
            </label>
          </div>
          <div className="ce-field">
            <span>بازی‌هایی که تدریس می‌کند</span>
            <div className="cl-chips">
              {COACH_GAMES.map((g) => (
                <button key={g.id} type="button" aria-pressed={d.games.includes(g.id)} className={clsx(d.games.includes(g.id) && "on")} onClick={() => e.toggleGame(g.id)}>{g.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ce-three">
        <label className="f">سابقه (سال)<input className="input ltr" inputMode="numeric" maxLength={2} value={d.years} onChange={(ev) => e.set({ years: ev.target.value })} /></label>
        <label className="f">جلسه‌ی خصوصی، هر ساعت<span className="ce-money"><input className="input ltr" inputMode="numeric" maxLength={12} value={d.price} onChange={(ev) => e.set({ price: ev.target.value })} /><small>تومان</small></span></label>
        <label className="f">کلاس گروهی، هر نفر <small className="muted">اختیاری</small><span className="ce-money"><input className="input ltr" inputMode="numeric" maxLength={12} value={d.groupPrice} onChange={(ev) => e.set({ groupPrice: ev.target.value })} /><small>تومان</small></span></label>
      </div>

      <label className="f">درباره‌ی مربی <small className="muted">{fa((d.bio ?? "").length)} از {fa(COACH_LIMITS.bio)}</small>
        <textarea className="input" rows={4} maxLength={COACH_LIMITS.bio} value={d.bio ?? ""} onChange={(ev) => e.set({ bio: ev.target.value })} placeholder="سابقه، روش تدریس، برای چه کسانی مناسب است." />
      </label>

      <div className="ce-two">
        <div className="ce-field">
          <span>برچسب‌ها <small className="muted">حداکثر {fa(COACH_LIMITS.tags)}؛ مثل «مبتدی»، «بانوان»، «کودکان»</small></span>
          <div className="ce-chips">
            {d.tags.map((t) => <span key={t}>{t}<button type="button" onClick={() => e.removeTag(t)} aria-label={`حذف ${t}`}>✕</button></span>)}
          </div>
          {d.tags.length < COACH_LIMITS.tags && (
            <div className="ce-add">
              <input className="input" maxLength={COACH_LIMITS.tag} value={e.tagText} onChange={(ev) => e.setTagText(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); e.addTag(); } }} placeholder="برچسب تازه" aria-label="برچسب تازه" />
              <button type="button" className="btn ghost sm" onClick={e.addTag}>افزودن</button>
            </div>
          )}
        </div>
        <div className="ce-field">
          <span>مدرک‌ها <small className="muted">اختیاری</small></span>
          <ul className="ce-certs">
            {(d.certificates ?? []).map((c, i) => <li key={i}>{c}<button type="button" onClick={() => e.removeCert(i)} aria-label={`حذف ${c}`}>✕</button></li>)}
          </ul>
          {(d.certificates ?? []).length < COACH_LIMITS.certificates && (
            <div className="ce-add">
              <input className="input" maxLength={COACH_LIMITS.certificate} value={e.certText} onChange={(ev) => e.setCertText(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); e.addCert(); } }} placeholder="مثلاً: مربیگری سطح ۲ فدراسیون" aria-label="مدرک تازه" />
              <button type="button" className="btn ghost sm" onClick={e.addCert}>افزودن</button>
            </div>
          )}
        </div>
      </div>

      <div className="ce-field">
        <span>ساعت‌های تدریس در هفته <small className="muted">در پروفایل به بازیکن نشان داده می‌شود</small></span>
        <ul className="ce-slots">
          {(d.schedule ?? []).map((s, i) => (
            <li key={i}>
              <select className="input" value={s.day} onChange={(ev) => e.setSlot(i, { day: Number(ev.target.value) })} aria-label="روز">
                {WEEK_DAYS.map((w, j) => <option key={j} value={j}>{w}</option>)}
              </select>
              <select className="input" value={s.from} onChange={(ev) => e.setSlot(i, { from: Number(ev.target.value) })} aria-label="از ساعت">
                {HOURS.map((h) => <option key={h} value={h}>{hm(h)}</option>)}
              </select>
              <span>تا</span>
              <select className="input" value={s.to} onChange={(ev) => e.setSlot(i, { to: Number(ev.target.value) })} aria-label="تا ساعت">
                {HOURS.map((h) => <option key={h + 1} value={h + 1}>{hm(h + 1)}</option>)}
              </select>
              <button type="button" className="st-del" onClick={() => e.removeSlot(i)} aria-label="حذف ردیف">✕</button>
            </li>
          ))}
        </ul>
        {(d.schedule ?? []).length < COACH_LIMITS.schedule && <button type="button" className="btn ghost sm ce-addslot" onClick={e.addSlot}>افزودن روز</button>}
      </div>

      {!isNew && e.current && (e.current.rating || e.current.students) ? (
        <p className="ad-none">امتیاز {e.current.rating ? fa(e.current.rating) : "—"} از {fa(e.current.reviews ?? 0)} نظر و {fa(e.current.students ?? 0)} شاگرد از نظرها و رزروهای بازیکن‌ها حساب می‌شود و دستی وارد نمی‌شود.</p>
      ) : null}

      <div className="ce-bar">
        {(e.error || e.problem) && <p className="ad-err" role="alert">{e.error || e.problem}</p>}
        {e.done && <p className="ad-ok" role="status">{e.done}</p>}
        {!isNew && !e.confirmDelete && <button type="button" className="btn ghost sm md-del" onClick={e.askDelete}>حذف مربی</button>}
        {e.confirmDelete && (
          <span className="ce-confirm">
            {d.name} از سایت و پنل حذف شود؟
            <button type="button" className="btn sm danger" disabled={e.busy} onClick={e.remove}>حذف</button>
            <button type="button" className="btn ghost sm" onClick={e.cancelDelete}>انصراف</button>
          </span>
        )}
        <Button3D type="submit" disabled={e.busy || !!e.problem}>{e.busy ? "…" : isNew ? "افزودن مربی" : "ذخیره‌ی تغییرات"}</Button3D>
      </div>
      {d.price && !e.problem && <p className="ad-none">در سایت: «از {toman(Number(d.price.replace(/\D/g, "")) || 0)} هر ساعت جلسه‌ی خصوصی»</p>}
    </form>
  );
}

export function CoachesAdminView() {
  const e = useCoachEditor();
  return (
    <div className="ad">
      <PageHead title="مربیان" sub="هر چه اینجا وارد شود در صفحه‌ی «معرفی مربیان» و نوار مربیان صفحه‌ی اصلی دیده می‌شود." />
      <div className={clsx("ce-layout", e.editing && "has-open")}>
        <List e={e} />
        <section className="ce-pane">
          {e.editing ? <Form e={e} /> : (
            <div className="md-empty big">یک مربی را برای ویرایش انتخاب کنید یا «افزودن مربی» را بزنید.</div>
          )}
        </section>
      </div>
    </div>
  );
}
