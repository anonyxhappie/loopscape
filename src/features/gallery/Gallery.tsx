import { LoopCard } from "./LoopCard";
import type { LoopItem } from "@/types/catalogue";

type GalleryProps = {
  items: LoopItem[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
};

export function Gallery({ items, favorites, onToggleFavorite }: GalleryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-muted">No loops found</p>
        <p className="mt-2 text-sm text-muted/60">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {items.map((item) => (
        <LoopCard
          key={item.id}
          item={item}
          isFavorite={favorites.includes(item.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
