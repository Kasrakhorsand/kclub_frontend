"use client";
import { EngineProvider } from "@/engine/EngineProvider";
import { ToastHost } from "@/ui/kit/Toast";
import { Icon3DDefs } from "@/ui/kit/Icon3D";

/** K Club client providers: the engine (data, theme) plus toasts and 3D icon gradients. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EngineProvider>
      <Icon3DDefs />
      {children}
      <ToastHost />
    </EngineProvider>
  );
}
