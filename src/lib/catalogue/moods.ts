import type { MoodConfig } from "@/types/catalogue";

export const MOODS: MoodConfig[] = [
  { slug: "calm", name: "Calm", emoji: "☁", color: "#7ec8e3" },
  { slug: "kinetic", name: "Kinetic", emoji: "↝", color: "#f0a6c8" },
  { slug: "cozy", name: "Cozy", emoji: "⌂", color: "#f5c27a" },
  { slug: "glitch", name: "Glitch", emoji: "▧", color: "#c084fc" },
  { slug: "geometric", name: "Geometric", emoji: "◌", color: "#6ee7b7" },
  { slug: "ethereal", name: "Ethereal", emoji: "✳", color: "#d6f36a" },
  { slug: "noir", name: "Noir", emoji: "◉", color: "#9ca3af" },
  { slug: "lofi", name: "Lofi", emoji: "♫", color: "#f9a8d4" },
];

export function getMoodConfig(slug: string): MoodConfig | undefined {
  return MOODS.find((m) => m.slug === slug);
}
