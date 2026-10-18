import { REVIEWS, SHOW_PLACEHOLDERS } from "@/lib/content";
import { fa } from "@/lib/format";

/** Number of empty cards shown in development while REVIEWS is empty. */
const PLACEHOLDER_CARDS = 3;

const Stars = ({ rating }: { rating: number }) => (
  <span className="rvs" aria-label={`امتیاز ${fa(rating)} از ۵`}>
    {"★★★★★".slice(0, Math.round(rating))}
    <span aria-hidden="true">{"★★★★★".slice(Math.round(rating))}</span>
  </span>
);

/**
 * Player reviews from `lib/content.ts`. With no reviews yet the section shows
 * placeholder cards in development and is hidden in production.
 */
export function Reviews() {
  if (!REVIEWS.length && !SHOW_PLACEHOLDERS) return null;

  return (
    <section className="reviews" aria-labelledby="reviews-title" data-reveal>
      <div className="wrap">
        <div className="sechd">
          <span className="lat eyebrow">Players say</span>
          <h2 id="reviews-title">از زبان بازیکن‌ها</h2>
        </div>
        <div className="rvg">
          {REVIEWS.map((review) => (
            <figure className="rvc" key={review.name + review.text.slice(0, 12)}>
              <Stars rating={review.rating} />
              <blockquote>{review.text}</blockquote>
              <figcaption>
                <b>{review.name}</b>
                <span className="xs muted">{review.sport}</span>
              </figcaption>
            </figure>
          ))}
          {!REVIEWS.length &&
            Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
              <figure className="rvc ph" key={i} aria-hidden="true">
                <span className="rvs">★★★★★</span>
                <blockquote>جای نظر بازیکن. نظرهای واقعی را در REVIEWS داخل lib/content.ts اضافه کنید.</blockquote>
                <figcaption><b>نام بازیکن</b><span className="xs muted">رشته</span></figcaption>
              </figure>
            ))}
        </div>
      </div>
    </section>
  );
}
