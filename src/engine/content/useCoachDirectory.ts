"use client";
/** Public coaches page: published coaches with game and gender filters and the opened profile. Shared by every club site. */
import { useState } from "react";
import { useCoaches } from "@/engine/content/useSiteContent";
import { COACH_GAMES } from "@/engine/content/useCoachEditor";
import type { Coach } from "@/engine/types";

export function useCoachDirectory() {
  const { coaches, loading } = useCoaches();
  const [game, setGame] = useState<string | null>(null);
  const [gender, setGender] = useState<"female" | "male" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Only offer filters that match at least one coach.
  const games = COACH_GAMES.filter((g) => coaches.some((c) => c.games.includes(g.id)));
  const hasGender = coaches.some((c) => c.gender === "female") && coaches.some((c) => c.gender === "male");
  const shown = coaches.filter((c) => (!game || c.games.includes(game)) && (!gender || c.gender === gender));
  const opened: Coach | null = coaches.find((c) => c.id === openId) ?? null;

  return {
    loading, total: coaches.length, all: coaches, shown, games, hasGender,
    game, setGame, gender, setGender,
    clear: () => { setGame(null); setGender(null); },
    opened, open: setOpenId,
    gameName: (id: string) => COACH_GAMES.find((g) => g.id === id)?.name ?? id,
  };
}
