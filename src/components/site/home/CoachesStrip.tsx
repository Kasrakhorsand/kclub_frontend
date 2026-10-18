/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { COACHES } from "@/lib/mock";
import { fa } from "@/lib/format";
import { CoachPortrait } from "../CoachPortrait";

/** How many coaches to feature on the home page. */
const FEATURED = 3;

/** A few padel coaches with a link to the full coaches page. */
export function CoachesStrip() {
  return (
    <section className="coachrow" aria-labelledby="coachrow-title" data-reveal>
      <div className="wrap">
        <div className="sechd row-hd">
          <div>
            <span className="lat eyebrow">Coaches</span>
            <h2 id="coachrow-title">با مربی‌های کی کلاب بازی را یاد بگیرید</h2>
          </div>
          <Link className="btn ghost" href="/coaches">همه‌ی مربیان</Link>
        </div>
        <div className="crg">
          {COACHES.slice(0, FEATURED).map((coach) => (
            <Link key={coach.id} href="/coaches" className="crc">
              <span className="crp">{coach.photo ? <img src={coach.photo} alt={coach.name} /> : <CoachPortrait name={coach.name} />}</span>
              <span className="crb">
                <b>{coach.name}</b>
                <span className="small muted">{coach.title}</span>
                <span className="crr">★ {fa(coach.rating)} · {fa(coach.years)} سال تجربه</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
