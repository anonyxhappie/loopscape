import { useState, useEffect, useCallback } from "react";
import {
  getAllUserUploads,
  saveUserUpload,
  deleteUserUpload,
  userUploadToLoopItem,
  type UserUpload,
} from "@/lib/storage/uploads";
import type { LoopItem } from "@/types/catalogue";

export function useUserUploads() {
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [items, setItems] = useState<LoopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUploads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUserUploads();
      setUploads(data);
      setItems(data.map(userUploadToLoopItem));
    } catch (e) {
      console.warn("Failed to load user uploads:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();

    const handleChange = () => fetchUploads();
    window.addEventListener("loopscape:upload", handleChange);
    window.addEventListener("loopscape:upload-deleted", handleChange);

    return () => {
      window.removeEventListener("loopscape:upload", handleChange);
      window.removeEventListener("loopscape:upload-deleted", handleChange);
    };
  }, [fetchUploads]);

  const addUpload = useCallback(async (upload: UserUpload) => {
    await saveUserUpload(upload);
  }, []);

  const removeUpload = useCallback(async (id: string) => {
    await deleteUserUpload(id);
  }, []);

  return {
    uploads,
    items,
    loading,
    addUpload,
    removeUpload,
    refresh: fetchUploads,
  };
}
