import type { ReactNode } from "react";

export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-[min(1440px,calc(100%-48px))] ${className}`}>
      {children}
    </div>
  );
}
