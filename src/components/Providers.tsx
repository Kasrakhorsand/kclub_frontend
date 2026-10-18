"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { ToastHost } from "./ui/Toast";
import { Icon3DDefs } from "./ui/Icon3D";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } }));
  const theme = useSession((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <QueryClientProvider client={qc}>
      <Icon3DDefs />
      {children}
      <ToastHost />
    </QueryClientProvider>
  );
}
