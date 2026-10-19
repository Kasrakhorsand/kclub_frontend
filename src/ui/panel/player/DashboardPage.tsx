"use client";
/**
 * Player › Dashboard (/panel): welcome hero with the next game and a live
 * countdown, stat tiles, quick booking per game, upcoming games, wallet and
 * latest notifications. Styles: player.css (classes prefixed "pd-").
 */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { fa, faNum, greeting, hm, jDay, jFull, jMonth, timeUntil, toman, weekday } from "@/engine/format";
import { NOTIFS } from "@/engine/mock";
import { todayKey, usePlayerSummary } from "@/engine/panel/stats";
import { useSession } from "@/engine/store";
import { PRICING, SPORTS, bookingHref, courtById, sportById } from "@/engine/venue";
import type { Booking } from "@/engine/types";
import { SITE } from "@/config/site";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import type { Icon3DName } from "@/ui/kit/icons3d";

/** Re-render every minute so countdowns stay current. */
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
}

/** Black-and-gold welcome band with the next game as a ticket. */
function WelcomeHero({ name, next }: { name: string; next: Booking | null }) {
  useMinuteTick();
  const court = next ? courtById(next.courtId) : undefined;
  const sport = court ? sportById(court.sport) : undefined;
  const left = next ? timeUntil(next.date, next.hour) : null;

  return (
    <section className="pd-hero">
      <img className="pd-hero-emb" src={SITE.logo.emblem} alt="" aria-hidden="true" />
      <div className="pd-hello">
        <span className="lat">{SITE.panelTagline}</span>
        <h2>
          {greeting()}، <b>{name}</b>
        </h2>
        <p>{jFull(todayKey())} · آماده‌ی بازی بعدی هستید؟</p>
        <div className="pd-hero-cta">
          <Button3D href="/sport">رزرو زمین</Button3D>
          <Button3D variant="dark" href="/panel/res">رزروهای من</Button3D>
        </div>
      </div>

      {next && court ? (
        <div className="pd-ticket" style={{ ["--floor" as string]: court.floor }}>
          <div className="pd-ticket-top">
            <span className="lat">Next game</span>
            {left && <span className="pd-countdown">{left} مانده</span>}
          </div>
          <div className="pd-ticket-body">
            <div className="pd-date">
              <b>{jDay(next.date)}</b>
              <span>{jMonth(next.date)}</span>
              <small>{weekday(next.date)}</small>
            </div>
            <div className="pd-ticket-info">
              <span className="pd-sport">{sport?.name}</span>
              <h3>{court.name}</h3>
              <p>ساعت {hm(next.hour)} تا {hm(next.hour + 1)} · {court.surface}</p>
            </div>
          </div>
          <div className="pd-ticket-foot">
            <span>{toman(next.price)}</span>
            <Link href="/panel/res">جزئیات ←</Link>
          </div>
        </div>
      ) : (
        <div className="pd-ticket empty">
          <Icon3D name="cal" />
          <h3>رزرو فعالی ندارید</h3>
          <p>سانس‌های خالی امروز را ببینید و زمین بگیرید.</p>
        </div>
      )}
    </section>
  );
}

type Tile = { icon: Icon3DName; label: string; value: string; hint?: string; href?: string };

function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <section className="pd-stats" aria-label="خلاصه">
      {tiles.map((t) => {
        const body = (
          <>
            <Icon3D name={t.icon} />
            <span className="pd-stat-text">
              <span className="pd-stat-label">{t.label}</span>
              <b>{t.value}</b>
              {t.hint && <small>{t.hint}</small>}
            </span>
          </>
        );
        return t.href ? (
          <Link key={t.label} className="pd-stat link" href={t.href}>{body}</Link>
        ) : (
          <div key={t.label} className="pd-stat">{body}</div>
        );
      })}
    </section>
  );
}

/** One card per game with its starting price. */
function QuickBook() {
  const games = SPORTS.flatMap((sport) =>
    sport.games.map((game) => ({
      sport,
      game,
      from: Math.min(...(PRICING[sport.id] ?? []).map((b) => b.price)),
    })),
  );
  return (
    <section className="pd-card">
      <header className="pd-card-head">
        <h3>رزرو سریع</h3>
        <Link href="/sport">همه‌ی رشته‌ها</Link>
      </header>
      <div className="pd-quick">
        {games.map(({ sport, game, from }) => (
          <Link key={game.id} className="pd-quick-item" href={bookingHref(sport.id, game.id)}>
            <Icon3D name={(game.model === "volley" ? "users" : sport.icon) as Icon3DName} />
            <span>
              <b>{game.name}</b>
              <small>از {fa(from / 1000)} هزار تومان</small>
            </span>
            <i aria-hidden="true">←</i>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Upcoming games as a vertical timeline. */
function Upcoming({ bookings }: { bookings: Booking[] }) {
  return (
    <section className="pd-card">
      <header className="pd-card-head">
        <h3>بازی‌های پیش رو</h3>
        <Link href="/panel/res">مدیریت رزروها</Link>
      </header>
      {!bookings.length && <p className="muted small">رزروی ندارید.</p>}
      <ol className="pd-timeline">
        {bookings.slice(0, 5).map((b) => {
          const court = courtById(b.courtId);
          return (
            <li key={b.id} style={{ ["--floor" as string]: court?.floor }}>
              <span className="pd-tl-date">
                <b>{jDay(b.date)}</b>
                <small>{jMonth(b.date)}</small>
              </span>
              <span className="pd-tl-body">
                <b>{court?.name}</b>
                <small>{weekday(b.date)} · {hm(b.hour)} تا {hm(b.hour + 1)}</small>
              </span>
              <span className="pd-tl-price">{toman(b.price)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WalletMini({ balance }: { balance: number }) {
  return (
    <section className="pd-wallet">
      <div className="pd-wallet-top">
        <span>{SITE.walletName}</span>
        <span className="pd-chip" aria-hidden="true" />
      </div>
      <div>
        <small>موجودی</small>
        <b>{faNum(balance)} <span>تومان</span></b>
      </div>
      <div className="pd-wallet-actions">
        <Link href="/panel/wallet">شارژ کیف پول</Link>
        <Link href="/panel/wallet">تراکنش‌ها</Link>
      </div>
    </section>
  );
}

function Notifications() {
  return (
    <section className="pd-card">
      <header className="pd-card-head">
        <h3>اعلان‌ها</h3>
        <Link href="/panel/notif">همه</Link>
      </header>
      <ul className="pd-notifs">
        {NOTIFS.map((n) => (
          <li key={n.id} className={clsx(!n.read && "unread")}>
            <Icon3D name="bell" />
            <span>
              <b>{n.title}</b>
              <small>{n.text}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlayerDashboard() {
  const user = useSession((s) => s.user)!;
  const summary = usePlayerSummary();
  const favSport = summary.favoriteSport ? sportById(summary.favoriteSport) : undefined;
  const favCourt = summary.favoriteCourt ? courtById(summary.favoriteCourt) : undefined;

  return (
    <div className="pd">
      <WelcomeHero name={user.first} next={summary.next} />
      <StatTiles
        tiles={[
          { icon: "cal", label: "رزروهای پیش رو", value: fa(summary.upcoming.length), hint: "سانس", href: "/panel/res" },
          { icon: "clock", label: "بازی در ۳۰ روز گذشته", value: fa(summary.played30), hint: "ساعت" },
          { icon: "trophy", label: "رشته‌ی محبوب", value: favSport?.name ?? "—", hint: favCourt ? `بیشتر در ${favCourt.name}` : undefined },
          { icon: "wallet", label: "کیف پول", value: faNum(user.wallet), hint: "تومان", href: "/panel/wallet" },
        ]}
      />
      <div className="pd-grid">
        <div className="pd-col">
          <Upcoming bookings={summary.upcoming} />
          <QuickBook />
        </div>
        <div className="pd-col">
          <WalletMini balance={user.wallet} />
          <Notifications />
        </div>
      </div>
    </div>
  );
}
