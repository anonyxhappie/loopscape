const STORAGE_PREFIX = "loopscape:";

function key(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

export function getItem<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(name: string, value: T): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

export function removeItem(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    // ignore
  }
}

// Favorites
export function getFavorites(): string[] {
  return getItem<string[]>("favorites", []);
}

export function toggleFavorite(id: string): string[] {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  setItem("favorites", favorites);
  return [...favorites];
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

// Recently viewed
const MAX_RECENT = 50;

export function getRecentlyViewed(): string[] {
  return getItem<string[]>("recent", []);
}

export function addRecentlyViewed(id: string): void {
  const recent = getRecentlyViewed().filter((r) => r !== id);
  recent.unshift(id);
  setItem("recent", recent.slice(0, MAX_RECENT));
}
