import { Link, useLocation } from "react-router-dom";
import { Shell } from "./Shell";
import { Search, Heart, Folder } from "lucide-react";

export function Header() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-foreground font-medium"
      : "text-muted hover:text-foreground";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur-xl">
      <Shell className="flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tighter"
          aria-label="Loopscape home"
        >
          <span className="grid h-7 w-7 -rotate-6 place-items-center rounded-lg border-[1.5px] border-lime text-lime text-sm">
            ↗
          </span>
          <span>loopscape</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm" aria-label="Main navigation">
          <Link to="/explore" className={`transition-colors ${isActive("/explore")}`}>
            Explore
          </Link>
          <Link
            to="/favorites"
            className={`flex items-center gap-1.5 transition-colors ${isActive("/favorites")}`}
          >
            <Heart size={14} />
            <span className="hidden sm:inline">Favorites</span>
          </Link>
          <Link
            to="/collections"
            className={`flex items-center gap-1.5 transition-colors ${isActive("/collections")}`}
          >
            <Folder size={14} />
            <span className="hidden sm:inline">Collections</span>
          </Link>
          <Link
            to="/explore"
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted hover:border-lime/40 hover:text-foreground transition-colors"
            aria-label="Search loops"
          >
            <Search size={15} />
          </Link>
        </nav>
      </Shell>
    </header>
  );
}
