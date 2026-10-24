/**
 * Courts with their live "open for booking" flag (GET /courts), so a court
 * the admin hides disappears from every board. Config until it loads.
 */
import { useQuery } from "@tanstack/react-query";
import { getCourts } from "@/engine/api";
import { COURTS } from "@/engine/venue";

/** Every court; `active` is false for courts the admin took out of booking. */
export function useCourts() {
  const { data = COURTS } = useQuery({ queryKey: ["courts", "all"], queryFn: () => getCourts(), staleTime: 5 * 60_000 });
  return data;
}

/** Courts open for booking. */
export function useActiveCourts() {
  return useCourts().filter((c) => c.active);
}
