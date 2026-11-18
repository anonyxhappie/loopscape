import { useState, useCallback } from "react";
import { getPreferences, updatePreferences, type UserPreferences } from "@/lib/storage/preferences";

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => getPreferences());

  const update = useCallback((partial: Partial<UserPreferences>) => {
    const updated = updatePreferences(partial);
    setPreferences(updated);
  }, []);

  return { preferences, updatePreferences: update };
}
