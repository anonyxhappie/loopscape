import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Heart, Download } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import type { LoopItem } from "@/types/catalogue";

type LoopCardProps = {
  item: LoopItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export const LoopCard = memo(function LoopCard({
  item,
  isFavorite,
  onToggleFavorite,
}: LoopCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const documentVisible = useDocumentVisibility();
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const gifUrl = item.gif || `/media/gifs/${item.id}.gif`;

  // Pause immediately if window loses focus / tab hidden
  useEffect(() => {
    if (!documentVisible || reducedMotion) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [documentVisible, reducedMotion]);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion) return;
    setIsHovered(true);

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.debug("Video hover play caught:", err);
          setIsPlaying(false);
        });
    }
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPlaying(false);

    const video = videoRef.current;
    if (video) {
      video.pause();
      try {
        video.currentTime = 0; // reset to beginning for true GIF feel
      } catch {
        // ignore if not ready
      }
    }
  }, []);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite(item.id);
    },
    [item.id, onToggleFavorite],
  );

  const handleDownloadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const aspectPadding = `${(item.height / item.width) * 100}%`;

  return (
    <div
      className="masonry-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={`/loop/${item.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-line bg-panel transition-all duration-300 hover:border-lime/40 hover:shadow-xl hover:shadow-lime/5"
      >
        {/* Media container */}
        <div
          className="relative w-full overflow-hidden bg-surface"
          style={{ paddingBottom: aspectPadding }}
        >
          {/* Static poster displayed until hovered */}
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 pointer-events-none ${
              isHovered && isPlaying ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Video preview: plays seamlessly on hover */}
          {!reducedMotion && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster={item.poster}
              src={item.mp4}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                isHovered && isPlaying ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {/* Prominent GIF Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-black tracking-widest text-white/90 backdrop-blur-md border border-white/10 transition-colors group-hover:border-lime/50 group-hover:text-lime">
            <span>GIF</span>
            {isPlaying && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
              </span>
            )}
          </div>

          {/* Quick action buttons (top right) */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            {/* Quick GIF Download button */}
            <a
              href={gifUrl}
              download={`${item.slug}.gif`}
              onClick={handleDownloadClick}
              className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition-all hover:bg-black/80 hover:text-lime"
              aria-label="Download GIF"
              title="Download GIF"
            >
              <Download size={14} />
            </a>

            {/* Favorite button */}
            <button
              onClick={handleFavoriteClick}
              className={`grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-md transition-all hover:bg-black/80 ${
                isFavorite ? "text-pink" : "text-white/80 hover:text-pink"
              }`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Card info */}
        <div className="flex items-center justify-between gap-2 p-3.5">
          <span className="truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
            {item.title}
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {item.mood || item.category}
          </span>
        </div>
      </Link>
    </div>
  );
});
