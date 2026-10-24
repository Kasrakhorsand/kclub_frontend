/**
 * Small guards against common front-end attacks: open redirects and
 * tampered URL parameters. Server-side checks are still required.
 */
import { PAYMENT_HOSTS } from "@/engine/config";
import { addDays, dayKey } from "@/engine/format";
import { HOURS } from "@/engine/venue";

/** Longest booking window the admin can set; the page trims to the real one. */
const MAX_WINDOW_DAYS = 90;

/**
 * An in-app path that is safe to navigate to after login: must start with a
 * single "/" (no "//evil.com", no "https://…", no "javascript:"). Anything
 * else falls back to `fallback`.
 */
export function safeInternalPath(path: string | null | undefined, fallback = "/panel") {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(path)) return fallback;
  return path;
}

/** True for an https URL whose host is in NEXT_PUBLIC_PAYMENT_HOSTS (or a subdomain of one). */
export function isAllowedPaymentUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return PAYMENT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Send the browser to a bank gateway, only if the URL is allowed. Returns false when refused. */
export function redirectToPayment(raw: string) {
  if (!isAllowedPaymentUrl(raw)) return false;
  window.location.assign(raw);
  return true;
}

/** A yyyy-MM-dd day inside today … today + MAX_WINDOW_DAYS - 1, or null. */
export function bookableDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const today = dayKey(new Date());
  const last = dayKey(addDays(new Date(), MAX_WINDOW_DAYS - 1));
  return value >= today && value <= last ? value : null;
}

/** An opening hour from a URL parameter, or null. */
export function openingHourParam(value: string | null) {
  if (!value || !/^\d{1,2}$/.test(value)) return null;
  const hour = Number(value);
  return HOURS.includes(hour) ? hour : null;
}
