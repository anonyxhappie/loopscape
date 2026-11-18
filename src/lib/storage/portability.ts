import { z } from "zod";
import { getFavorites, getRecentlyViewed, setItem } from "./local";
import { getPreferences } from "./preferences";
import { getAllCollections, saveCollection, type UserCollection } from "./indexeddb";

export const ExportDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  favorites: z.array(z.string()),
  recent: z.array(z.string()),
  preferences: z.object({
    autoplayPreviews: z.boolean(),
    reducedMotionOverride: z.boolean(),
    preferredFormat: z.enum(["auto", "webm", "mp4"]),
    gridDensity: z.enum(["comfortable", "compact"]),
  }),
  collections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      loopIds: z.array(z.string()),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type ExportData = z.infer<typeof ExportDataSchema>;

export async function exportUserData(): Promise<string> {
  const collections = await getAllCollections();
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: getFavorites(),
    recent: getRecentlyViewed(),
    preferences: getPreferences(),
    collections,
  };
  return JSON.stringify(data, null, 2);
}

export async function importUserData(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = ExportDataSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid data format: " + parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { favorites, recent, preferences, collections } = parsed.data;

    setItem("favorites", favorites);
    setItem("recent", recent);
    setItem("preferences", preferences);

    for (const col of collections) {
      await saveCollection(col as UserCollection);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: "Failed to parse JSON file: " + (err instanceof Error ? err.message : String(err)),
    };
  }
}
