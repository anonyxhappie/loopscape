import { Link } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";

export function NotFound() {
  return (
    <Shell className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-6xl font-bold tracking-tighter text-muted/30">404</h1>
      <p className="mt-4 text-lg text-muted">This page doesn&apos;t exist</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-background"
      >
        Go home
      </Link>
    </Shell>
  );
}
