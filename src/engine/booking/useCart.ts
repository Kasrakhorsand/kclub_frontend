"use client";
/** Cart contents, total and the checkout hand-off (guests go through login first). */
import { useRouter } from "next/navigation";
import { cartTotal, useSession } from "@/engine/store";
import { useRentalPrices } from "@/engine/pricing";
import { courtById } from "@/engine/venue";
import type { CartItem } from "@/engine/types";

export const CHECKOUT_PATH = "/checkout";
export const LOGIN_PATH = "/login";

/** Cart item with its court resolved, sorted by date and hour. */
export type CartLine = CartItem & { courtName: string };

export function useCart() {
  const router = useRouter();
  const cart = useSession((s) => s.cart);
  const toggleCart = useSession((s) => s.toggleCart);
  const user = useSession((s) => s.user);
  const setAfterLogin = useSession((s) => s.setAfterLogin);
  const rentalPrices = useRentalPrices();

  const lines: CartLine[] = [...cart]
    .sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
    .map((item) => ({ ...item, courtName: courtById(item.courtId)?.name ?? item.courtId }));

  return {
    lines,
    count: cart.length,
    total: cartTotal(cart, rentalPrices),
    remove: (item: CartItem) => toggleCart(item),
    /** Go to checkout, or to login first and come back to checkout after. */
    goToCheckout: () => {
      if (!user) {
        setAfterLogin(CHECKOUT_PATH);
        router.push(LOGIN_PATH);
      } else router.push(CHECKOUT_PATH);
    },
  };
}
