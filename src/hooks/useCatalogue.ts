import { useState, useEffect } from "react";
import { loadCatalogue } from "@/lib/catalogue/loader";
import type { LoopItem } from "@/types/catalogue";

type CatalogueState = {
  items: LoopItem[];
  loading: boolean;
  error: string | null;
};

export function useCatalogue(): CatalogueState {
  const [state, setState] = useState<CatalogueState>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    loadCatalogue()
      .then((catalogue) => {
        if (!cancelled) {
          setState({ items: catalogue.items, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ items: [], loading: false, error: String(err) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
