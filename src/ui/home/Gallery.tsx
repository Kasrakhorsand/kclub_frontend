/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { GALLERY, SHOW_PLACEHOLDERS } from "@/config/content";
import { GALLERY_SECTION } from "@/config/home";

/**
 * Photo grid of the club. Photos are listed in `lib/content.ts`; entries
 * without `src` show as placeholders in development and are dropped in production.
 */
export function Gallery() {
  const photos = SHOW_PLACEHOLDERS ? GALLERY : GALLERY.filter((p) => p.src);
  if (!photos.length) return null;

  return (
    <section className="gallery" aria-labelledby="gallery-title" data-reveal>
      <div className="wrap">
        <div className="sechd">
          <span className="lat eyebrow">{GALLERY_SECTION.eyebrow}</span>
          <h2 id="gallery-title">{GALLERY_SECTION.title}</h2>
        </div>
        <div className="glg">
          {photos.map((photo) => (
            <figure key={photo.caption} className={clsx("glc", photo.wide && "wide", !photo.src && "ph")}>
              {photo.src ? (
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              ) : (
                <span className="glph" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M21 16l-5-5-8 8" />
                  </svg>
                  جای عکس · config/content.ts
                </span>
              )}
              <figcaption>{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
