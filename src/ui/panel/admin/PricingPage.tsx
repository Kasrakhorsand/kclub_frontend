"use client";
/** Admin › Pricing (/panel/pricing): session prices per time band and equipment rental prices. */
import { useState } from "react";
import { fa, hm, toLatinDigits } from "@/engine/format";
import { rentalPriceOf, usePricing, useRentalPrices } from "@/engine/pricing";
import { PRICING, RENTALS, SPORTS } from "@/engine/venue";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Equipment rental prices; saved prices apply to new checkouts straight away. */
function RentalPricing() {
  const current = useRentalPrices();
  const setRentalPrices = usePricing((st) => st.setRentalPrices);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(RENTALS.map((r) => [r.id, String(rentalPriceOf(r.id, current))])),
  );
  const save = () => {
    const parsed = Object.fromEntries(Object.entries(draft).map(([id, v]) => [id, Number(toLatinDigits(v).replace(/[^0-9]/g, ""))]));
    if (Object.values(parsed).some((v) => !Number.isFinite(v) || v < 0)) return toast("قیمت معتبر وارد کنید");
    setRentalPrices(parsed);
    toast("قیمت اجاره‌ها ذخیره شد");
  };
  if (!RENTALS.length) return null;
  return (
    <div className="card stack">
      <div className="row between">
        <h3>اجاره‌ی تجهیزات</h3>
        <button className="btn sm" onClick={save}>ذخیره</button>
      </div>
      <p className="small muted">قیمت هر عدد برای یک سانس؛ بازیکن هنگام پرداخت تعدادش را انتخاب می‌کند.</p>
      {RENTALS.map((rental) => (
        <div className="row" key={rental.id}>
          <span className="small" style={{ minWidth: 110 }}>
            {rental.name}
            <br />
            <span className="xs muted">{rental.games.map((g) => gameName(g)).join("، ")} · حداکثر {fa(rental.maxPerBooking)}</span>
          </span>
          <input
            className="input ltr"
            inputMode="numeric"
            value={draft[rental.id]}
            onChange={(e) => setDraft({ ...draft, [rental.id]: e.target.value })}
            style={{ maxWidth: 180 }}
            aria-label={`قیمت ${rental.name}`}
          />
          <span className="small muted">تومان</span>
        </div>
      ))}
    </div>
  );
}

/** Display name of a game id across all sports. */
const gameName = (id: string) => SPORTS.flatMap((s) => s.games).find((g) => g.id === id)?.name ?? id;

/** Price per session for each time band, per sport, plus equipment rental prices. */
export function PricingView() {
  return (
    <>
      <PageHead
        title="قیمت‌گذاری"
        sub="بازه‌های زمانی و قیمت هر سانس به تفکیک رشته، و قیمت اجاره‌ی تجهیزات"
        action={<button className="btn" onClick={() => toast("قیمت‌ها ذخیره شد")}>ذخیره تغییرات</button>}
      />
      <div className="grid cols2e">
        {SPORTS.map((sport) => (
          <div className="card stack" key={sport.id}>
            <h3>{sport.name}</h3>
            {(PRICING[sport.id] ?? []).map((band) => (
              <div className="row" key={band.from}>
                <span className="small" style={{ minWidth: 110 }}>{hm(band.from)} تا {hm(band.to)}</span>
                <input className="input ltr" defaultValue={band.price} style={{ maxWidth: 180 }} />
                <span className="small muted">تومان</span>
              </div>
            ))}
          </div>
        ))}
        <RentalPricing />
      </div>
    </>
  );
}
