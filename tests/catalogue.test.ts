import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoopItemSchema, CatalogueSchema, type LoopItem } from "../src/types/catalogue";
import {
  getLoopBySlug,
  getLoopsByCategory,
  getLoopsByMood,
  getLoopsByTag,
  getCategories,
  getMoods,
} from "../src/lib/catalogue/loader";
import { formatDuration, formatFileSize, getAspectRatioClass } from "../src/lib/media/format";
import { playbackCoordinator } from "../src/lib/playback/coordinator";

const mockLoop1: LoopItem = {
  id: "bloom-123",
  slug: "bloom",
  title: "Golden Bloom",
  description: "A flower blooming continuously",
  category: "nature",
  mood: "ethereal",
  tags: ["nature", "flower", "gold"],
  creator: "Loopscape Studio",
  license: "CC BY 4.0",
  duration_seconds: 5.25,
  width: 1920,
  height: 1080,
  aspect_ratio: 1.778,
  poster: "/media/posters/bloom-123.jpg",
  webm: "/media/webm/bloom-123.webm",
  mp4: "/media/mp4/bloom-123.mp4",
  gif: "/media/gifs/bloom-123.gif",
  poster_bytes: 45000,
  webm_bytes: 350000,
  mp4_bytes: 450000,
  gif_bytes: 2500000,
  published_at: "2026-11-18T00:00:00Z",
};

const mockLoop2: LoopItem = {
  id: "pulse-456",
  slug: "pulse",
  title: "Friday Pulse",
  description: "Kinetic pulses",
  category: "abstract",
  mood: "kinetic",
  tags: ["motion", "rhythm"],
  creator: "Loopscape Studio",
  license: "CC BY 4.0",
  duration_seconds: 6.0,
  width: 1080,
  height: 1080,
  aspect_ratio: 1.0,
  poster: "/media/posters/pulse-456.jpg",
  webm: "/media/webm/pulse-456.webm",
  mp4: "/media/mp4/pulse-456.mp4",
};

describe("Catalogue Zod Schemas", () => {
  it("validates a valid loop item", () => {
    const res = LoopItemSchema.safeParse(mockLoop1);
    expect(res.success).toBe(true);
  });

  it("fails when required fields are missing", () => {
    const res = LoopItemSchema.safeParse({ id: "test" });
    expect(res.success).toBe(false);
  });

  it("validates an entire catalogue", () => {
    const cat = {
      schema_version: 1,
      generated_at: "2026-11-18T00:00:00Z",
      items: [mockLoop1, mockLoop2],
    };
    const res = CatalogueSchema.safeParse(cat);
    expect(res.success).toBe(true);
  });
});

describe("Catalogue Helper Functions", () => {
  const items = [mockLoop1, mockLoop2];

  it("gets loop by slug", () => {
    expect(getLoopBySlug(items, "bloom")?.id).toBe("bloom-123");
    expect(getLoopBySlug(items, "non-existent")).toBeUndefined();
  });

  it("filters loops by category", () => {
    const nature = getLoopsByCategory(items, "nature");
    expect(nature.length).toBe(1);
    expect(nature[0]?.id).toBe("bloom-123");
  });

  it("filters loops by mood", () => {
    const kinetic = getLoopsByMood(items, "kinetic");
    expect(kinetic.length).toBe(1);
    expect(kinetic[0]?.id).toBe("pulse-456");
  });

  it("filters loops by tag", () => {
    const tagged = getLoopsByTag(items, "flower");
    expect(tagged.length).toBe(1);
    expect(tagged[0]?.id).toBe("bloom-123");
  });

  it("extracts unique categories and moods", () => {
    expect(getCategories(items)).toEqual(["abstract", "nature"]);
    expect(getMoods(items)).toEqual(["ethereal", "kinetic"]);
  });
});

describe("Media Formatting Utilities", () => {
  it("formats seconds to readable duration", () => {
    expect(formatDuration(5.2)).toBe("5s");
    expect(formatDuration(65.4)).toBe("1:05");
    expect(formatDuration(120)).toBe("2:00");
  });

  it("formats bytes to readable size", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1024 * 10)).toBe("10.0 KB");
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("returns aspect ratio class", () => {
    expect(getAspectRatioClass(1.778)).toBe("aspect-video");
    expect(getAspectRatioClass(1.0)).toBe("aspect-square");
    expect(getAspectRatioClass(0.75)).toBe("aspect-[3/4]");
  });
});

describe("Playback Coordinator Limits", () => {
  beforeEach(() => {
    playbackCoordinator.pauseAll();
  });

  it("tracks registration and pauseAll", () => {
    const mockElement = {
      paused: true,
      muted: false,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    } as unknown as HTMLVideoElement;

    playbackCoordinator.register("test-1", mockElement);
    expect(playbackCoordinator.getActiveCount()).toBe(0);

    playbackCoordinator.unregister("test-1");
  });
});
