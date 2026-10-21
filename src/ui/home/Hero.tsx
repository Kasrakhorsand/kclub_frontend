"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useSession } from "@/engine/store";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { CountUp } from "@/ui/kit/CountUp";
import { HERO, HERO_FACTS } from "@/config/home";
import { useSiteMedia } from "@/engine/content/useSiteContent";

const Logo3D = dynamic(() => import("@/ui/three/Logo3D"), { ssr: false, loading: () => <div className="klogo3" /> });

/** Crossfade length between background clips. */
const CROSSFADE_MS = 900;

/** Muted background videos; each one fades into the next just before it ends. Reduced motion loops the first clip. */
function HeroVideos() {
  const wrap = useRef<HTMLDivElement>(null);
  // Videos and poster the front desk replaced from the panel (config/home.tsx MEDIA_SLOTS).
  const media = useSiteMedia();
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
    // Re-wire the crossfade when a video is replaced from the panel.
  }, [media.replaced]);
  return (
    <div className="bgv" aria-hidden="true" ref={wrap}>
      {HERO.videos.map((clip, i) => (
        <video
          key={`${i}-${media.src(`hero-video-${i + 1}`, clip.src)}`}
          className={`hv ${i === 0 ? "on" : ""}`}
          src={media.src(`hero-video-${i + 1}`, clip.src)}
          style={{ objectPosition: clip.pos }}
          poster={i === 0 ? media.src("hero-poster", HERO.poster) : undefined}
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
          <span className="lat eyebrow">{HERO.eyebrow}</span>
          <h1>
            {HERO.title.before} <b>{HERO.title.highlight}</b> {HERO.title.after}
          </h1>
          <p>{HERO.text}</p>
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
          {HERO_FACTS.map((fact) => (
            <div className="f3i" key={fact.label}>
              <Icon3D name={fact.icon} />
              <span>
                <b>
                  <CountUp to={fact.value} />
                  {fact.valueTo !== undefined && <> تا <CountUp to={fact.valueTo} from={fact.value} /></>}
                </b>
                <span>{fact.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
