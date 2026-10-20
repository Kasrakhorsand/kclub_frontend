"use client";
/**
 * Player's bookings page: upcoming and past games, and cancelling with a
 * refund preview (CANCEL_RULES) and a confirmation step.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cancelBooking } from "@/engine/api";
import { refundPercent } from "@/engine/venue";
import type { Booking } from "@/engine/types";
import { myBookingsKey, useMyBookings, usePastBookings } from "./stats";

export type BookingsTab = "upcoming" | "past";

/** A cancellation waiting for the player's confirmation. */
export type PendingCancel = { booking: Booking; refundPercent: number; refundAmount: number };

export function useMyBookingsManager() {
  const upcomingAll = useMyBookings(20);
  const past = usePastBookings(30);
  const client = useQueryClient();
  const [tab, setTab] = useState<BookingsTab>("upcoming");
  const [cancelled, setCancelled] = useState<Record<string, number>>({}); // id → refund amount
  const [pending, setPending] = useState<PendingCancel | null>(null);
  const [busy, setBusy] = useState(false);

  const upcoming = upcomingAll.filter((b) => !(b.id in cancelled));

  return {
    tab,
    setTab,
    upcoming,
    past,
    /** Bookings cancelled in this visit, with their refund. */
    cancelled,
    pending,
    busy,
    /** Open the confirmation with the refund the player would get right now. */
    askCancel: (booking: Booking) => {
      const percent = refundPercent(booking.date, booking.hour);
      setPending({ booking, refundPercent: percent, refundAmount: Math.round((booking.price * percent) / 100) });
    },
    dismiss: () => setPending(null),
    /** Cancel the pending booking; resolves with the refund actually applied. */
    confirmCancel: async () => {
      if (!pending) return null;
      setBusy(true);
      try {
        const result = await cancelBooking(pending.booking);
        setCancelled((c) => ({ ...c, [pending.booking.id]: result.refundAmount }));
        setPending(null);
        // The wallet balance and booking list changed on the server.
        client.invalidateQueries({ queryKey: myBookingsKey("upcoming") });
        client.invalidateQueries({ queryKey: ["transactions"] });
        client.invalidateQueries({ queryKey: ["wallet"] });
        return result;
      } finally {
        setBusy(false);
      }
    },
  };
}
