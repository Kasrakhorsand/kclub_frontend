"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import clsx from "clsx";
import { BackButton } from "../ui/Buttons";
import type { SportKind, SportStageHandle } from "../three/SportStage";

const SportStage = dynamic(() => import("../three/SportStage"), { ssr: false });

const CARDS: { kind: SportKind; href: string; lat: string; name: string; meta: string }[] = [
  { kind: "padel", href: "/book/padel", lat: "Padel", name: "پدل", meta: "۳ زمین سرپوشیده · چمن آبی و مشکی" },
  { kind: "tennis", href: "/book/beach?game=tennis", lat: "Beach Tennis", name: "تنیس ساحلی", meta: "۳ زمین ماسه‌ای" },
  { kind: "volley", href: "/book/beach?game=volley", lat: "Beach Volley", name: "والیبال ساحلی", meta: "۳ زمین ماسه‌ای" },
];

export function SportPicker() {
  const router = useRouter();
  const stages = useRef<(SportStageHandle | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (i: number) => {
    if (picked !== null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = stages.current[i];
    if (reduce || !stage) return router.push(CARDS[i].href);
    setPicked(i);
    stage.hit();
    setTimeout(() => router.push(CARDS[i].href), 1150);
  };

  return (
    <main className="wrap">
      <div className="pghead">
        <h2>امروز چه بازی می‌کنید؟</h2>
        <BackButton href="/">بازگشت به خانه</BackButton>
      </div>
      <section className="pick3">
        {CARDS.map((c, i) => (
          <button
            key={c.kind}
            className={clsx("pk3", picked === i && "hit", picked !== null && picked !== i && "dim")}
            onClick={() => pick(i)}
            aria-label={`رزرو ${c.name}`}
          >
            <span className="stage3">
              <SportStage kind={c.kind} index={i} ref={(h) => { stages.current[i] = h; }} />
              <span className="floor3" />
            </span>
            <span className="tx3">
              <span className="lat">{c.lat}</span>
              <b>{c.name}</b>
              <span className="m3">{c.meta}</span>
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
