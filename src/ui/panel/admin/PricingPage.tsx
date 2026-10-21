"use client";
/**
 * Admin › Pricing (/panel/pricing). Session price per time band for each
 * sport and the rental prices, edited as one draft; the save bar lists what
 * changed before saving. Styles: admin.css ("pr2-").
 */
import { faNum, hm, toman } from "@/engine/format";
import { usePriceSheet } from "@/engine/admin/usePriceSheet";
import { RENTALS, SPORTS } from "@/engine/venue";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

const gameName = (id: string) => SPORTS.flatMap((s) => s.games).find((g) => g.id === id)?.name ?? id;

/** "padel|12|24" or "rental|racket" → readable label. */
function changeLabel(key: string) {
  const [a, b, c] = key.split("|");
  if (a === "rental") return RENTALS.find((r) => r.id === b)?.name ?? b;
  return `${SPORTS.find((s) => s.id === a)?.name ?? a} · ${hm(Number(b))} تا ${hm(Number(c))}`;
}

export function PricingView() {
  const p = usePriceSheet();
  return (
    <div className="ad">
      <PageHead title="قیمت‌گذاری" sub="قیمت هر سانس یک‌ساعته به تفکیک بازه‌ی زمانی، و قیمت اجاره‌ی تجهیزات. رزروهای قبلی با قیمت قبلی می‌مانند." />
      {p.loading || !p.sheet ? (
        <p className="ad-none">در حال بارگذاری…</p>
      ) : (
        <div className="pr2-layout">
          <div className="pr2-cards">
            {SPORTS.map((sport) => (
              <section key={sport.id} className="ad-card">
                <header><h3>{sport.name}</h3><small>هر سانس</small></header>
                <ul className="pr2-bands">
                  {(p.sheet!.bands[sport.id] ?? []).map((band, i) => (
                    <li key={band.from}>
                      <span><bdi>{hm(band.from)}</bdi> تا <bdi>{hm(band.to)}</bdi></span>
                      <label>
                        <input className="input ltr" inputMode="numeric" maxLength={14} value={faNum(band.price)} onChange={(e) => p.setBand(sport.id, i, e.target.value)} aria-label={`قیمت ${sport.name} از ${band.from}`} />
                        <small>تومان</small>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {RENTALS.length > 0 && (
              <section className="ad-card">
                <header><h3>اجاره‌ی تجهیزات</h3><small>هر عدد، هر سانس</small></header>
                <ul className="pr2-bands">
                  {RENTALS.map((r) => (
                    <li key={r.id}>
                      <span>{r.name}<small>{r.games.map(gameName).join("، ")}</small></span>
                      <label>
                        <input className="input ltr" inputMode="numeric" maxLength={14} value={faNum(p.sheet!.rentals[r.id] ?? 0)} onChange={(e) => p.setRental(r.id, e.target.value)} aria-label={`قیمت ${r.name}`} />
                        <small>تومان</small>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="ad-card pr2-save">
            <h3>تغییرات</h3>
            {p.changes.length ? (
              <ul className="pr2-changes">
                {p.changes.map((ch) => (
                  <li key={ch.label}><span>{changeLabel(ch.label)}</span><small><s>{toman(ch.before)}</s> ← <b>{toman(ch.after)}</b></small></li>
                ))}
              </ul>
            ) : <p className="ad-none">{p.done ? "قیمت‌ها ذخیره شد." : "هنوز تغییری نداده‌اید."}</p>}
            {p.invalid && <p className="ad-err">هر قیمت باید بین ۱۰ هزار و ۱۰۰ میلیون تومان باشد.</p>}
            {p.error && <p className="ad-err" role="alert">{p.error}</p>}
            <Button3D disabled={!p.changes.length || p.invalid || p.busy} onClick={p.save}>{p.busy ? "…" : "ذخیره‌ی قیمت‌ها"}</Button3D>
            {p.changes.length > 0 && <button type="button" className="btn ghost sm" onClick={p.reset}>برگرداندن تغییرات</button>}
          </aside>
        </div>
      )}
    </div>
  );
}
