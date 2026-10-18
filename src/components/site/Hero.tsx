"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/store";
import { Button3D } from "../ui/Buttons";
import { Icon3D } from "../ui/Icon3D";
import { CountUp } from "../ui/CountUp";

const Logo3D = dynamic(() => import("../three/Logo3D"), { ssr: false, loading: () => <div className="klogo3" /> });

/** Background clips play one after another with a crossfade. */
const CROSSFADE_MS = 900;
const CLIPS = [
  { src: "/media/hero-beach-tennis.mp4", pos: "50% 55%" },
  { src: "/media/hero-padel.mp4", pos: "50% 68%" },
  { src: "/media/hero-beach-volley.mp4", pos: "50% 50%" },
];

/** Muted background videos; each one fades into the next just before it ends. Reduced motion loops the first clip. */
function HeroVideos() {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const videos = Array.from(wrap.current?.querySelectorAll("video") ?? []);
    if (!videos.length) return;
    // Autoplay can be refused (e.g. data saver); the poster stays visible then.
    const play = (v: HTMLVideoElement) => v.play().catch(() => {});
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      videos[0].loop = true;
      play(videos[0]);
      return;
    }
    let current = 0;
    let switching = false;
    const crossfade = () => {
      const from = videos[current];
      current = (current + 1) % videos.length;
      const to = videos[current];
      to.currentTime = 0;
      play(to);
      to.classList.add("on");
      setTimeout(() => {
        from.classList.remove("on");
        from.pause();
        switching = false;
      }, CROSSFADE_MS);
    };
    const onTime = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      const nearEnd = v.duration && v.duration - v.currentTime < CROSSFADE_MS / 1000;
      if (v === videos[current] && nearEnd && !switching) {
        switching = true;
        crossfade();
      }
    };
    videos.forEach((v) => v.addEventListener("timeupdate", onTime));
    play(videos[0]);
    return () => videos.forEach((v) => v.removeEventListener("timeupdate", onTime));
  }, []);
  return (
    <div className="bgv" aria-hidden="true" ref={wrap}>
      {CLIPS.map((clip, i) => (
        <video
          key={clip.src}
          className={`hv ${i === 0 ? "on" : ""}`}
          src={clip.src}
          style={{ objectPosition: clip.pos }}
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

/** Home hero: video backdrop, 3D logo, headline, calls to action and the stats bar. */
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
              <b><CountUp to={3} /></b>
              <span>زمین پدل سرپوشیده</span>
            </span>
          </div>
          <div className="f3i">
            <Icon3D name="racket" />
            <span>
              <b><CountUp to={3} /></b>
              <span>زمین تنیس ساحلی و والیبال ساحلی</span>
            </span>
          </div>
          <div className="f3i">
            <Icon3D name="clock" />
            <span>
              <b><CountUp to={8} /> تا <CountUp to={24} from={8} /></b>
              <span>هر روز هفته</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
