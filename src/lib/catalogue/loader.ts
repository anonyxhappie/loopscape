import { CatalogueSchema, type Catalogue, type LoopItem } from "@/types/catalogue";

let cachedCatalogue: Catalogue | null = null;

export async function loadCatalogue(): Promise<Catalogue> {
  if (cachedCatalogue) return cachedCatalogue;

  const response = await fetch("/data/catalogue.json");
  if (!response.ok) {
    throw new Error(`Failed to load catalogue: ${response.status}`);
  }

  const raw = await response.json();
  const result = CatalogueSchema.safeParse(raw);

  if (!result.success) {
    console.error("Catalogue validation errors:", result.error.issues);
    throw new Error("Catalogue validation failed");
  }

  cachedCatalogue = result.data;
  return result.data;
}

export function getLoopBySlug(items: LoopItem[], slug: string): LoopItem | undefined {
  return items.find((item) => item.slug === slug);
}

export function getLoopsByCategory(items: LoopItem[], category: string): LoopItem[] {
  return items.filter((item) => item.category.toLowerCase() === category.toLowerCase());
}

export function getLoopsByMood(items: LoopItem[], mood: string): LoopItem[] {
  return items.filter((item) => item.mood.toLowerCase() === mood.toLowerCase());
}

export function getLoopsByTag(items: LoopItem[], tag: string): LoopItem[] {
  return items.filter((item) => item.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
}

export function getCategories(items: LoopItem[]): string[] {
  return [...new Set(items.map((item) => item.category))].sort();
}

export function getMoods(items: LoopItem[]): string[] {
  return [...new Set(items.map((item) => item.mood).filter(Boolean))].sort();
}

export function getTags(items: LoopItem[]): string[] {
  return [...new Set(items.flatMap((item) => item.tags))].sort();
}
