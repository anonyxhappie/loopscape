import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Tag, Share2, Download, Check, FolderPlus } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { LoopViewer } from "@/features/player/LoopViewer";
import { LoopCard } from "@/features/gallery/LoopCard";
import { MoodGrid } from "@/features/gallery/MoodGrid";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { useCollections } from "@/hooks/useCollections";
import { getLoopBySlug } from "@/lib/catalogue/loader";
import { getMoodConfig } from "@/lib/catalogue/moods";
import { addRecentlyViewed } from "@/lib/storage/local";
import { formatFileSize } from "@/lib/media/format";

export function LoopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { items, loading } = useCatalogue();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { collections, createCollection, toggleLoopInCollection } = useCollections();

  const [copied, setCopied] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [newColName, setNewColName] = useState("");

  const item = useMemo(() => (slug ? getLoopBySlug(items, slug) : undefined), [items, slug]);

  useEffect(() => {
    if (item) addRecentlyViewed(item.id);
  }, [item]);

  // Instantly scroll to top whenever slug or loop changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [slug]);

  const related = useMemo(() => {
    if (!item) return [];
    return items
      .filter(
        (i) =>
          i.id !== item.id &&
          (i.mood === item.mood || i.category === item.category),
      )
      .slice(0, 4);
  }, [items, item]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAndAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !item) return;
    await createCollection(newColName.trim(), "", [item.id]);
    setNewColName("");
    setShowCollectionMenu(false);
  };

  if (loading) {
    return (
      <Shell className="py-10">
        <div className="shimmer mx-auto max-w-4xl rounded-2xl" style={{ paddingBottom: "56%" }} />
      </Shell>
    );
  }

  if (!item) {
    return (
      <Shell className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-2xl font-semibold">Loop not found</h1>
        <p className="mt-2 text-muted">The loop you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/explore" className="mt-6 text-sm text-lime hover:underline">
          ← Back to explore
        </Link>
      </Shell>
    );
  }

  return (
    <Shell className="py-10 sm:py-14">
      {/* Top back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to explore
        </Link>

        {/* Share button */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-lime/40"
        >
          {copied ? <Check size={14} className="text-lime" /> : <Share2 size={14} />}
          <span>{copied ? "Link Copied!" : "Share Loop"}</span>
        </button>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Visual player */}
        <LoopViewer
          item={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={toggleFavorite}
        />

        {/* Details & Metadata */}
        <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_300px]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h1>
            {item.description && (
              <p className="mt-3 text-base leading-relaxed text-muted">{item.description}</p>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-surface/50 px-3 py-1 text-xs text-muted hover:border-lime/30 hover:text-foreground transition-colors"
                  >
                    <Tag size={10} /> {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Collections dropdown button */}
            <div className="relative mt-6">
              <button
                onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-medium text-muted hover:border-lime/30 hover:text-foreground transition-colors"
              >
                <FolderPlus size={15} /> Add to Collection
              </button>

              {showCollectionMenu && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-line bg-panel p-3 shadow-2xl z-20">
                  <p className="text-xs font-semibold text-muted mb-2">My Collections</p>
                  {collections.length === 0 ? (
                    <p className="text-xs text-muted/60 mb-3">No collections yet</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                      {collections.map((col) => {
                        const inCol = col.loopIds.includes(item.id);
                        return (
                          <button
                            key={col.id}
                            onClick={() => toggleLoopInCollection(col.id, item.id)}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left hover:bg-surface transition-colors"
                          >
                            <span className="truncate">{col.name}</span>
                            {inCol && <Check size={12} className="text-lime shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <form onSubmit={handleCreateAndAddCollection} className="flex gap-1.5 pt-2 border-t border-line">
                    <input
                      type="text"
                      placeholder="New collection name..."
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="flex-1 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-lime px-2.5 py-1 text-xs font-semibold text-background"
                    >
                      Create
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Download options: GIF only */}
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Download
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={item.gif || `/media/gifs/${item.id}.gif`}
                  download={`${item.slug}.gif`}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-background transition-transform hover:scale-105 shadow-lg shadow-lime/10"
                >
                  <Download size={16} /> Download GIF
                  {item.gif_bytes && (
                    <span className="rounded-md bg-background/20 px-2 py-0.5 text-xs font-medium">
                      {formatFileSize(item.gif_bytes)}
                    </span>
                  )}
                </a>
                <a
                  href={item.poster}
                  download={`${item.slug}-poster.jpg`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-medium text-muted hover:border-lime/40 hover:text-foreground transition-colors"
                >
                  <Download size={13} /> Still Frame (JPG)
                </a>
              </div>
            </div>
          </div>

          {/* Technical sidebar */}
          <div className="space-y-4 rounded-xl border border-line bg-panel p-5 text-sm h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Metadata
            </h2>
            {item.mood && (
              <div className="flex justify-between border-b border-line/50 pb-2">
                <span className="text-muted">Mood</span>
                <span className="flex items-center gap-1.5 capitalize">
                  {getMoodConfig(item.mood)?.emoji && (
                    <span>{getMoodConfig(item.mood)?.emoji}</span>
                  )}
                  <span>{item.mood}</span>
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="text-muted">Category</span>
              <span className="capitalize">{item.category}</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="text-muted">Dimensions</span>
              <span>{item.width}×{item.height}</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="text-muted">Aspect ratio</span>
              <span>{item.aspect_ratio}:1</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="text-muted">Format</span>
              <span>Animated GIF / Loop</span>
            </div>
            {item.gif_bytes && (
              <div className="flex justify-between border-b border-line/50 pb-2">
                <span className="text-muted">GIF size</span>
                <span>{formatFileSize(item.gif_bytes)}</span>
              </div>
            )}
            {item.creator && (
              <div className="flex justify-between border-b border-line/50 pb-2">
                <span className="text-muted">Creator</span>
                <span>{item.creator}</span>
              </div>
            )}
            {item.license && (
              <div className="flex justify-between">
                <span className="text-muted">License</span>
                <span className="text-right text-xs max-w-[150px] truncate">{item.license}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related loops */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 text-xl font-medium tracking-tight">Related loops</h2>
          <div className="masonry-grid">
            {related.map((r) => (
              <LoopCard
                key={r.id}
                item={r}
                isFavorite={favorites.includes(r.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Explore other moods bottom list */}
      <div className="mt-20 border-t border-line pt-12">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.19em] text-lime">
            Atmosphere
          </p>
          <h2 className="mt-2 text-xl font-medium tracking-tight">
            Explore more moods
          </h2>
        </div>
        <MoodGrid />
      </div>
    </Shell>
  );
}
