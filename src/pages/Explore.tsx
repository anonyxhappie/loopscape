import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { Share2, Check } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { FilterBar } from "@/features/discovery/FilterBar";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { getCategories } from "@/lib/catalogue/loader";

export function Explore() {
  const { items, loading, error } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeMood, setActiveMood] = useState(searchParams.get("mood") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const [copied, setCopied] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeMood) params.set("mood", activeMood);
    if (activeCategory) params.set("category", activeCategory);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeMood, activeCategory, setSearchParams]);

  const categories = useMemo(() => getCategories(items), [items]);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "description", "tags", "mood", "category", "creator"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items],
  );

  const filtered = useMemo(() => {
    let results = searchQuery
      ? fuse.search(searchQuery).map((r) => r.item)
      : [...items];

    if (activeMood) {
      results = results.filter((item) => item.mood.toLowerCase() === activeMood.toLowerCase());
    }
    if (activeCategory) {
      results = results.filter((item) => item.category.toLowerCase() === activeCategory.toLowerCase());
    }

    return results;
  }, [items, fuse, searchQuery, activeMood, activeCategory]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = "Loopscape — Explore Loops";
    let shareText = "Check out these curated looping visuals on Loopscape!";
    if (activeMood) shareText = `Explore ${activeMood} loops on Loopscape!`;
    if (activeCategory) shareText = `Explore ${activeCategory} loops on Loopscape!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if native share sheet is cancelled or fails
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy URL:", err);
    }
  };

  return (
    <Shell className="py-10 sm:py-14">
      {/* Header with Share link action */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore</h1>
          <p className="mt-2 text-sm text-muted">
            {loading ? "Loading..." : `${filtered.length} loop${filtered.length !== 1 ? "s" : ""}`}
            {activeMood && (
              <span>
                {" "}· Mood: <strong className="capitalize text-foreground">{activeMood}</strong>
              </span>
            )}
            {activeCategory && (
              <span>
                {" "}· Category: <strong className="capitalize text-foreground">{activeCategory}</strong>
              </span>
            )}
            {searchQuery && (
              <span>
                {" "}· Search: &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
              </span>
            )}
          </p>
        </div>

        {/* Share Link button */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-lime/40 hover:text-lime self-start sm:self-auto shadow-sm"
          aria-label="Share explore link"
          title="Share explore link"
        >
          {copied ? <Check size={14} className="text-lime" /> : <Share2 size={14} />}
          <span>{copied ? "Link Copied!" : "Share Link"}</span>
        </button>
      </div>

      <div className="mb-8">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeMood={activeMood}
          onMoodChange={setActiveMood}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categories}
        />
      </div>

      {error ? (
        <p className="py-20 text-center text-sm text-red-400">Failed to load catalogue</p>
      ) : loading ? (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="masonry-item">
              <div className="shimmer rounded-2xl" style={{ paddingBottom: `${55 + (i % 4) * 12}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <Gallery items={filtered} favorites={favorites} onToggleFavorite={toggleFavorite} />
      )}
    </Shell>
  );
}
