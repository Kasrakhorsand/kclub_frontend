"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * Home page gallery from the published albums (panel › Gallery & media).
 * Album tabs, a bento grid of the first photos (one large feature tile) with
 * a "+N more" tile, and a full-screen viewer with a filmstrip, arrow keys and
 * swipe. Until an album is published, development shows placeholders and
 * production hides the section. Styles: home.css ("gl2-", "gl-").
 */
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { GALLERY, SHOW_PLACEHOLDERS } from "@/config/content";
import { GALLERY_SECTION } from "@/config/home";
import { useGallery } from "@/engine/content/useSiteContent";
import { fa } from "@/engine/format";
import type { MediaItem } from "@/engine/types";

/** Photos shown in the grid before the "+N" tile. */
const GRID = 7;

function Placeholders() {
  return (
    <div className="gl2-grid">
      {GALLERY.slice(0, GRID).map((photo, i) => (
        <figure key={photo.caption} className={clsx("gl2-tile ph", `t${i}`)}>
          <span className="glph" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
            جای عکس · از پنل «گالری و رسانه» آلبوم بسازید
          </span>
          <figcaption>{photo.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Viewer({ items, index, setIndex, title }: { items: MediaItem[]; index: number; setIndex: (i: number | null) => void; title: string }) {
  const n = items.length;
  const go = (d: number) => setIndex((index + d + n) % n);
  const strip = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      // RTL: the left arrow goes forward.
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });
  useEffect(() => {
    strip.current?.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  const photo = items[index];
  return (
    <div className="gl-view" role="dialog" aria-modal="true" aria-label={`${title}، عکس ${fa(index + 1)} از ${fa(n)}`} onClick={() => setIndex(null)}>
      <div
        className="gl2-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          // RTL: swiping right goes forward.
          if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
        }}
      >
        <img key={photo.id} src={photo.url} alt={photo.alt ?? photo.caption ?? ""} />
      </div>
      <div className="gl2-cap" onClick={(e) => e.stopPropagation()}>
        {photo.caption && <p>{photo.caption}</p>}
        <span className="gl-count">{fa(index + 1)} از {fa(n)}</span>
      </div>
      {n > 1 && (
        <div className="gl2-strip" ref={strip} onClick={(e) => e.stopPropagation()}>
          {items.map((p, i) => (
            <button key={p.id} type="button" className={clsx(i === index && "on")} onClick={() => setIndex(i)} aria-label={`عکس ${fa(i + 1)}`} aria-current={i === index}>
              <img src={p.url} alt="" />
            </button>
          ))}
        </div>
      )}
      <button type="button" className="gl-close" aria-label="بستن">✕</button>
      {n > 1 && (
        <>
          <button type="button" className="gl-nav prev" aria-label="عکس قبلی" onClick={(e) => { e.stopPropagation(); go(-1); }}>›</button>
          <button type="button" className="gl-nav next" aria-label="عکس بعدی" onClick={(e) => { e.stopPropagation(); go(1); }}>‹</button>
        </>
      )}
    </div>
  );
}

export function Gallery() {
  const g = useGallery();
  const [open, setOpen] = useState<number | null>(null);
  if (!g.albums.length && !SHOW_PLACEHOLDERS) return null;
  const items = g.active?.items ?? [];
  const shown = items.slice(0, GRID);
  const more = items.length - shown.length;

  return (
    <section className="gallery gl2" id="gallery" aria-labelledby="gallery-title" data-reveal>
      <div className="wrap">
        <div className="sechd row-hd">
          <div>
            <span className="lat eyebrow">{GALLERY_SECTION.eyebrow}</span>
            <h2 id="gallery-title">{GALLERY_SECTION.title}</h2>
          </div>
          {g.albums.length > 1 && (
            <div className="gl-tabs" role="tablist" aria-label="آلبوم‌ها">
              {g.albums.map((a) => (
                <button key={a.id} type="button" role="tab" aria-selected={g.active?.id === a.id} className={clsx(g.active?.id === a.id && "on")} onClick={() => { g.setActive(a.id); setOpen(null); }}>
                  {a.title}<small>{fa(a.items.length)}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {!g.albums.length ? (
          <Placeholders />
        ) : (
          <div className={clsx("gl2-grid", `n${Math.min(shown.length, GRID)}`)}>
            {shown.map((photo, i) => {
              const isMore = more > 0 && i === shown.length - 1;
              return (
                <figure key={photo.id} className={clsx("gl2-tile", `t${i}`)}>
                  <button type="button" className="gl2-open" onClick={() => setOpen(i)} aria-label={isMore ? `دیدن همه‌ی ${fa(items.length)} عکس` : `نمایش بزرگ ${photo.caption ?? photo.alt ?? ""}`}>
                    <img src={photo.url} alt={photo.alt ?? photo.caption ?? ""} loading="lazy" />
                    {isMore ? (
                      <span className="gl2-more"><b>+{fa(more + 1)}</b>عکس دیگر</span>
                    ) : (
                      <span className="gl2-hover" aria-hidden>
                        {photo.caption && <span>{photo.caption}</span>}
                        <i>⤢</i>
                      </span>
                    )}
                  </button>
                </figure>
              );
            })}
          </div>
        )}
        {g.active && <p className="gl2-foot">{g.active.title} · {fa(items.length)} عکس</p>}
      </div>
      {open !== null && items.length > 0 && <Viewer items={items} index={open} setIndex={setOpen} title={g.active?.title ?? ""} />}
    </section>
  );
}
