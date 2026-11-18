const MAX_ACTIVE_VIDEOS = 3;

type ManagedVideo = {
  element: HTMLVideoElement;
  priority: number;
  isVisible: boolean;
  onPlayStateChange?: (playing: boolean) => void;
};

class PlaybackCoordinator {
  private videos = new Map<string, ManagedVideo>();
  private activeCount = 0;

  register(
    id: string,
    element: HTMLVideoElement,
    onPlayStateChange?: (playing: boolean) => void,
  ): void {
    this.videos.set(id, {
      element,
      priority: 0,
      isVisible: false,
      onPlayStateChange,
    });
  }

  unregister(id: string): void {
    const entry = this.videos.get(id);
    if (entry && !entry.element.paused) {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
    this.videos.delete(id);
  }

  setVisible(id: string, visible: boolean): void {
    const entry = this.videos.get(id);
    if (!entry) return;
    entry.isVisible = visible;

    if (visible) {
      this.tryPlay(id);
    } else {
      this.pause(id);
    }
  }

  requestPlay(id: string): boolean {
    const entry = this.videos.get(id);
    if (!entry) return false;
    entry.isVisible = true;
    this.tryPlay(id);
    return !entry.element.paused;
  }

  requestPause(id: string): void {
    this.pause(id);
  }

  private tryPlay(id: string): void {
    const entry = this.videos.get(id);
    if (!entry || !entry.isVisible) return;

    if (!entry.element.paused) return; // already playing

    if (this.activeCount >= MAX_ACTIVE_VIDEOS) {
      let lowestId: string | null = null;
      let lowestPriority = Infinity;

      for (const [vid, v] of this.videos) {
        if (!v.element.paused && v.priority < lowestPriority) {
          lowestPriority = v.priority;
          lowestId = vid;
        }
      }

      if (lowestId) {
        this.pause(lowestId);
      } else {
        return;
      }
    }

    entry.priority = Date.now();
    entry.element.muted = true; // rule: audio disabled by default
    entry.element.play()
      .then(() => {
        this.activeCount++;
        entry.onPlayStateChange?.(true);
      })
      .catch(() => {
        // Autoplay may be restricted or aborted by browser
        entry.onPlayStateChange?.(false);
      });
  }

  private pause(id: string): void {
    const entry = this.videos.get(id);
    if (!entry || entry.element.paused) return;
    entry.element.pause();
    this.activeCount = Math.max(0, this.activeCount - 1);
    entry.onPlayStateChange?.(false);
  }

  pauseAll(): void {
    for (const [id] of this.videos) {
      this.pause(id);
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }
}

export const playbackCoordinator = new PlaybackCoordinator();
