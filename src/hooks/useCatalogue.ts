import { useState, useEffect, useCallback } from "react";
import { loadCatalogue } from "@/lib/catalogue/loader";
import { getAllUserUploads, userUploadToLoopItem } from "@/lib/storage/uploads";
import type { LoopItem } from "@/types/catalogue";

type CatalogueState = {
  items: LoopItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useCatalogue(): CatalogueState {
  const [state, setState] = useState<{
    items: LoopItem[];
    loading: boolean;
    error: string | null;
  }>({
    items: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const [catalogue, uploads] = await Promise.all([
        loadCatalogue(),
        getAllUserUploads(),
      ]);

      const userItems = uploads.map(userUploadToLoopItem);
      // Put user's own uploads first, followed by curated library
      setState({
        items: [...userItems, ...catalogue.items],
        loading: false,
        error: null,
      });
    } catch (err) {
      // Fallback: try loading catalogue alone if uploads fail
      try {
        const catalogue = await loadCatalogue();
        setState({ items: catalogue.items, loading: false, error: null });
      } catch (innerErr) {
        setState({ items: [], loading: false, error: String(innerErr || err) });
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    refresh().catch((err) => {
      if (!cancelled) {
        setState({ items: [], loading: false, error: String(err) });
      }
    });

    const handleUploadChange = () => {
      if (!cancelled) {
        refresh();
      }
    };

    window.addEventListener("loopscape:upload", handleUploadChange);
    window.addEventListener("loopscape:upload-deleted", handleUploadChange);

    return () => {
      cancelled = true;
      window.removeEventListener("loopscape:upload", handleUploadChange);
      window.removeEventListener("loopscape:upload-deleted", handleUploadChange);
    };
  }, [refresh]);

  return { ...state, refresh };
}
