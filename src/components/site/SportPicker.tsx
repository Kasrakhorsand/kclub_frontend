"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import clsx from "clsx";
import { BackButton } from "../ui/Buttons";
import type { SportKind, SportStageHandle } from "../three/SportStage";

/** Delay before navigating, so the racket-hits-ball animation can finish. */
const HIT_ANIMATION_MS = 1150;

const SportStage = dynamic(() => import("../three/SportStage"), { ssr: false });

const CARDS: { kind: SportKind; href: string; lat: string; name: string; meta: string }[] = [
  { kind: "padel", href: "/book/padel", lat: "Padel", name: "پدل", meta: "۳ زمین سرپوشیده · چمن آبی و مشکی" },
  { kind: "tennis", href: "/book/beach?game=tennis", lat: "Beach Tennis", name: "تنیس ساحلی", meta: "۳ زمین ماسه‌ای" },
  { kind: "volley", href: "/book/beach?game=volley", lat: "Beach Volley", name: "والیبال ساحلی", meta: "۳ زمین ماسه‌ای" },
];

/** Three 3D sport cards; picking one plays a hit animation, then opens that sport's booking page. */
export function SportPicker() {
  const router = useRouter();
  const stages = useRef<(SportStageHandle | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (i: number) => {
    if (picked !== null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = stages.current[i];
    if (reducedMotion || !stage) return router.push(CARDS[i].href);
    setPicked(i);
    stage.hit();
    setTimeout(() => router.push(CARDS[i].href), HIT_ANIMATION_MS);
  };

  return (
    <main className="wrap">
      <div className="pghead">
        <h2>امروز چه بازی می‌کنید؟</h2>
        <BackButton href="/">بازگشت به خانه</BackButton>
      </div>
      <section className="pick3">
        {CARDS.map((card, i) => (
          <button
            key={card.kind}
            className={clsx("pk3", picked === i && "hit", picked !== null && picked !== i && "dim")}
            onClick={() => pick(i)}
            aria-label={`رزرو ${card.name}`}
          >
            <span className="stage3">
              <SportStage kind={card.kind} index={i} ref={(handle) => { stages.current[i] = handle; }} />
              <span className="floor3" />
            </span>
            <span className="tx3">
              <span className="lat">{card.lat}</span>
              <b>{card.name}</b>
              <span className="m3">{card.meta}</span>
              <span className="go3">انتخاب و دیدن سانس‌ها ←</span>
            </span>
          </button>
        ))}
      </section>
      <p className="s3note" style={{ marginBottom: 60 }}>
        تنیس ساحلی و والیبال ساحلی روی همان ۳ زمین ماسه‌ای برگزار می‌شوند.
      </p>
    </main>
  );
}
