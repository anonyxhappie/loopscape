import { getItem, setItem } from "./local";

export type UserPreferences = {
  autoplayPreviews: boolean;
  reducedMotionOverride: boolean;
  preferredFormat: "auto" | "webm" | "mp4";
  gridDensity: "comfortable" | "compact";
};

const DEFAULT_PREFERENCES: UserPreferences = {
  autoplayPreviews: true,
  reducedMotionOverride: false,
  preferredFormat: "auto",
  gridDensity: "comfortable",
};

export function getPreferences(): UserPreferences {
  return getItem<UserPreferences>("preferences", DEFAULT_PREFERENCES);
}

export function updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const updated = { ...current, ...partial };
  setItem("preferences", updated);
  return updated;
}
