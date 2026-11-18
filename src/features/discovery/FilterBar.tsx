import { Search, X } from "lucide-react";
import { MOODS } from "@/lib/catalogue/moods";

type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeMood: string;
  onMoodChange: (mood: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
};

export function FilterBar({
  searchQuery,
  onSearchChange,
  activeMood,
  onMoodChange,
  activeCategory,
  onCategoryChange,
  categories,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search loops..."
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-lime/40 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mood chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onMoodChange("")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !activeMood
              ? "bg-lime text-background"
              : "border border-line text-muted hover:border-lime/30 hover:text-foreground"
          }`}
        >
          All moods
        </button>
        {MOODS.map((mood) => (
          <button
            key={mood.slug}
            onClick={() => onMoodChange(mood.slug === activeMood ? "" : mood.slug)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeMood === mood.slug
                ? "bg-lime text-background"
                : "border border-line text-muted hover:border-lime/30 hover:text-foreground"
            }`}
          >
            {mood.emoji} {mood.name}
          </button>
        ))}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              !activeCategory
                ? "bg-pink/80 text-background"
                : "border border-line text-muted hover:border-pink/30 hover:text-foreground"
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === activeCategory ? "" : cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                activeCategory === cat
                  ? "bg-pink/80 text-background"
                  : "border border-line text-muted hover:border-pink/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
