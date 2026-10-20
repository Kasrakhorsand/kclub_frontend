/**
 * Runtime configuration from environment variables (see .env.example).
 * Only NEXT_PUBLIC_* values reach the browser; never put secrets here.
 */

/** Backend base URL, e.g. "https://api.kclub.ir/v1". Empty = built-in sample data. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** True while no backend is configured; api.ts then serves mock data. */
export const USE_MOCK = !API_URL;

/**
 * Hosts the app may redirect to for payment (bank gateways), comma-separated,
 * e.g. "sep.shaparak.ir,pec.shaparak.ir". Anything else is refused.
 */
export const PAYMENT_HOSTS = (process.env.NEXT_PUBLIC_PAYMENT_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** Request timeout in milliseconds. */
export const API_TIMEOUT_MS = 15_000;
