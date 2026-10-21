"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * Home page gallery: the published albums from the panel (Gallery & media),
 * one tab per album, a photo grid and a full-size viewer with next/previous.
 * Until an album is published, development shows the placeholders from
 * `config/content.ts` and production hides the section.
 */
import { useEffect, useState } from "react";
import clsx from "clsx";
import { GALLERY, SHOW_PLACEHOLDERS } from "@/config/content";
import { GALLERY_SECTION } from "@/config/home";
import { useGallery } from "@/engine/content/useSiteContent";
import { fa } from "@/engine/format";

function Placeholders() {
  const photos = GALLERY;
  return (
    <div className="glg">
      {photos.map((photo) => (
        <figure key={photo.caption} className={clsx("glc ph", photo.wide && "wide")}>
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

export function Gallery() {
  const g = useGallery();
  const [open, setOpen] = useState<number | null>(null);
  const items = g.active?.items ?? [];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      // RTL: the left arrow goes forward.
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (!g.albums.length && !SHOW_PLACEHOLDERS) return null;
  const shown = open !== null ? items[open] : null;

  return (
    <section className="gallery" id="gallery" aria-labelledby="gallery-title" data-reveal>
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
          <div className="glg">
            {items.map((photo, i) => (
              <figure key={photo.id} className={clsx("glc", i % 5 === 0 && "wide")}>
                <button type="button" className="gl-open" onClick={() => setOpen(i)} aria-label={`نمایش بزرگ ${photo.caption ?? photo.alt ?? ""}`}>
                  <img src={photo.url} alt={photo.alt ?? photo.caption ?? ""} loading="lazy" />
                </button>
                {photo.caption && <figcaption>{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>

      {shown && (
        <div className="gl-view" role="dialog" aria-label={shown.caption ?? "عکس گالری"} onClick={() => setOpen(null)}>
          <img src={shown.url} alt={shown.alt ?? shown.caption ?? ""} onClick={(e) => e.stopPropagation()} />
          {shown.caption && <p>{shown.caption}</p>}
          <span className="gl-count">{fa(open! + 1)} از {fa(items.length)}</span>
          <button type="button" className="gl-close" aria-label="بستن">✕</button>
          {items.length > 1 && (
            <>
              <button type="button" className="gl-nav prev" aria-label="عکس قبلی" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + items.length) % items.length); }}>›</button>
              <button type="button" className="gl-nav next" aria-label="عکس بعدی" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % items.length); }}>‹</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
