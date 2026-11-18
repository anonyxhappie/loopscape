import { useState, useEffect, useCallback } from "react";
import {
  getAllCollections,
  saveCollection,
  deleteCollection,
  addLoopToCollection,
  removeLoopFromCollection,
  type UserCollection,
} from "@/lib/storage/indexeddb";

export function useCollections() {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await getAllCollections();
    setCollections(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCollection = useCallback(
    async (name: string, description: string = "", initialLoopIds: string[] = []) => {
      const newCol: UserCollection = {
        id: "col-" + Math.random().toString(36).substring(2, 9),
        name,
        description,
        loopIds: initialLoopIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCollection(newCol);
      await refresh();
      return newCol;
    },
    [refresh],
  );

  const removeCollection = useCallback(
    async (id: string) => {
      await deleteCollection(id);
      await refresh();
    },
    [refresh],
  );

  const toggleLoopInCollection = useCallback(
    async (collectionId: string, loopId: string) => {
      const col = collections.find((c) => c.id === collectionId);
      if (!col) return;
      if (col.loopIds.includes(loopId)) {
        await removeLoopFromCollection(collectionId, loopId);
      } else {
        await addLoopToCollection(collectionId, loopId);
      }
      await refresh();
    },
    [collections, refresh],
  );

  return {
    collections,
    loading,
    refresh,
    createCollection,
    removeCollection,
    toggleLoopInCollection,
  };
}
