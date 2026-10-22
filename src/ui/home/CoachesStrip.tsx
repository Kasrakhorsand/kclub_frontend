"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * Home page coaches as a slowly turning 3D ring. It pauses while hovered or
 * focused, can be dragged or turned with the arrows (and arrow keys), and
 * stands still with reduced motion. Cards facing away fade out and can't be
 * clicked. Fewer than three coaches show as a plain row. Styles: home.css ("cr3-").
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { COACHES_SECTION } from "@/config/home";
import { COACH_LEVELS } from "@/engine/content/useCoachEditor";
import { useCoaches } from "@/engine/content/useSiteContent";
import { fa } from "@/engine/format";
import type { Coach } from "@/engine/types";
import { CoachPortrait } from "@/ui/coaches/CoachPortrait";

/** Degrees per second while turning on its own. */
const SPEED = 9;
/** A ring needs this many faces to look round; fewer coaches are repeated. */
const MIN_FACES = 8;

function Card({ c, style, front, copy }: { c: Coach; style?: React.CSSProperties; front?: boolean; copy?: boolean }) {
  return (
    <Link href="/coaches" className={clsx("cr3-card", front && "front")} style={style} tabIndex={copy ? -1 : undefined} aria-hidden={copy || undefined}>
      <span className="cr3-ph">
        {c.photo ? <img src={c.photo} alt="" loading="lazy" draggable={false} /> : <CoachPortrait name={c.name} />}
        <em className="lat">{COACH_LEVELS.find((l) => l.id === c.level)?.latin}</em>
      </span>
      <span className="cr3-body">
        <b>{c.name}</b>
        <small>{c.title}</small>
        <span className="cr3-meta">{c.rating ? `★ ${fa(c.rating)} · ` : ""}{fa(c.years)} سال تجربه</span>
      </span>
    </Link>
  );
}

function Ring({ coaches }: { coaches: Coach[] }) {
  // Repeat the list until the ring has enough faces; repeats are decoration only.
  const faces = useMemo(() => {
    const times = Math.max(1, Math.ceil(MIN_FACES / coaches.length));
    return Array.from({ length: coaches.length * times }, (_, i) => ({ coach: coaches[i % coaches.length], copy: i >= coaches.length, key: `${coaches[i % coaches.length].id}-${i}` }));
  }, [coaches]);
  const n = faces.length;
  const step = 360 / n;
  const [angle, setAngle] = useState(0);
  const target = useRef<number | null>(null);
  const paused = useRef(false);
  const drag = useRef<{ x: number; start: number } | null>(null);
  /** True when the last press turned into a drag, so it isn't also a click on a card. */
  const moved = useRef(false);
  const [radius, setRadius] = useState(360);
  // Turning on its own can be stopped (WAI: auto-rotating content needs a pause control).
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  const stage = useRef<HTMLDivElement>(null);

  // Ring size from the card width so cards don't overlap.
  useEffect(() => {
    const fit = () => {
      const card = stage.current?.querySelector<HTMLElement>(".cr3-card");
      const w = card?.offsetWidth ?? 240;
      setRadius(Math.round(Math.max(w * 0.9, (w / 2 + 18) / Math.tan(Math.PI / n))));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [n]);

  // Turn on its own, or ease to the angle the arrows asked for.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setAngle((a) => {
        if (target.current !== null) {
          const diff = target.current - a;
          if (Math.abs(diff) < 0.3) {
            const done = target.current;
            target.current = null;
            return done;
          }
          return a + diff * Math.min(1, dt * 7);
        }
        if (still || !playingRef.current || paused.current || drag.current || document.hidden) return a;
        return a - SPEED * dt;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const turn = useCallback((dir: 1 | -1) => {
    setAngle((a) => {
      const snapped = Math.round(a / step) * step;
      target.current = snapped + dir * step;
      return a;
    });
  }, [step]);

  // The card closest to the front, and which coach that is.
  const frontIndex = ((Math.round(-angle / step) % n) + n) % n;
  const frontCoach = frontIndex % coaches.length;
  /** Turn the shortest way until coach `i` faces the viewer. */
  const goTo = (i: number) =>
    setAngle((a) => {
      let best = a;
      let dist = Infinity;
      faces.forEach((f, j) => {
        if (j % coaches.length !== i) return;
        const base = -j * step;
        const k = Math.round((a - base) / 360);
        const cand = base + k * 360;
        if (Math.abs(cand - a) < dist) {
          dist = Math.abs(cand - a);
          best = cand;
        }
      });
      target.current = best;
      return a;
    });

  return (
    <div
      className="cr3"
      ref={stage}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      onKeyDown={(e) => {
        // RTL: the left arrow brings the next coach forward.
        if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, start: angle };
        moved.current = false;
        target.current = null;
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 6 && !moved.current) {
          moved.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }
        if (moved.current) setAngle(drag.current.start + dx * 0.35);
      }}
      onClickCapture={(e) => {
        if (moved.current) {
          e.preventDefault();
          e.stopPropagation();
          moved.current = false;
        }
      }}
      onPointerUp={() => {
        if (!drag.current) return;
        drag.current = null;
        setAngle((a) => {
          target.current = Math.round(a / step) * step;
          return a;
        });
      }}
      onPointerCancel={() => (drag.current = null)}
      role="region"
      aria-roledescription="چرخ‌فلک"
      aria-label="مربیان"
    >
      <div className="cr3-stage" style={{ "--r": `${radius}px` } as React.CSSProperties}>
        <div className="cr3-ring" style={{ transform: `translateZ(calc(var(--r) * -1)) rotateY(${angle}deg)` }}>
          {faces.map(({ coach: c, copy, key }, i) => {
            // How far this card is turned from the viewer, -180..180.
            const rel = ((((i * step + angle) % 360) + 540) % 360) - 180;
            const facing = Math.cos((rel * Math.PI) / 180);
            return (
              <Card
                key={key}
                c={c}
                copy={copy}
                front={i === frontIndex}
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(var(--r))`,
                  opacity: Math.max(0.12, (facing + 0.35) / 1.35),
                  pointerEvents: facing > 0.6 ? "auto" : "none",
                  filter: facing > 0.85 ? "none" : `brightness(${0.55 + facing * 0.4})`,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="cr3-bar">
        <div className="cr3-ctrl" role="group" aria-label="کنترل چرخش">
          <button type="button" onClick={() => turn(1)} aria-label="مربی قبلی">
            <svg viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <button type="button" className="cr3-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "توقف چرخش" : "ادامه‌ی چرخش"} aria-pressed={!playing}>
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M9 6v12M15 6v12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M16 6v12L7 12z" className="fill" /></svg>
            )}
          </button>
          <button type="button" onClick={() => turn(-1)} aria-label="مربی بعدی">
            <svg viewBox="0 0 24 24" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        </div>
        <div className="cr3-now" aria-live="polite">
          <b>{coaches[frontCoach].name}</b>
          <span className="cr3-dots">
            {coaches.map((c, i) => (
              <button key={c.id} type="button" className={clsx(i === frontCoach && "on")} onClick={() => goTo(i)} aria-label={`نمایش ${c.name}`} aria-current={i === frontCoach} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CoachesStrip() {
  const { coaches } = useCoaches();
  if (!coaches.length) return null;
  return (
    <section className="coachrow" aria-labelledby="coachrow-title" data-reveal>
      <div className="wrap">
        <div className="sechd row-hd">
          <div>
            <span className="lat eyebrow">{COACHES_SECTION.eyebrow}</span>
            <h2 id="coachrow-title">{COACHES_SECTION.title}</h2>
          </div>
          <Link className="btn ghost more" href="/coaches">همه‌ی مربیان</Link>
        </div>
        {coaches.length >= 3 ? (
          <Ring coaches={coaches} />
        ) : (
          <div className="cr3-flat">{coaches.map((c) => <Card key={c.id} c={c} />)}</div>
        )}
      </div>
    </section>
  );
}
