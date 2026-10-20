"use client";
/**
 * Checkout state: payment method, wallet eligibility, paying, and the
 * confirmation (tracking code). Redirects guests to login and back.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/engine/http";
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

  return {
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
    pay: async () => {
      if (!user || !cart.length) return;
      setBusy(true);
      setError("");
      try {
        const result = await createBookings(cart, method);
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
        if (ex instanceof ApiError && ex.code === "SLOT_TAKEN") {
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
}
