import { useState, useCallback } from "react";
import { getFavorites, toggleFavorite as toggle } from "@/lib/storage/local";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());

  const toggleFavorite = useCallback((id: string) => {
    const updated = toggle(id);
    setFavorites(updated);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
