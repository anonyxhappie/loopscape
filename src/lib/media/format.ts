export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${secs}s`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAspectRatioClass(ratio: number): string {
  if (ratio > 1.6) return "aspect-video";
  if (ratio > 0.9) return "aspect-square";
  return "aspect-[3/4]";
}

export function supportsWebM(): boolean {
  if (typeof document === "undefined") return false;
  const video = document.createElement("video");
  return video.canPlayType('video/webm; codecs="vp9"') !== "";
}

export function getVideoSource(item: { webm: string; mp4: string }): string {
  return supportsWebM() ? item.webm : item.mp4;
}
