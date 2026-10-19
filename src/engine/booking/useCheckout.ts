"use client";
/**
 * Checkout state: payment method, wallet eligibility, paying, and the
 * confirmation (tracking code). Redirects guests to login and back.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBookings } from "@/engine/api";
import { cartTotal, useSession } from "@/engine/store";
import { courtById, sportById } from "@/engine/venue";
import type { CartItem } from "@/engine/types";
import { CHECKOUT_PATH, LOGIN_PATH } from "./useCart";

export type PaymentMethod = "wallet" | "gateway";

export const PAYMENT_FAILED = "پرداخت انجام نشد. دوباره تلاش کنید؛ اگر مبلغی کم شده باشد به کیف پول برمی‌گردد.";

export function useCheckout() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const cart = useSession((s) => s.cart);
  const toggleCart = useSession((s) => s.toggleCart);
  const clearCart = useSession((s) => s.clearCart);
  const setAfterLogin = useSession((s) => s.setAfterLogin);

  const [method, setMethod] = useState<PaymentMethod>("gateway");
  const [confirmation, setConfirmation] = useState<{ tracking: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Guests log in first and come straight back here.
  useEffect(() => {
    if (!user) {
      setAfterLogin(CHECKOUT_PATH);
      router.replace(LOGIN_PATH);
    }
  }, [user, router, setAfterLogin]);

  const total = cartTotal(cart);
  const canUseWallet = !!user && user.wallet >= total;

  const items = cart.map((item) => {
    const court = courtById(item.courtId);
    return { ...item, court, sport: court ? sportById(court.sport) : undefined };
  });

  return {
    /** null until the session is known and the user is logged in. */
    user,
    items,
    total,
    remove: (item: CartItem) => toggleCart(item),
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
        const result = await createBookings(user, cart, method);
        clearCart();
        setConfirmation({ tracking: result.tracking });
      } catch {
        setError(PAYMENT_FAILED);
      } finally {
        setBusy(false);
      }
    },
  };
}
