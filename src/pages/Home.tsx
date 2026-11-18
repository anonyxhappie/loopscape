import { Link } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { MoodGrid } from "@/features/gallery/MoodGrid";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { ArrowRight } from "lucide-react";

export function Home() {
  const { items, loading } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();

  const featured = items.slice(0, 12);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <Shell className="py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.19em] text-lime">
              A moving moodboard
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-tighter sm:text-7xl lg:text-8xl">
              Motion,
              <br />
              <em className="font-serif font-normal text-pink tracking-tight">on repeat.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              A curated universe of looping visuals. Find a feeling, stay for a moment,
              and let the details move.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-bold text-background transition-transform hover:scale-105"
              >
                Explore all loops <ArrowRight size={16} />
              </Link>
              <Link
                to="/category/cats"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-medium text-foreground hover:border-lime/40 hover:text-lime transition-colors"
              >
                🐱 Cats
              </Link>
              <Link
                to="/category/memes"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-medium text-foreground hover:border-lime/40 hover:text-lime transition-colors"
              >
                🔥 Memes
              </Link>
              <Link
                to="/category/funny"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-medium text-foreground hover:border-lime/40 hover:text-lime transition-colors"
              >
                😂 Funny
              </Link>
              <Link
                to="/category/viral"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-medium text-foreground hover:border-lime/40 hover:text-lime transition-colors"
              >
                ⚡ Viral
              </Link>
            </div>
          </div>
        </Shell>
      </section>

      {/* Moods */}
      <section className="border-b border-line">
        <Shell className="py-14 sm:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.19em] text-lime">
                Choose your atmosphere
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                Explore by mood
              </h2>
            </div>
          </div>
          <MoodGrid />
        </Shell>
      </section>

      {/* Featured */}
      <Shell className="py-14 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.19em] text-lime">
              A few things in motion
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
              The loop collection
            </h2>
          </div>
          <Link to="/explore" className="text-sm text-muted hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <div className="shimmer rounded-2xl" style={{ paddingBottom: `${60 + (i % 3) * 15}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <Gallery items={featured} favorites={favorites} onToggleFavorite={toggleFavorite} />
        )}
      </Shell>
    </>
  );
}
