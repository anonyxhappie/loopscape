import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";

export function Favorites() {
  const { items, loading } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteItems = useMemo(
    () => items.filter((item) => favorites.includes(item.id)),
    [items, favorites],
  );

  return (
    <Shell className="py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Favorites</h1>
      <p className="mt-2 text-sm text-muted">
        {favoriteItems.length} saved loop{favoriteItems.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-8">
        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <div className="shimmer rounded-2xl" style={{ paddingBottom: "65%" }} />
              </div>
            ))}
          </div>
        ) : favoriteItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart size={48} className="text-muted/30" />
            <p className="mt-4 text-lg text-muted">No favorites yet</p>
            <p className="mt-1 text-sm text-muted/60">Heart a loop to save it here</p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-background"
            >
              Explore loops
            </Link>
          </div>
        ) : (
          <Gallery items={favoriteItems} favorites={favorites} onToggleFavorite={toggleFavorite} />
        )}
      </div>
    </Shell>
  );
}
