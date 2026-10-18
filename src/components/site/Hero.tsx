"use client";
import dynamic from "next/dynamic";
import { Icon3D } from "../ui/Icon3D";
import { useEffect, useRef } from "react";
import { Button3D } from "../ui/Buttons";
import { useSession } from "@/lib/store";

const Logo3D = dynamic(() => import("../three/Logo3D"), { ssr: false, loading: () => <div className="klogo3" /> });

/** Background clips play one after another with a crossfade. */
const CLIPS = [
  { src: "/media/hero-beach-tennis.mp4", pos: "50% 55%" },
  { src: "/media/hero-padel.mp4", pos: "50% 68%" },
  { src: "/media/hero-beach-volley.mp4", pos: "50% 50%" },
];

function HeroVideos() {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vs = Array.from(wrap.current?.querySelectorAll("video") ?? []);
    if (!vs.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      vs[0].loop = true;
      vs[0].play().catch(() => {});
      return;
    }
    let cur = 0;
    let switching = false;
    const next = () => {
      const a = vs[cur];
      cur = (cur + 1) % vs.length;
      const b = vs[cur];
      b.currentTime = 0;
      b.play().catch(() => {});
      b.classList.add("on");
      setTimeout(() => {
        a.classList.remove("on");
        a.pause();
        switching = false;
      }, 900);
    };
    const onTime = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (v === vs[cur] && v.duration && v.duration - v.currentTime < 0.9 && !switching) {
        switching = true;
        next();
      }
    };
    vs.forEach((v) => v.addEventListener("timeupdate", onTime));
    vs[0].play().catch(() => {});
    return () => vs.forEach((v) => v.removeEventListener("timeupdate", onTime));
  }, []);
  return (
    <div className="bgv" aria-hidden="true" ref={wrap}>
      {CLIPS.map((c, i) => (
        <video
          key={c.src}
          className={`hv ${i === 0 ? "on" : ""}`}
          src={c.src}
          style={{ objectPosition: c.pos }}
          poster={i === 0 ? "/media/hero-poster.jpg" : undefined}
          muted
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
        />
      ))}
      <span className="shade" />
    </div>
  );
}

export function Hero() {
  const user = useSession((s) => s.user);
  return (
    <section className="hero3">
      <HeroVideos />
      <div className="wrap hin">
        <Logo3D />
        <div className="htx">
          <span className="lat eyebrow">Padel · Beach Tennis · Beach Volley</span>
          <h1>
            زمینت را <b>آنلاین</b> رزرو کن
          </h1>
          <p>سانس خالی را ببین، زمین را روی نقشه انتخاب کن و پرداخت کن. بدون تماس و انتظار.</p>
          <div className="cta">
            <Button3D size="lg" href="/sport">
              رزرو زمین
            </Button3D>
            <Button3D size="lg" variant="dark" href={user ? "/panel" : "/login"}>
              {user ? "پنل من" : "ورود / ثبت‌نام"}
            </Button3D>
          </div>
        </div>
      </div>
      <div className="facts3">
        <div className="wrap">
          <div className="f3i">
            <Icon3D name="court" />
            <span>
              <b>۳</b>
              <span>زمین پدل سرپوشیده</span>
            </span>
          </div>
          <div className="f3i">
            <Icon3D name="racket" />
            <span>
              <b>۳</b>
              <span>زمین تنیس ساحلی و والیبال ساحلی</span>
            </span>
          </div>
          <div className="f3i">
            <Icon3D name="clock" />
            <span>
              <b>۸ تا ۲۴</b>
              <span>هر روز هفته</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
