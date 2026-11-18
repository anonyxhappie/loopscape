import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { getLoopsByCategory } from "@/lib/catalogue/loader";

export function CategoryView() {
  const { category = "" } = useParams<{ category: string }>();
  const { items, loading } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();

  const filtered = useMemo(() => {
    return getLoopsByCategory(items, category);
  }, [items, category]);

  return (
    <Shell className="py-10 sm:py-14">
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back to explore
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold capitalize tracking-tight sm:text-4xl">
          {category}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {filtered.length} loop{filtered.length !== 1 ? "s" : ""} in this category
        </p>
      </div>

      {loading ? (
        <div className="masonry-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="masonry-item">
              <div className="shimmer rounded-2xl" style={{ paddingBottom: "60%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-muted">No loops found in category &quot;{category}&quot;</p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-background"
          >
            Explore all loops
          </Link>
        </div>
      ) : (
        <Gallery items={filtered} favorites={favorites} onToggleFavorite={toggleFavorite} />
      )}
    </Shell>
  );
}
