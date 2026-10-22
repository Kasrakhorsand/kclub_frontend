"use client";
/**
 * Player reviews on the home page: the overall score beside the title, and
 * the reviews as cards gliding past in a slow endless row (two rows, opposite
 * directions, from six reviews). Pauses on hover and keyboard focus; with
 * reduced motion it becomes a row you scroll yourself. With no reviews yet,
 * development shows placeholders and production hides the section.
 * Styles: home.css ("rv2-").
 */
import clsx from "clsx";
import { SHOW_PLACEHOLDERS } from "@/config/content";
import { REVIEWS_SECTION } from "@/config/home";
import { useReviews } from "@/engine/content/useSiteContent";
import { fa } from "@/engine/format";
import type { SiteReview } from "@/engine/types";

const PLACEHOLDERS: SiteReview[] = Array.from({ length: 6 }, (_, i) => ({
  name: "نام بازیکن",
  sport: ["پدل", "تنیس ساحلی", "والیبال ساحلی"][i % 3],
  rating: 5,
  text: "جای نظر بازیکن. نظرهای واقعی بازیکن‌ها از پنل یا بک‌اند اینجا می‌آید.",
}));

const Stars = ({ rating, big }: { rating: number; big?: boolean }) => (
  <span className={clsx("rv2-stars", big && "big")} role="img" aria-label={`امتیاز ${fa(Math.round(rating * 10) / 10)} از ۵`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <i key={i} style={{ "--f": `${Math.max(0, Math.min(1, rating - i + 1)) * 100}%` } as React.CSSProperties} />
    ))}
  </span>
);

function ReviewCard({ r, ph }: { r: SiteReview; ph?: boolean }) {
  return (
    <figure className={clsx("rv2-card", ph && "ph")}>
      <span className="rv2-q" aria-hidden>”</span>
      <blockquote>{r.text}</blockquote>
      <figcaption>
        <span className="rv2-av" aria-hidden>{r.name[0]}</span>
        <span>
          <b>{r.name}</b>
          <small>{r.sport}</small>
        </span>
        <Stars rating={r.rating} />
      </figcaption>
    </figure>
  );
}

/** One endless row: the list twice, the copy hidden from screen readers. */
function Row({ items, reverse, ph }: { items: SiteReview[]; reverse?: boolean; ph?: boolean }) {
  const seconds = Math.max(30, items.length * 8);
  return (
    <div className={clsx("rv2-row", reverse && "rev")} style={{ "--dur": `${seconds}s` } as React.CSSProperties}>
      <div className="rv2-track">
        {items.map((r, i) => <ReviewCard key={i} r={r} ph={ph} />)}
        <div className="rv2-copy" aria-hidden>
          {items.map((r, i) => <ReviewCard key={i} r={r} ph={ph} />)}
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  const { reviews, average, count } = useReviews();
  const ph = !reviews.length;
  if (ph && !SHOW_PLACEHOLDERS) return null;
  const list = ph ? PLACEHOLDERS : reviews;
  const half = Math.ceil(list.length / 2);
  const twoRows = list.length >= 6;

  return (
    <section className="reviews rv2" aria-labelledby="reviews-title" data-reveal>
      <div className="wrap">
        <div className="sechd row-hd">
          <div>
            <span className="lat eyebrow">{REVIEWS_SECTION.eyebrow}</span>
            <h2 id="reviews-title">{REVIEWS_SECTION.title}</h2>
          </div>
          {!ph && (
            <div className="rv2-score">
              <b>{fa(Math.round(average * 10) / 10)}</b>
              <span>
                <Stars rating={average} big />
                <small>از {fa(count)} نظر بازیکن‌ها</small>
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="rv2-rows">
        {twoRows ? (
          <>
            <Row items={list.slice(0, half)} ph={ph} />
            <Row items={list.slice(half)} reverse ph={ph} />
          </>
        ) : (
          <Row items={list} ph={ph} />
        )}
      </div>
    </section>
  );
}
