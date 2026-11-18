import { useRef, useEffect, useState } from "react";
import { Heart, Maximize2, Minimize2 } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { LoopItem } from "@/types/catalogue";

type LoopViewerProps = {
  item: LoopItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export function LoopViewer({ item, isFavorite, onToggleFavorite }: LoopViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-play and loop continuously like an actual GIF
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!reducedMotion) {
      video.muted = true;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [reducedMotion, item.id]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen request failed:", e);
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Keyboard: space to pause/unfreeze, F for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlayback();
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const aspectPadding = `${(item.height / item.width) * 100}%`;

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-2xl border border-line bg-surface select-none shadow-2xl"
    >
      <div
        className="relative cursor-pointer"
        style={{ paddingBottom: aspectPadding }}
        onClick={togglePlayback}
        role="button"
        tabIndex={0}
        aria-label="Toggle animation"
      >
        {/* Poster image */}
        <img
          src={item.poster}
          alt={item.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded && isPlaying ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Video stream operating strictly like an animated GIF */}
        {!reducedMotion && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            poster={item.poster}
            src={item.mp4}
            onLoadedData={() => setIsLoaded(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {/* Clean GIF badge */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-black tracking-widest text-white backdrop-blur-md border border-white/10 z-10">
        <span className="text-lime">GIF</span>
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
        </span>
      </div>

      {/* Top right quick actions */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={() => onToggleFavorite(item.id)}
          className={`grid h-9 w-9 place-items-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/80 ${
            isFavorite ? "text-pink" : "text-white/80 hover:text-pink"
          }`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/80 hover:text-white"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}
