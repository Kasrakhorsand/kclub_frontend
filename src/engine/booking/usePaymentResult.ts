"use client";
/**
 * The /payment/return page: the backend sends the user here after the bank,
 * with ?ref=<payment ref>. We ask the backend what happened (never trusting
 * the URL), keep asking for a while if the bank is still confirming, and on
 * success refresh the wallet, bookings and slots and empty the cart.
 */
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPaymentResult } from "@/engine/api";
import { useSession } from "@/engine/store";

const REF = /^[A-Za-z0-9_-]{4,64}$/;
/** Poll every 3 s while the payment is pending, for up to a minute. */
const POLL_MS = 3_000;
const POLL_MAX = 20;

export function usePaymentResult(refParam: string | null) {
  const ref = refParam && REF.test(refParam) ? refParam : null;
  const client = useQueryClient();
  const clearCart = useSession((s) => s.clearCart);
  const polls = useRef(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["payment", ref],
    queryFn: () => getPaymentResult(ref!),
    enabled: !!ref,
    retry: 2,
    refetchInterval: (q) => (q.state.data?.status === "pending" && ++polls.current < POLL_MAX ? POLL_MS : false),
  });

  const done = data?.status === "paid";
  useEffect(() => {
    if (!done || !data) return;
    if (data.kind === "booking") clearCart();
    if (data.wallet !== undefined) useSession.getState().updateUser({ wallet: data.wallet });
    for (const key of [["wallet"], ["transactions"], ["my-bookings"], ["slots"], ["availability"], ["notifications"]]) client.invalidateQueries({ queryKey: key });
  }, [done, data, clearCart, client]);

  return {
    /** The link was missing or malformed. */
    invalid: !ref,
    loading: !!ref && isLoading,
    /** Could not reach the backend to ask. */
    failedToCheck: isError,
    errorMessage: (error as Error | null)?.message,
    result: data,
    /** Still pending after a minute of checking. */
    stillPending: data?.status === "pending" && polls.current >= POLL_MAX,
  };
}
