"use client";
/**
 * App-wide engine setup: data cache (React Query), the light/dark theme on
 * <html>, keeping the client session in line with the server, and capturing
 * recent pages and errors for support reports. Wrap each
 * site's UI providers in this.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMe } from "@/engine/api";
import { USE_MOCK } from "@/engine/config";
import { onUnauthorized } from "@/engine/http";
import { useSession } from "@/engine/store";
import { useDiagnosticsCapture } from "@/engine/support/diagnostics";

/**
 * The persisted session is only a cache. On load we ask the server who is
 * signed in (the httpOnly cookie decides) and replace or clear the cached
 * user; any 401 later logs the user out.
 */
function useServerSession(queryClient: QueryClient) {
  useEffect(() => {
    if (USE_MOCK) return;
    const clear = () => {
      const s = useSession.getState();
      if (s.user) s.setUser(null);
      queryClient.clear();
    };
    const off = onUnauthorized(clear);
    getMe()
      .then((me) => {
        const s = useSession.getState();
        if (!me) return clear();
        s.setUser(me, me.roles.includes(s.role!) ? s.role : me.roles[0], s.loginMethod);
      })
      .catch(() => undefined); // offline: keep the cached session until a request fails
    return () => {
      off();
    };
  }, [queryClient]);
}

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Retry network and server errors twice and "busy" (429) three times, waiting as long as the
          // server asks; never retry other 4xx (auth, validation, not found).
          queries: {
            staleTime: 15_000,
            retry: (count, err) => {
              const status = (err as { status?: number }).status ?? 0;
              if (status === 429) return count < 3;
              return count < 2 && (status === 0 || status >= 500);
            },
            retryDelay: (count, err) => {
              const after = (err as { retryAfter?: number }).retryAfter;
              return after ? after * 1000 : Math.min(8_000, 1_000 * 2 ** count);
            },
          },
        },
      }),
  );
  const theme = useSession((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useServerSession(queryClient);
  useDiagnosticsCapture();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
