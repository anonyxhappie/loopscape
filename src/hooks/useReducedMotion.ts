import { useState, useEffect } from "react";
import { getPreferences } from "@/lib/storage/preferences";

export function useReducedMotion(): boolean {
  const [systemReduced, setSystemReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [override] = useState(() => {
    if (typeof window === "undefined") return false;
    return getPreferences().reducedMotionOverride;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return systemReduced || override;
}
