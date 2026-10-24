"use client";
/**
 * Checkout state: payment method, wallet eligibility, paying, and the
 * confirmation (tracking code). Redirects guests to login and back.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, newIdempotencyKey } from "@/engine/http";
import { useBookingLimit } from "@/engine/booking/useRushGuards";
import { createBookings } from "@/engine/api";
import { useWalletBalance } from "@/engine/wallet/useWallet";
import { cartTotal, useSession } from "@/engine/store";
import { courtById, rentalsFor, sportById } from "@/engine/venue";
import { itemTotal, rentalPriceOf, useRentalPrices } from "@/engine/pricing";
import type { CartItem } from "@/engine/types";
import { CHECKOUT_PATH, LOGIN_PATH } from "./useCart";
import { redirectToPayment } from "@/engine/security";

export type PaymentMethod = "wallet" | "gateway";

export const PAYMENT_FAILED = "پرداخت انجام نشد. دوباره تلاش کنید؛ اگر مبلغی کم شده باشد به کیف پول برمی‌گردد.";

export function useCheckout() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const cart = useSession((s) => s.cart);
  const toggleCart = useSession((s) => s.toggleCart);
  const clearCart = useSession((s) => s.clearCart);
  const setAfterLogin = useSession((s) => s.setAfterLogin);
  const setRentals = useSession((s) => s.setRentals);
  const rentalPrices = useRentalPrices();
  const client = useQueryClient();
  const wallet = useWalletBalance();

  const [method, setMethod] = useState<PaymentMethod>("gateway");
  const [confirmation, setConfirmation] = useState<{ tracking: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const limit = useBookingLimit();

  /**
   * One key per cart and payment method: a retry after "server busy" or a
   * dropped connection reuses it, so the backend never books the cart twice.
   */
  const keyRef = useRef<string | null>(null);
  useEffect(() => {
    keyRef.current = null;
  }, [cart, method]);

  /** Seconds left before the automatic retry after a 429, or null. */
  const [wait, setWait] = useState<number | null>(null);
  const attempts = useRef(0);
  const MAX_AUTO_RETRIES = 3;

  // Guests log in first and come straight back here. Read the store directly:
  // during hydration the hook still returns the empty server-side state.
  useEffect(() => {
    if (!useSession.getState().user) {
      setAfterLogin(CHECKOUT_PATH);
      router.replace(LOGIN_PATH);
    }
  }, [user, router, setAfterLogin]);

  const total = cartTotal(cart, rentalPrices);
  // Shown as a hint only; the backend checks the balance again when charging.
  const canUseWallet = !!user && wallet.balance >= total;

  /** Cart lines for display: the item, its court and sport, rental choices and line total. */
  const items = cart.map((item) => {
    const court = courtById(item.courtId);
    // Rentals this booking can add, with the current price and chosen quantity.
    const rentalOptions = rentalsFor(item.courtId, item.game).map((r) => ({
      ...r,
      price: rentalPriceOf(r.id, rentalPrices),
      quantity: item.rentals?.[r.id] ?? 0,
    }));
    return { item, court, sport: court ? sportById(court.sport) : undefined, rentalOptions, total: itemTotal(item, rentalPrices) };
  });

  // Count down the busy wait and try again when it reaches zero.
  const payRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (wait === null) return;
    if (wait <= 0) {
      setWait(null);
      payRef.current();
      return;
    }
    const t = setTimeout(() => setWait((w) => (w === null ? null : w - 1)), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const checkout = {
    /** null until the session is known and the user is logged in. */
    user,
    items,
    total,
    remove: (item: CartItem) => toggleCart(item),
    /** Set how many of a rental this item takes, clamped to 0…maxPerBooking. */
    setRental: (item: CartItem, rentalId: string, quantity: number) => {
      const max = rentalsFor(item.courtId, item.game).find((r) => r.id === rentalId)?.maxPerBooking ?? 0;
      setRentals(item, { ...item.rentals, [rentalId]: Math.max(0, Math.min(max, quantity)) });
    },
    method,
    setMethod: (m: PaymentMethod) => (m === "wallet" && !canUseWallet ? undefined : setMethod(m)),
    canUseWallet,
    busy,
    error,
    confirmation,
    /** The cart holds more sessions than the player may have active; paying is blocked. */
    limit,
    /** Seconds until the automatic retry while the server is busy (429). */
    wait,
    retryNow: () => setWait(0),
    cancelWait: () => {
      setWait(null);
      attempts.current = 0;
      setError("پرداخت متوقف شد. هر وقت خواستید دوباره «پرداخت» را بزنید.");
    },
    pay: async () => {
      if (!user || !cart.length) return;
      if (limit.over) {
        setError(`حداکثر ${limit.max.toLocaleString("fa-IR")} رزرو فعال مجاز است و شما ${limit.held.toLocaleString("fa-IR")} رزرو پیش رو دارید. چند سانس را از سبد حذف کنید.`);
        return;
      }
      setBusy(true);
      setError("");
      setWait(null);
      keyRef.current ??= newIdempotencyKey();
      try {
        const result = await createBookings(cart, method, keyRef.current);
        attempts.current = 0;
        // Gateway payment: hand over to the bank (only to an allowed host); the booking is confirmed on return.
        if (result.gatewayUrl) {
          if (!redirectToPayment(result.gatewayUrl)) throw new Error("PAYMENT_HOST");
          return;
        }
        clearCart();
        setConfirmation({ tracking: result.tracking });
        // Money and slots moved on the server.
        for (const key of [["wallet"], ["transactions"], ["my-bookings"], ["slots"], ["availability"]]) client.invalidateQueries({ queryKey: key });
      } catch (ex) {
        if (ex instanceof ApiError && ex.status === 429) {
          // Busy moment (e.g. a new day just opened): wait as long as the server asks, then try again with the same key.
          if (attempts.current < MAX_AUTO_RETRIES) {
            attempts.current += 1;
            setWait(ex.retryAfter ?? 5);
          } else {
            attempts.current = 0;
            setError("سرور هنوز شلوغ است. سانس‌ها در سبد شما می‌مانند؛ کمی بعد دوباره «پرداخت» را بزنید.");
          }
        } else if (ex instanceof ApiError && ex.code === "BOOKING_LIMIT") {
          client.invalidateQueries({ queryKey: ["my-bookings"] });
          setError(ex.message);
        } else if (ex instanceof ApiError && ex.code === "SLOT_TAKEN") {
          client.invalidateQueries({ queryKey: ["slots"] });
          setError("یکی از سانس‌ها همین الان رزرو شد. آن را از سبد حذف کنید و دوباره پرداخت کنید.");
        } else if (ex instanceof ApiError && ex.code === "LOW_BALANCE") {
          client.invalidateQueries({ queryKey: ["wallet"] });
          setError("موجودی کیف پول کافی نیست؛ پرداخت با درگاه را انتخاب کنید.");
        } else setError(PAYMENT_FAILED);
      } finally {
        setBusy(false);
      }
    },
  };
  payRef.current = () => void checkout.pay();
  return checkout;
}
