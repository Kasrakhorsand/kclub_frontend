/**
 * The one HTTP client every backend call goes through.
 *
 * Auth model (agree this with the backend):
 * - The session is an httpOnly, Secure, SameSite=Lax cookie set by the
 *   backend on login. JavaScript never sees or stores a token, so XSS
 *   can't steal it. Requests send it with `credentials: "include"`.
 * - CSRF: the backend also sets a readable `csrf_token` cookie; we echo it in
 *   the `X-CSRF-Token` header on every non-GET request (double-submit).
 * - Identity comes from the session on the server, never from a phone or
 *   user id the browser sends.
 */
import { API_TIMEOUT_MS, API_URL } from "@/engine/config";

/** An error from the backend (or the network) with a message safe to show the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status; 0 for network errors and timeouts. */
    readonly status: number,
    /** Machine-readable code from the backend body, e.g. "SLOT_TAKEN". */
    readonly code?: string,
    /** Seconds to wait before trying again (from Retry-After on 429/503). */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Default Persian messages per status, used when the backend gives none. */
const STATUS_MESSAGE: Record<number, string> = {
  400: "درخواست نامعتبر است",
  401: "نشست شما تمام شده؛ دوباره وارد شوید",
  403: "به این بخش دسترسی ندارید",
  404: "پیدا نشد",
  409: "این مورد همین الان تغییر کرد؛ صفحه را تازه کنید",
  422: "اطلاعات واردشده درست نیست",
  429: "سرور شلوغ است؛ چند لحظه بعد دوباره امتحان می‌کنیم",
};
const SERVER_ERROR = "خطای سرور؛ کمی بعد دوباره امتحان کنید";
const NETWORK_ERROR = "اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید";
const TIMEOUT_ERROR = "پاسخ سرور طول کشید؛ دوباره امتحان کنید";

/** Called when the backend says the session is gone (401), so the app can log out. */
const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(fn: () => void) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

type Query = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON, or as multipart when it is a FormData (file uploads). */
  body?: unknown;
  /** Added to the URL, properly encoded; empty values are skipped. */
  query?: Query;
  signal?: AbortSignal;
  /** Override the default timeout (uploads take longer). */
  timeoutMs?: number;
  /**
   * Same key on every retry of one action (e.g. paying for one cart), so the
   * backend runs it once even if the request is sent again after a 429 or a
   * dropped connection. Sent as the Idempotency-Key header.
   */
  idempotencyKey?: string;
  /** Don't fire the global 401 handler (e.g. for the "who am I" probe). */
  silent401?: boolean;
};

/** Build `${API_URL}${path}?query` with every value URL-encoded. */
function buildUrl(path: string, query?: Query) {
  if (!path.startsWith("/")) throw new Error(`API path must start with "/": ${path}`);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

/** Seconds from a Retry-After header (number of seconds or an HTTP date), capped at 2 minutes. */
function retryAfterOf(res: Response) {
  const h = res.headers.get("Retry-After");
  if (!h) return res.status === 429 ? 5 : undefined;
  const secs = /^\d+$/.test(h) ? Number(h) : Math.ceil((Date.parse(h) - Date.now()) / 1000);
  return Number.isFinite(secs) ? Math.min(120, Math.max(1, secs)) : 5;
}

/** A fresh key for one action that may be retried (see `idempotencyKey`). */
export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Call the backend and return the parsed JSON (undefined for 204).
 * Throws ApiError with a user-facing Persian message on any failure.
 */
export async function http<T>(path: string, { method = "GET", body, query, signal, silent401, timeoutMs = API_TIMEOUT_MS, idempotencyKey }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  // Multipart: the browser sets Content-Type with the boundary itself.
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  if (method !== "GET") {
    const csrf = readCookie("csrf_token");
    if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  signal?.addEventListener("abort", () => timeout.abort(), { once: true });

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      credentials: "include",
      cache: "no-store",
      signal: timeout.signal,
    });
  } catch (ex) {
    const aborted = (ex as Error).name === "AbortError";
    throw new ApiError(aborted && !signal?.aborted ? TIMEOUT_ERROR : NETWORK_ERROR, 0);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && !silent401) unauthorizedListeners.forEach((fn) => fn());
    const message = typeof data?.message === "string" && data.message ? data.message : STATUS_MESSAGE[res.status] ?? SERVER_ERROR;
    const code = typeof data?.code === "string" ? data.code : res.status === 429 ? "RATE_LIMITED" : undefined;
    throw new ApiError(message, res.status, code, retryAfterOf(res));
  }
  return data as T;
}
