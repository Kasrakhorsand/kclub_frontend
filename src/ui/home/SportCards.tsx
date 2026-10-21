"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SPORT_CARDS } from "@/config/home";
import { useSiteMedia } from "@/engine/content/useSiteContent";

/** Photo card per game, each linking to its booking page. Content: `config/home.tsx`. */
export function SportCards() {
  const media = useSiteMedia();
  return (
    <section className="sports3" data-reveal>
      <div className="wrap">
        <div className="s3hd">
          <span className="lat eyebrow">{SPORT_CARDS.eyebrow}</span>
          <h2>{SPORT_CARDS.title}</h2>
        </div>
        <div className="s3g">
          {SPORT_CARDS.cards.map((card) => (
            <Link key={card.name} href={card.href} className="spc">
              <div className="med">
                <img src={media.src(card.img.split("/").pop()!.replace(/\.\w+$/, ""), card.img)} alt={card.alt} loading="lazy" style={{ objectPosition: card.pos }} />
              </div>
              <div className="band">
                <span className="lat">{card.latin}</span>
                <h3>{card.name}</h3>
                <p>{card.text}</p>
                <span className="b3d sm">
                  <span>مشاهده سانس‌ها</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        {SPORT_CARDS.note && <p className="s3note">{SPORT_CARDS.note}</p>}
      </div>
    </section>
  );
}
