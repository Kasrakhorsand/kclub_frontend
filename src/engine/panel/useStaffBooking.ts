"use client";
/**
 * Front desk booking for a walk-in or phone customer: find the customer by
 * phone (or take a new name), pick one or more court-hours on a day grid,
 * game and rentals, weekly repeat, payment method and a note, then book.
 * Repeated weeks are checked against each week's board before sending; the
 * backend checks again and prices everything.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createDeskBooking, findCustomer, getDayBoard, isPast } from "@/engine/api";
import { ApiError } from "@/engine/http";
import { addDays, dayKey, toLatinDigits } from "@/engine/format";
import { useDayBoard } from "@/engine/panel/stats";
import { rentalPriceOf, usePrices } from "@/engine/pricing";
import { HOURS, courtById, rentalsFor, sportById } from "@/engine/venue";
import { useRules } from "@/engine/content/useSiteContent";
import { useActiveCourts } from "@/engine/useCourts";
import type { Booking, Court, DeskBookingResult, DeskPayment } from "@/engine/types";

/** Weekly repeat choices at the desk. */
export const DESK_REPEAT = [1, 4, 8, 12];

export const DESK_PAYMENTS: { id: DeskPayment; label: string; hint: string }[] = [
  { id: "pos", label: "کارتخوان", hint: "پرداخت همین الان با دستگاه" },
  { id: "cash", label: "نقدی", hint: "دریافت وجه نقد در پذیرش" },
  { id: "wallet", label: "کیف پول مشتری", hint: "کسر از موجودی حساب" },
  { id: "link", label: "لینک پرداخت", hint: "پیامک لینک درگاه به مشتری" },
  { id: "later", label: "پرداخت هنگام ورود", hint: "رزرو ثبت می‌شود، پرداخت بعداً" },
];

const PHONE = /^09\d{9}$/;
const cellKey = (courtId: string, hour: number) => `${courtId}|${hour}`;
const plusWeeks = (date: string, w: number) => dayKey(addDays(new Date(`${date}T00:00:00`), w * 7));

export type DeskCell = { court: Court; hour: number; state: "past" | "taken" | "free" | "picked"; booking?: Booking; price: number };

export function useStaffBooking(preset: { date?: string | null; hour?: number | null; court?: string | null; phone?: string | null } = {}) {
  const client = useQueryClient();
  const prices = usePrices();
  const rentalPrices = prices.rentals;
  const courts = useActiveCourts();
  const maxDays = useRules().maxDaysAhead;

  /* ----- customer ----- */
  const [phoneText, setPhoneText] = useState(preset.phone && /^09\d{9}$/.test(preset.phone) ? preset.phone : "");
  const phone = toLatinDigits(phoneText).replace(/\D/g, "").slice(0, 11);
  const phoneOk = PHONE.test(phone);
  const { data: customer, isFetching: lookingUp } = useQuery({
    queryKey: ["desk-customer", phone],
    queryFn: () => findCustomer(phone),
    enabled: phoneOk,
    staleTime: 30_000,
  });
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const isNew = phoneOk && customer === null;

  /* ----- day and court-hours ----- */
  const [date, setDate] = useState(preset.date ?? dayKey(new Date()));
  const presetCourt = preset.court && courtById(preset.court) ? preset.court : null;
  const [picked, setPicked] = useState<Set<string>>(() => (presetCourt && preset.hour != null ? new Set([cellKey(presetCourt, preset.hour)]) : new Set()));
  const { data: board = [], isLoading: boardLoading } = useDayBoard(date);
  const days = useMemo(() => Array.from({ length: maxDays }, (_, i) => dayKey(addDays(new Date(), i))), [maxDays]);

  const cells: DeskCell[][] = courts.map((court) =>
    HOURS.map((hour) => {
      const booking = board.find((b) => b.courtId === court.id && b.hour === hour && b.status === "active");
      const state = isPast(date, hour) ? "past" : booking ? "taken" : picked.has(cellKey(court.id, hour)) ? "picked" : "free";
      return { court, hour, state, booking, price: prices.session(court.sport, hour) };
    }),
  );

  const toggle = (court: Court, hour: number) => {
    const cell = cells[courts.indexOf(court)]?.[hour - HOURS[0]];
    if (!cell || cell.state === "past" || cell.state === "taken") return;
    setPicked((cur) => {
      const next = new Set(cur);
      const k = cellKey(court.id, hour);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
    setResult(null);
  };
  const changeDate = (d: string) => {
    setDate(d);
    setPicked(new Set());
    setResult(null);
  };

  const selection = [...picked]
    .map((k) => {
      const [courtId, h] = k.split("|");
      return { court: courtById(courtId)!, hour: Number(h) };
    })
    .filter((x) => x.court)
    .sort((a, b) => a.hour - b.hour || a.court.n - b.court.n);

  /* ----- game, rentals, repeat, payment, note ----- */
  const sportsPicked = [...new Set(selection.map((s) => s.court.sport))];
  const multiGameSport = sportsPicked.map((id) => sportById(id)).find((s) => s && s.games.length > 1);
  const [game, setGame] = useState<string | null>(null);
  const gameFor = (court: Court) => {
    const sport = sportById(court.sport);
    if (!sport) return undefined;
    return sport.games.length === 1 ? sport.games[0].id : (game ?? undefined);
  };

  const [rentalQty, setRentalQty] = useState<Record<string, number>>({});
  const rentalOptions = useMemo(() => {
    const seen = new Map<string, ReturnType<typeof rentalsFor>[number]>();
    for (const s of selection) for (const r of rentalsFor(s.court.id, gameFor(s.court))) seen.set(r.id, r);
    return [...seen.values()].map((r) => ({ ...r, price: rentalPriceOf(r.id, rentalPrices), quantity: rentalQty[r.id] ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selection is derived from `picked`
  }, [picked, game, rentalPrices, rentalQty]);

  const [weeks, setWeeks] = useState(1);
  const [payment, setPayment] = useState<DeskPayment>("pos");
  const [note, setNote] = useState("");

  const rentalsOf = (court: Court) =>
    Object.fromEntries(rentalOptions.filter((r) => r.quantity > 0 && rentalsFor(court.id, gameFor(court)).some((x) => x.id === r.id)).map((r) => [r.id, r.quantity]));
  const linePrice = (court: Court, hour: number) =>
    prices.session(court.sport, hour) + Object.entries(rentalsOf(court)).reduce((a, [id, q]) => a + q * rentalPriceOf(id, rentalPrices), 0);
  const sessionTotal = selection.reduce((a, s) => a + linePrice(s.court, s.hour), 0);
  const estimate = sessionTotal * weeks;

  const walletShort = payment === "wallet" && !!customer && customer.wallet < estimate;

  /* ----- submit ----- */
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(DeskBookingResult & { skipped: number }) | null>(null);

  const problem = !phoneOk
    ? "شماره‌ی موبایل مشتری را کامل وارد کنید"
    : isNew && (first.trim().length < 2 || last.trim().length < 2)
      ? "نام و نام خانوادگی مشتری جدید را بنویسید"
      : !selection.length
        ? "حداقل یک سانس را روی جدول انتخاب کنید"
        : multiGameSport && !game
          ? `بازی ${multiGameSport.name} را انتخاب کنید`
          : walletShort
            ? "موجودی کیف پول مشتری کافی نیست"
            : "";

  const submit = async () => {
    if (problem || busy) return;
    setBusy(true);
    setError("");
    try {
      // Every repeated week must be free on that day's board.
      const items: { courtId: string; date: string; hour: number; game?: string; rentals?: Record<string, number> }[] = [];
      let skipped = 0;
      const lastDay = days[days.length - 1];
      for (let w = 0; w < weeks; w++) {
        const d = plusWeeks(date, w);
        if (d > lastDay) {
          skipped += selection.length;
          continue;
        }
        const dayBoard = w === 0 ? board : await client.fetchQuery({ queryKey: ["board", d], queryFn: () => getDayBoard(d), staleTime: 20_000 });
        for (const s of selection) {
          const busyThere = dayBoard.some((b) => b.courtId === s.court.id && b.hour === s.hour && b.status === "active");
          if (busyThere || isPast(d, s.hour)) {
            skipped++;
            continue;
          }
          const rentals = rentalsOf(s.court);
          items.push({ courtId: s.court.id, date: d, hour: s.hour, game: gameFor(s.court), rentals: Object.keys(rentals).length ? rentals : undefined });
        }
      }
      if (!items.length) throw new Error("همه‌ی سانس‌های انتخابی پر هستند");
      const res = await createDeskBooking({
        phone,
        first: isNew ? first.trim() : undefined,
        last: isNew ? last.trim() : undefined,
        items,
        payment,
        note: note.trim() || undefined,
      });
      setResult({ ...res, skipped });
      setPicked(new Set());
      for (const key of [["board"], ["slots"], ["availability"], ["desk-customer"], ["wallet"]]) client.invalidateQueries({ queryKey: key });
    } catch (ex) {
      if (ex instanceof ApiError && ex.code === "SLOT_TAKEN") {
        client.invalidateQueries({ queryKey: ["board"] });
        setError("یکی از سانس‌ها همین الان رزرو شد؛ جدول به‌روز شد، دوباره انتخاب کنید.");
      } else setError((ex as Error).message || "ثبت رزرو انجام نشد");
    } finally {
      setBusy(false);
    }
  };

  /** Clear everything for the next customer. */
  const reset = () => {
    setPhoneText("");
    setFirst("");
    setLast("");
    setPicked(new Set());
    setRentalQty({});
    setWeeks(1);
    setPayment("pos");
    setNote("");
    setGame(null);
    setResult(null);
    setError("");
  };

  return {
    /* customer */
    phoneText, setPhoneText, phone, phoneOk, lookingUp, customer: customer ?? null, isNew, first, setFirst, last, setLast,
    /* grid */
    date, days, changeDate, courts, hours: HOURS, cells, boardLoading, toggle, selection, clearSelection: () => setPicked(new Set()),
    /* extras */
    multiGameSport, game, setGame,
    rentalOptions, setRental: (id: string, q: number) => setRentalQty((r) => ({ ...r, [id]: q })),
    weeks, setWeeks, payment, setPayment, note, setNote,
    /* money */
    linePrice, sessionTotal, estimate, walletShort,
    /* submit */
    problem, busy, error, result, submit, reset,
  };
}
