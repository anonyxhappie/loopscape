import { Shell } from "./Shell";

export function Footer() {
  return (
    <footer className="border-t border-line mt-20">
      <Shell className="flex flex-col sm:flex-row justify-between gap-4 py-8 text-xs text-muted">
        <span className="text-foreground/80 font-medium">↗ loopscape</span>
        <span>Made for the love of things in motion.</span>
        <span>© {new Date().getFullYear()} Loopscape</span>
      </Shell>
    </footer>
  );
}
