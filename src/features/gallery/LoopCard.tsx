import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Heart, Download, Share2, Check } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import { getMoodConfig } from "@/lib/catalogue/moods";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const documentVisible = useDocumentVisibility();

  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [shared, setShared] = useState(false);

  const gifUrl = item.gif || `/media/gifs/${item.id}.gif`;

  // Detect touch/mobile environment (where mouse hover does not exist)
  useEffect(() => {
    const checkTouch = () => {
      const touchMatch =
        typeof window !== "undefined" &&
        (window.matchMedia("(hover: none)").matches ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0);
      setIsTouchDevice(touchMatch);
    };

    checkTouch();
    const mql = window.matchMedia("(hover: none)");
    mql.addEventListener?.("change", checkTouch);
    return () => mql.removeEventListener?.("change", checkTouch);
  }, []);

  // IntersectionObserver for mobile in-view detection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry?.isIntersecting ?? false);
      },
      {
        threshold: 0.4, // At least 40% of the loop is visible on the screen
        rootMargin: "0px 0px 0px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mobile / Touch behavior: Autoplay when loop scrolls into the viewport
  useEffect(() => {
    if (!isTouchDevice) return;

    const video = videoRef.current;
    if (!video || reducedMotion || !documentVisible) {
      if (video && !video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (isInView) {
      video.muted = true;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Some browsers restrict autoplay until initial touch; fallback to poster
          setIsPlaying(false);
        });
    } else {
      if (!video.paused) {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // ignore
        }
      }
      setIsPlaying(false);
    }
  }, [isTouchDevice, isInView, documentVisible, reducedMotion]);

  // Tab visibility / reduced motion guard
  useEffect(() => {
    if (!documentVisible || reducedMotion) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [documentVisible, reducedMotion]);

  // Desktop behavior: Play on mouse enter
  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice || reducedMotion) return;
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
  }, [isTouchDevice, reducedMotion]);

  // Desktop behavior: Pause on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice) return;
    setIsHovered(false);
    setIsPlaying(false);

    const video = videoRef.current;
    if (video) {
      video.pause();
      try {
        video.currentTime = 0; // reset to beginning for true GIF feel
      } catch {
        // ignore
      }
    }
  }, [isTouchDevice]);

  // Quick Share handler
  const handleShareClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const loopUrl = `${window.location.origin}/loop/${item.slug}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${item.title} — Loopscape`,
            text: item.description || `Check out ${item.title} on Loopscape`,
            url: loopUrl,
          });
          return;
        } catch {
          // User cancelled native share sheet or unsupported; fallback to clipboard
        }
      }

      try {
        await navigator.clipboard.writeText(loopUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.warn("Failed to copy link:", err);
      }
    },
    [item.slug, item.title, item.description],
  );

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
  const isCurrentlyShowingVideo = isTouchDevice ? isPlaying : isHovered && isPlaying;

  return (
    <div
      ref={containerRef}
      className="masonry-item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={`/loop/${item.slug}`}
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
        className="group relative block overflow-hidden rounded-2xl border border-line bg-panel transition-all duration-300 hover:border-lime/40 hover:shadow-xl hover:shadow-lime/5"
      >
        {/* Media container */}
        <div
          className="relative w-full overflow-hidden bg-surface"
          style={{ paddingBottom: aspectPadding }}
        >
          {/* Static poster displayed until video stream starts */}
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 pointer-events-none ${
              isCurrentlyShowingVideo ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Video preview: plays on hover (desktop) or in viewport (mobile) */}
          {!reducedMotion && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload={isTouchDevice ? "metadata" : "none"}
              poster={item.poster}
              src={item.mp4}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                isCurrentlyShowingVideo ? "opacity-100" : "opacity-0"
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

          {/* Quick action buttons (top right) - visible on touch/mobile, hover on desktop */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            {/* Quick Share Link button */}
            <button
              onClick={handleShareClick}
              className={`grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur-md transition-all hover:bg-black/80 ${
                shared ? "text-lime" : "text-white/80 hover:text-lime"
              }`}
              aria-label={shared ? "Link Copied!" : "Share Loop"}
              title={shared ? "Link Copied!" : "Share Loop"}
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}
            </button>

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
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
            {getMoodConfig(item.mood)?.emoji && (
              <span>{getMoodConfig(item.mood)?.emoji}</span>
            )}
            <span>{item.mood || item.category}</span>
          </span>
        </div>
      </Link>
    </div>
  );
});
