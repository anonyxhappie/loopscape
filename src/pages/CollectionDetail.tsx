import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { getCollectionById, type UserCollection } from "@/lib/storage/indexeddb";

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { items, loading: catLoading } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();

  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCollectionById(id).then((col) => {
      setCollection(col);
      setLoading(false);
    });
  }, [id]);

  const collectionItems = useMemo(() => {
    if (!collection) return [];
    return items.filter((item) => collection.loopIds.includes(item.id));
  }, [items, collection]);

  if (loading || catLoading) {
    return (
      <Shell className="py-10">
        <div className="shimmer h-20 max-w-sm rounded-xl mb-8" />
        <div className="masonry-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="masonry-item">
              <div className="shimmer rounded-2xl" style={{ paddingBottom: "60%" }} />
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (!collection) {
    return (
      <Shell className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-semibold">Collection not found</h1>
        <Link to="/collections" className="mt-6 text-sm text-lime hover:underline">
          ← Back to collections
        </Link>
      </Shell>
    );
  }

  return (
    <Shell className="py-10 sm:py-14">
      <Link
        to="/collections"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back to collections
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{collection.name}</h1>
        {collection.description && (
          <p className="mt-2 text-sm text-muted">{collection.description}</p>
        )}
        <p className="mt-1 text-xs text-muted/60">
          {collectionItems.length} loop{collectionItems.length !== 1 ? "s" : ""}
        </p>
      </div>

      {collectionItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg text-muted">This collection is empty</p>
          <p className="mt-1 text-sm text-muted/60">
            Browse loops and click &quot;Add to Collection&quot; on any loop detail page.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-background"
          >
            Explore loops
          </Link>
        </div>
      ) : (
        <Gallery
          items={collectionItems}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </Shell>
  );
}
