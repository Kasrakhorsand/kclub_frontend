"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { ToastHost } from "./ui/Toast";
import { Icon3DDefs } from "./ui/Icon3D";

/** App-wide client providers: React Query, theme attribute on <html>, toasts and 3D icon gradients. */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } }));
  const theme = useSession((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <QueryClientProvider client={queryClient}>
      <Icon3DDefs />
      {children}
      <ToastHost />
    </QueryClientProvider>
  );
}
