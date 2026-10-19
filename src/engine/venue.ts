/**
 * Venue helpers built on `config/venue.ts`. Modules import venue data from
 * here, never from the config file directly, so the config stays plain data.
 */
import { CANCEL_RULES, CLOSE_HOUR, COURTS, HOLD_MINUTES, MAX_DAYS_AHEAD, OPEN_HOUR, PRICING, RENTALS, SPORTS } from "@/config/venue";
import type { Court, GameDef, Sport, SportDef } from "@/engine/types";

export { CANCEL_RULES, CLOSE_HOUR, COURTS, HOLD_MINUTES, MAX_DAYS_AHEAD, OPEN_HOUR, PRICING, RENTALS, SPORTS };

/** Session start hours, OPEN_HOUR … CLOSE_HOUR - 1. */
export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => i + OPEN_HOUR);

/** Session price (toman) for a sport at a start hour. */
export const priceOf = (sport: Sport, hour: number) =>
  PRICING[sport]?.find((b) => hour >= b.from && hour < b.to)?.price ?? 0;

export const sportById = (id: Sport): SportDef | undefined => SPORTS.find((s) => s.id === id);

export const courtById = (id: string): Court | undefined => COURTS.find((c) => c.id === id);

export const courtsOf = (sport: Sport) => COURTS.filter((c) => c.sport === sport);

/** A game of a sport by id, or the sport's first game. */
export const gameOf = (sport: SportDef, gameId?: string | null): GameDef =>
  sport.games.find((g) => g.id === gameId) ?? sport.games[0];

/** Display name for a sport: its only game's name, or the joined game names. */
export const sportTitle = (sport: SportDef) => sport.games.map((g) => g.name).join(" و ");

/** Booking page URL for a sport, optionally for one game. */
export const bookingHref = (sport: Sport, gameId?: string) => {
  const s = sportById(sport);
  return s && gameId && s.games.length > 1 ? `/book/${sport}?game=${gameId}` : `/book/${sport}`;
};

/** Refund percentage if a booking were cancelled now, from CANCEL_RULES. */
export function refundPercent(date: string, hour: number, now = Date.now()) {
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`).getTime();
  const hoursLeft = (start - now) / 36e5;
  return CANCEL_RULES.find((r) => hoursLeft >= r.hours)?.percent ?? 0;
}

/**
 * Rentals offered for a booking: those whose games include the booked game,
 * or, when no game was chosen, any game of the court's sport.
 */
export function rentalsFor(courtId: string, game?: string) {
  const court = courtById(courtId);
  return court ? rentalsForSport(court.sport, game) : [];
}

/** Rentals offered when booking a sport (optionally one game of it). */
export function rentalsForSport(sportId: Sport, game?: string | null) {
  const sport = sportById(sportId);
  if (!sport) return [];
  const games = game ? [game] : sport.games.map((g) => g.id);
  return RENTALS.filter((r) => r.games.some((g) => games.includes(g)));
}
