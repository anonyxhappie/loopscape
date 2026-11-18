import { z } from "zod";

export const LoopItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default("uncategorized"),
  mood: z.string().default(""),
  tags: z.array(z.string()).default([]),
  creator: z.string().default(""),
  license: z.string().default(""),
  duration_seconds: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspect_ratio: z.number().positive(),
  poster: z.string().min(1),
  mp4: z.string().min(1),
  webm: z.string().optional(),
  gif: z.string().optional(),
  poster_bytes: z.number().int().positive().optional(),
  webm_bytes: z.number().int().positive().optional(),
  mp4_bytes: z.number().int().positive().optional(),
  gif_bytes: z.number().int().positive().optional(),
  published_at: z.string().optional(),
});

export const CatalogueSchema = z.object({
  schema_version: z.number().int().positive(),
  generated_at: z.string(),
  items: z.array(LoopItemSchema),
});

export type LoopItem = z.infer<typeof LoopItemSchema>;
export type Catalogue = z.infer<typeof CatalogueSchema>;

export type MoodConfig = {
  slug: string;
  name: string;
  emoji: string;
  color: string;
};
