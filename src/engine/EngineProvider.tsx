"use client";
/** Data cache (React Query) and the light/dark theme attribute on <html>. Wrap each site's UI providers in this. */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "@/engine/store";

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } }));
  const theme = useSession((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
