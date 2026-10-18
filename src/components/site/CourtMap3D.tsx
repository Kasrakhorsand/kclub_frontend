"use client";
import clsx from "clsx";
import type { Court } from "@/lib/types";
import { fa, hm, jFull } from "@/lib/format";

export type CourtState = "free" | "sel" | "taken";

/** Top-down court drawing used as the floor of each 3D court. */
function CourtFloor({ c, state }: { c: Court; state: CourtState }) {
  const beach = c.sport === "beach";
  const fill = beach ? "#D7BD86" : c.turf === "black" ? "#111214" : "#1B4F9C";
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

const ORDER = (courts: Court[]) => [...courts].sort((a, b) => b.n - a.n); // court 1 on the right (RTL)

/** Parallel courts seen at an angle from above. Padel courts are indoors (hall), so no roof is drawn. */
export function CourtMap3D({
  courts,
  date,
  hour,
  stateOf,
  priceOf,
  onPick,
}: {
  courts: Court[];
  date: string;
  hour: number;
  stateOf: (c: Court) => CourtState;
  priceOf: (c: Court) => number;
  onPick: (c: Court) => void;
}) {
  const list = ORDER(courts);
  const free = courts.filter((c) => stateOf(c) !== "taken").length;
  const padel = courts[0]?.sport === "padel";
  return (
    <div className="card planpick" id="courtpick">
      <div className="ph3">
        <h3>زمین را روی نقشه انتخاب کنید</h3>
        <span className="small muted">
          {jFull(date)}، ساعت {hm(hour)} · {fa(free)} زمین خالی
        </span>
      </div>
      <div className="siteplan sp3">
        <div className="splot rise" style={{ ["--ar" as string]: "400/240", ["--mw" as string]: "620px" }}>
          {list.map((c, i) => {
            const st = stateOf(c);
            const label = st === "taken" ? "رزرو شده" : st === "sel" ? "✓ در سبد شما" : `${fa(priceOf(c) / 1000)} هزار تومان`;
            return (
              <button
                key={c.id}
                className={clsx("cp cp3", st, padel ? "pdl" : "bch")}
                style={{ ["--i" as string]: i, left: `${(i * 140) / 4}%`, top: 0, width: "30%", height: "100%" }}
                disabled={st === "taken" || !c.active}
                onClick={() => onPick(c)}
                aria-label={`${c.name}، ${label}`}
              >
                <span className="fl3">
                  <CourtFloor c={c} state={st} />
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
                  <b>{c.name}</b>
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
        {padel && (
          <>
            <span><i style={{ background: "#1B4F9C" }} />چمن آبی</span>
            <span><i style={{ background: "#111214", border: "1px solid #444" }} />چمن مشکی</span>
          </>
        )}
      </div>
    </div>
  );
}
