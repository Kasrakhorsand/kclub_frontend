import { PRICING } from "@/lib/mock";
import { fa, hm } from "@/lib/format";
import { Button3D } from "../../ui/Buttons";
import { Icon3D } from "../../ui/Icon3D";
import type { Icon3DName } from "../../ui/icons3d";

const SPORTS: { key: "padel" | "beach"; icon: Icon3DName; title: string; latin: string; note: string; href: string }[] = [
  { key: "padel", icon: "racket", title: "پدل", latin: "Padel", note: "هر سانس یک ساعت · تا ۴ بازیکن", href: "/book/padel" },
  { key: "beach", icon: "court", title: "تنیس و والیبال ساحلی", latin: "Beach", note: "هر سانس یک ساعت · زمین ماسه‌ای", href: "/book/beach" },
];

/** Price in thousands of toman, e.g. "۵۰۰". */
const thousands = (toman: number) => fa(toman / 1000);

/** Per-session prices by sport and time band, from the same table the booking flow uses. */
export function Pricing() {
  return (
    <section className="prices" aria-labelledby="prices-title" data-reveal>
      <div className="wrap">
        <div className="sechd">
          <span className="lat eyebrow">Pricing</span>
          <h2 id="prices-title">قیمت هر سانس</h2>
          <p className="muted">صبح‌ها ارزان‌تر است. مبلغ برای کل زمین است، نه هر نفر.</p>
        </div>
        <div className="prg">
          {SPORTS.map((sport) => {
            const bands = PRICING[sport.key];
            const from = Math.min(...bands.map((b) => b.price));
            return (
              <article className="prc" key={sport.key}>
                <header>
                  <Icon3D name={sport.icon} />
                  <span>
                    <span className="lat">{sport.latin}</span>
                    <h3>{sport.title}</h3>
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
                <p className="xs muted">{sport.note}</p>
                <Button3D href={sport.href} block>دیدن سانس‌ها</Button3D>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
