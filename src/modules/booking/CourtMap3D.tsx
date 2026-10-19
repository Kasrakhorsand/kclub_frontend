"use client";
import clsx from "clsx";
import type { Court, CourtLayout } from "@/modules/core/types";
import { sportById } from "@/modules/core/venue";
import { fa, hm, jFull } from "@/modules/core/format";

/** free = bookable, sel = in the cart, taken = booked by someone else. */
export type CourtState = "free" | "sel" | "taken";

/** Top-down court drawing used as the floor of each 3D court. */
function CourtFloor({ court, layout, state }: { court: Court; layout: CourtLayout; state: CourtState }) {
  const beach = layout === "sand";
  const fill = court.floor;
  const edge = state === "sel" ? "#E3C994" : state === "free" ? "#C9A45C" : "#555";
  const W = 120, H = 240;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <rect width={W} height={H} fill={fill} />
      <line x1="0" y1="120" x2="120" y2="120" stroke={beach ? "#0D0D0E" : "#fff"} strokeWidth={beach ? 2 : 3} />
      {beach ? (
        <rect x="12" y="16" width="96" height="208" fill="none" stroke="#14263C" strokeWidth="2.5" />
      ) : (
        <>
          <line x1="0" y1="44" x2="120" y2="44" stroke="#fff" />
          <line x1="0" y1="196" x2="120" y2="196" stroke="#fff" />
          <line x1="60" y1="44" x2="60" y2="196" stroke="#fff" />
        </>
      )}
      {state === "sel" && <rect width={W} height={H} fill="rgba(201,164,92,.35)" />}
      <rect x="1.5" y="1.5" width={W - 3} height={H - 3} fill="none" stroke={edge} strokeWidth={state === "taken" ? 1 : 3} />
    </svg>
  );
}

/** Highest number first, so court 1 ends up on the right in RTL. */
const rightToLeft = (courts: Court[]) => [...courts].sort((a, b) => b.n - a.n);

type CourtMap3DProps = {
  courts: Court[];
  date: string;
  hour: number;
  stateOf: (court: Court) => CourtState;
  priceOf: (court: Court) => number;
  onPick: (court: Court) => void;
};

/** Parallel courts seen at an angle from above. Padel courts are indoors (hall), so no roof is drawn. */
export function CourtMap3D({ courts, date, hour, stateOf, priceOf, onPick }: CourtMap3DProps) {
  const ordered = rightToLeft(courts);
  const freeCount = courts.filter((c) => stateOf(c) !== "taken").length;
  const sport = courts[0] ? sportById(courts[0].sport) : undefined;
  const layout: CourtLayout = sport?.layout ?? "padel";
  // Walled courts get glass walls on the map; sand courts get net posts.
  const padel = layout === "padel";
  const floors = [...new Map(courts.map((c) => [c.floor, c.surface])).entries()];
  return (
    <div className="card planpick" id="courtpick">
      <div className="ph3">
        <h3>زمین را روی نقشه انتخاب کنید</h3>
        <span className="small muted">
          {jFull(date)}، ساعت {hm(hour)} · {fa(freeCount)} زمین خالی
        </span>
      </div>
      <div className="siteplan sp3">
        <div className="splot rise" style={{ ["--ar" as string]: "400/240", ["--mw" as string]: "620px" }}>
          {ordered.map((court, i) => {
            const state = stateOf(court);
            const label = state === "taken" ? "رزرو شده" : state === "sel" ? "✓ در سبد شما" : `${fa(priceOf(court) / 1000)} هزار تومان`;
            return (
              <button
                key={court.id}
                className={clsx("cp cp3", state, padel ? "pdl" : "bch")}
                // Three 30%-wide courts, 35% apart, across the plot.
                style={{ ["--i" as string]: i, left: `${i * 35}%`, top: 0, width: "30%", height: "100%" }}
                disabled={state === "taken" || !court.active}
                onClick={() => onPick(court)}
                aria-label={`${court.name}، ${label}`}
              >
                <span className="fl3">
                  <CourtFloor court={court} layout={layout} state={state} />
                </span>
                <span className={clsx("net3", !padel && "hi")} />
                {padel ? (
                  <>
                    <span className="w3 wn" />
                    <span className="w3 ws" />
                  </>
                ) : (
                  <>
                    <span className="post3 pa" />
                    <span className="post3 pb" />
                  </>
                )}
                <span className="lb lb3">
                  <b>{court.name}</b>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p3legend">
        <span><i style={{ border: "2px solid var(--gold)" }} />خالی، برای انتخاب بزنید</span>
        <span><i style={{ background: "var(--gold)" }} />در سبد شما</span>
        <span><i style={{ background: "#555", opacity: 0.5 }} />رزرو شده</span>
        {floors.length > 1 &&
          floors.map(([color, surface]) => (
            <span key={color}><i style={{ background: color, border: "1px solid #444" }} />{surface}</span>
          ))}
      </div>
    </div>
  );
}
