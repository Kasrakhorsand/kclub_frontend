import { SPORTS, bookingHref, sportTitle } from "@/engine/venue";
import type { PriceSheet } from "@/engine/types";
import { PRICING_SECTION } from "@/config/home";
import { fa, hm } from "@/engine/format";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import type { Icon3DName } from "@/ui/kit/icons3d";

/** Price in thousands of toman, e.g. "۵۰۰". */
const thousands = (toman: number) => fa(toman / 1000);

/** Per-session prices for every sport in the venue config, by time band. */
export function Pricing({ pricing }: { pricing: PriceSheet }) {
  return (
    <section className="prices" aria-labelledby="prices-title" data-reveal>
      <div className="wrap">
        <div className="sechd">
          <span className="lat eyebrow">{PRICING_SECTION.eyebrow}</span>
          <h2 id="prices-title">{PRICING_SECTION.title}</h2>
          <p className="muted">{PRICING_SECTION.text}</p>
        </div>
        <div className="prg">
          {SPORTS.map((sport) => {
            const bands = pricing.bands[sport.id] ?? [];
            if (!bands.length) return null;
            const from = Math.min(...bands.map((b) => b.price));
            return (
              <article className="prc" key={sport.id}>
                <header>
                  <Icon3D name={sport.icon as Icon3DName} />
                  <span>
                    <span className="lat">{sport.latin}</span>
                    <h3>{sportTitle(sport)}</h3>
                  </span>
                </header>
                <p className="prfrom">
                  از <b>{thousands(from)}</b> هزار تومان
                </p>
                <ul>
                  {bands.map((band) => (
                    <li key={band.from}>
                      <span>{hm(band.from)} تا {hm(band.to)}</span>
                      <b>{thousands(band.price)} هزار</b>
                    </li>
                  ))}
                </ul>
                <p className="xs muted">{sport.priceNote}</p>
                <Button3D href={bookingHref(sport.id)} block>دیدن سانس‌ها</Button3D>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
