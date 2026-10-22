"use client";
/**
 * Admin + front desk › Gallery & media (/panel/media). Tabs for gallery
 * albums and the home page's photos and videos (coach profiles have their own page); a front desk
 * account sees only the tabs and buttons the admin allowed. Styles: common.css ("md-").
 */
import { useState } from "react";
import clsx from "clsx";
import { MEDIA_SLOTS } from "@/config/home";
import { CONTENT_UPLOAD } from "@/engine/config";
import { useAlbums } from "@/engine/content/useAlbums";
import { useCan } from "@/engine/content/permissions";
import { useSiteMediaEditor } from "@/engine/content/useSiteContent";
import { fa, jDate } from "@/engine/format";
import type { MediaItem } from "@/engine/types";
import { PageHead } from "@/ui/panel/shell/PageHead";

type Tab = "albums" | "home";

/** A styled file picker; `onFiles` gets the FileList. */
function Pick({ label, accept, multiple, disabled, onFiles }: { label: string; accept: string; multiple?: boolean; disabled?: boolean; onFiles: (f: FileList | null) => void }) {
  return (
    <label className={clsx("md-pick", disabled && "off")}>
      <input type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      {label}
    </label>
  );
}

const IMG = CONTENT_UPLOAD.imageTypes.join(",");

function Albums() {
  const a = useAlbums();
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const album = a.album;
  return (
    <div className={clsx("md-albums", album && "has-open")}>
      <aside className="md-album-list">
        {a.canEditAlbums && (
          <form className="md-new" onSubmit={(e) => { e.preventDefault(); a.create(); }}>
            <input className="input" maxLength={60} value={a.newTitle} onChange={(e) => a.setNewTitle(e.target.value)} placeholder="نام آلبوم تازه، مثلاً «مسابقات پاییز»" aria-label="نام آلبوم" />
            <button type="submit" className="btn sm" disabled={a.busy || a.newTitle.trim().length < 2}>ساخت</button>
          </form>
        )}
        {a.loading && <p className="ad-none">در حال بارگذاری…</p>}
        {!a.loading && !a.albums.length && <p className="md-empty">{a.canEditAlbums ? "هنوز آلبومی نساخته‌اید." : "آلبومی نیست؛ ساخت آلبوم با مدیر است."}</p>}
        <ul>
          {a.albums.map((x) => {
            const cover = x.items.find((i) => i.id === x.coverId) ?? x.items[0];
            return (
              <li key={x.id}>
                <button type="button" className={clsx("md-album", album?.id === x.id && "on")} onClick={() => a.open(x.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- uploaded cover */}
                  {cover ? <img src={cover.url} alt="" /> : <span className="md-album-ph" aria-hidden />}
                  <span>
                    <b>{x.title}</b>
                    <small>{fa(x.items.length)} عکس · {x.published ? "منتشرشده" : "پیش‌نویس"}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="md-album-pane">
        {!album ? (
          <div className="md-empty big">یک آلبوم را انتخاب کنید{a.canEditAlbums ? " یا آلبوم تازه بسازید" : ""}.</div>
        ) : (
          <>
            <header className="md-album-head">
              <button type="button" className="cu-back" onClick={() => a.open(null)} aria-label="بازگشت">→</button>
              {a.canEditAlbums ? (
                <input className="input md-title" defaultValue={album.title} key={album.id} maxLength={60} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== album.title && a.rename(e.target.value)} aria-label="نام آلبوم" />
              ) : <h3>{album.title}</h3>}
              <span className={clsx("md-state", album.published ? "pub" : "draft")}>{album.published ? "در سایت دیده می‌شود" : "پیش‌نویس"}</span>
              {a.canEditAlbums && (
                <button type="button" className="btn sm" disabled={a.busy || (!album.published && !album.items.length)} onClick={() => a.setPublished(!album.published)}>
                  {album.published ? "پنهان کردن" : "انتشار در سایت"}
                </button>
              )}
            </header>
            <p className="ad-none">آخرین تغییر {jDate(album.updatedAt.slice(0, 10))}. {!album.published && !album.items.length ? "برای انتشار حداقل یک عکس بگذارید." : ""}</p>

            {a.canEditPhotos && (
              <div
                className="md-drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); a.addPhotos(e.dataTransfer.files); }}
              >
                <Pick label={a.busy ? "در حال بارگذاری…" : "افزودن عکس"} accept={IMG} multiple disabled={a.busy} onFiles={a.addPhotos} />
                <span>یا عکس‌ها را اینجا بکشید · JPG، PNG یا WEBP تا ۸ مگابایت · هر بار تا {fa(CONTENT_UPLOAD.maxBatch)} عکس</span>
              </div>
            )}
            {a.error && <p className="ad-err" role="alert">{a.error}</p>}

            {album.items.length ? (
              <ul className="md-photos">
                {album.items.map((item, i) => (
                  <li key={item.id} className={clsx(album.coverId === item.id && "cover")}>
                    <button type="button" className="md-thumb" onClick={() => setLightbox(item)} aria-label={`بزرگ کردن ${item.caption ?? item.alt ?? ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded photo */}
                      <img src={item.url} alt={item.alt ?? ""} />
                      {album.coverId === item.id && <em>کاور</em>}
                    </button>
                    {a.canEditPhotos ? (
                      <>
                        <input className="input md-cap" defaultValue={item.caption ?? ""} maxLength={120} placeholder="توضیح عکس" aria-label="توضیح عکس" onBlur={(e) => e.target.value !== (item.caption ?? "") && a.caption(item.id, e.target.value)} />
                        <div className="md-tools">
                          <button type="button" disabled={i === 0 || a.busy} onClick={() => a.move(item.id, -1)} aria-label="جلوتر">→</button>
                          <button type="button" disabled={i === album.items.length - 1 || a.busy} onClick={() => a.move(item.id, 1)} aria-label="عقب‌تر">←</button>
                          {a.canEditAlbums && album.coverId !== item.id && <button type="button" onClick={() => a.setCover(item.id)}>کاور</button>}
                          <button type="button" className="md-del" onClick={() => a.removePhoto(item.id)}>حذف</button>
                        </div>
                      </>
                    ) : item.caption ? <small>{item.caption}</small> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="md-empty">این آلبوم هنوز عکسی ندارد.</p>}

            {a.canEditAlbums && (
              <div className="md-danger">
                {!a.confirmDelete ? (
                  <button type="button" className="btn ghost sm md-del" onClick={a.askDelete}>حذف آلبوم</button>
                ) : (
                  <>
                    <span>«{album.title}» با {fa(album.items.length)} عکسش حذف شود؟</span>
                    <button type="button" className="btn sm danger" disabled={a.busy} onClick={a.remove}>حذف آلبوم</button>
                    <button type="button" className="btn ghost sm" onClick={a.cancelDelete}>انصراف</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {lightbox && (
        <div className="su-lightbox" role="dialog" aria-label={lightbox.caption ?? "عکس"} onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size photo */}
          <img src={lightbox.url} alt={lightbox.alt ?? ""} />
          <button type="button" aria-label="بستن">✕</button>
        </div>
      )}
    </div>
  );
}

function HomeMedia() {
  const m = useSiteMediaEditor();
  const groups = [...new Set(MEDIA_SLOTS.map((s) => s.group))];
  return (
    <div className="md-home">
      {groups.map((g) => (
        <section key={g} className="md-home-group">
          <h4>{g}</h4>
          <ul>
            {MEDIA_SLOTS.filter((s) => s.group === g).map((slot) => {
              const replaced = m.replaced[slot.id];
              const src = m.src(slot.id, slot.fallback);
              return (
                <li key={slot.id} className={clsx("md-slot", slot.kind)}>
                  <div className="md-slot-media">
                    {slot.kind === "video" ? (
                      <video src={src} muted loop playsInline preload="metadata" controls />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- home media preview
                      <img src={src} alt={slot.label} />
                    )}
                    <em className={replaced ? "new" : ""}>{replaced ? "جایگزین‌شده" : "پیش‌فرض سایت"}</em>
                  </div>
                  <b>{slot.label}</b>
                  <small>{slot.hint}</small>
                  <div className="md-tools">
                    <Pick
                      label={m.busySlot === slot.id ? "در حال بارگذاری…" : "تعویض"}
                      accept={slot.kind === "video" ? CONTENT_UPLOAD.videoTypes.join(",") : IMG}
                      disabled={m.busySlot === slot.id}
                      onFiles={(f) => m.replace(slot.id, slot.kind, f)}
                    />
                    {replaced && <button type="button" disabled={m.busySlot === slot.id} onClick={() => m.reset(slot.id)}>برگرداندن پیش‌فرض</button>}
                  </div>
                  {m.error?.slot === slot.id && <p className="ad-err">{m.error.text}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MediaView() {
  const { can, isAdmin } = useCan();
  const any = can("gallery") || can("albums") || can("home");
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "albums", label: "آلبوم‌های گالری", show: can("gallery") || can("albums") },
    { id: "home", label: "عکس و ویدیوی صفحه‌ی اصلی", show: can("home") },
  ];
  const visible = tabs.filter((t) => t.show);
  const [tab, setTab] = useState<Tab | null>(null);
  const current = visible.find((t) => t.id === tab)?.id ?? visible[0]?.id;

  if (!any)
    return (
      <div className="ad">
        <PageHead title="گالری و رسانه" />
        <p className="md-empty big">مدیر هنوز دسترسی ویرایش محتوای سایت را به شما نداده است.</p>
      </div>
    );

  return (
    <div className="ad md">
      <PageHead title="گالری و رسانه" sub={isAdmin ? "دسترسی منشی‌ها به این بخش را در «کارکنان و دسترسی‌ها» تعیین کنید." : "فقط بخش‌هایی را می‌بینید که مدیر اجازه داده است."} />
      <div className="ad-seg md-tabs" role="tablist">
        {visible.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={current === t.id} className={clsx(current === t.id && "on")} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {current === "albums" && <Albums />}
      {current === "home" && <HomeMedia />}
    </div>
  );
}
