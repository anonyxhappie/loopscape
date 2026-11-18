import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Heart,
  Folder,
  HardDrive,
  Trash2,
  Sparkles,
  Download,
  Share2,
  Check,
  Edit2,
  Database,
  ArrowRight,
} from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Gallery } from "@/features/gallery/Gallery";
import { UploadModal } from "@/components/upload/UploadModal";
import { useUserUploads } from "@/hooks/useUserUploads";
import { useCatalogue } from "@/hooks/useCatalogue";
import { useFavorites } from "@/hooks/useFavorites";
import { useCollections } from "@/hooks/useCollections";
import { getItem, setItem } from "@/lib/storage/local";
import { formatFileSize } from "@/lib/media/format";
import { exportUserData, importUserData } from "@/lib/storage/portability";
import { getMoodConfig } from "@/lib/catalogue/moods";
import type { UserUpload } from "@/lib/storage/uploads";

export function Profile() {
  const { uploads, items: userLoopItems, loading: uploadsLoading, removeUpload } = useUserUploads();
  const { items: allItems } = useCatalogue();
  const { favorites, toggleFavorite } = useFavorites();
  const { collections, refresh: refreshCollections } = useCollections();

  const [activeTab, setActiveTab] = useState<"uploads" | "favorites" | "collections" | "storage">("uploads");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Profile metadata
  const [username, setUsername] = useState<string>(() => getItem("profile_name", "Loop Voyager"));
  const [bio, setBio] = useState<string>(() =>
    getItem("profile_bio", "Curator & collector of seamless GIF-style loops"),
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(username);
  const [editBio, setEditBio] = useState(bio);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Favorited items
  const favoriteItems = useMemo(
    () => allItems.filter((i) => favorites.includes(i.id)),
    [allItems, favorites],
  );

  // Total storage calculation (bytes)
  const totalUploadBytes = useMemo(
    () => uploads.reduce((acc, u) => acc + (u.bytes || 0), 0),
    [uploads],
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editName.trim() || "Loop Voyager";
    const cleanBio = editBio.trim() || "Curator & collector of seamless GIF-style loops";
    setUsername(cleanName);
    setBio(cleanBio);
    setItem("profile_name", cleanName);
    setItem("profile_bio", cleanBio);
    setIsEditingProfile(false);
  };

  const handleDeleteUpload = async (upload: UserUpload) => {
    if (confirm(`Are you sure you want to delete "${upload.title}" from your uploads?`)) {
      setDeletingId(upload.id);
      await removeUpload(upload.id);
      setDeletingId(null);
    }
  };

  const handleShareUpload = (upload: UserUpload) => {
    const url = `${window.location.origin}/loop/${upload.slug}`;
    if (navigator.share) {
      navigator.share({
        title: upload.title,
        text: `Check out ${upload.title} on Loopscape`,
        url,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        setCopiedId(upload.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(upload.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleExportBackup = async () => {
    const json = await exportUserData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loopscape-profile-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await importUserData(text);
      if (res.success) {
        setImportStatus("Data imported successfully!");
        await refreshCollections();
      } else {
        setImportStatus(res.error || "Failed to import data");
      }
    } catch (err) {
      setImportStatus("Error parsing import file");
    }
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <Shell className="py-10 sm:py-14">
      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          setActiveTab("uploads");
        }}
      />

      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-lime/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-2xl border-2 border-lime/40 bg-surface text-lime shadow-inner">
              <span className="text-3xl sm:text-4xl">🐱</span>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-lime text-background text-xs font-bold">
                ✓
              </div>
            </div>

            {/* Identity Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {username}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-lime/30 bg-lime/10 px-2.5 py-0.5 text-[11px] font-semibold text-lime">
                  <Database size={10} /> Local Browser Profile
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted max-w-md">{bio}</p>

              {/* Edit trigger */}
              <button
                onClick={() => {
                  setEditName(username);
                  setEditBio(bio);
                  setIsEditingProfile(!isEditingProfile);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-lime transition-colors"
              >
                <Edit2 size={12} /> {isEditingProfile ? "Cancel editing" : "Edit profile info"}
              </button>
            </div>
          </div>

          {/* Quick Upload action */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105 shadow-lg shadow-lime/10"
            >
              <Upload size={16} />
              <span>Upload Loop / GIF</span>
            </button>
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 border-t border-line/60 pt-6 max-w-lg space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={40}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-lime/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Short Bio</label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={120}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-lime/40 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-lime px-4 py-1.5 text-xs font-bold text-background hover:scale-105 transition-transform"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="rounded-full border border-line px-4 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-line/60 pt-6">
          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-muted text-xs">
              <Upload size={14} className="text-lime" />
              <span>My Uploads</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {uploads.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-muted text-xs">
              <Heart size={14} className="text-pink" />
              <span>Favorites</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {favorites.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-muted text-xs">
              <Folder size={14} className="text-lime" />
              <span>Collections</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {collections.length}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
            <div className="flex items-center gap-2 text-muted text-xs">
              <HardDrive size={14} className="text-cyan-400" />
              <span>IndexedDB Storage</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {totalUploadBytes > 0 ? formatFileSize(totalUploadBytes) : "0 KB"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="mt-10 flex items-center gap-2 border-b border-line pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "uploads"
              ? "bg-lime text-background shadow-md shadow-lime/10"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Upload size={15} />
          <span>My Uploads</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === "uploads" ? "bg-background/20 text-background" : "bg-panel text-muted"
            }`}
          >
            {uploads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("favorites")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "favorites"
              ? "bg-lime text-background shadow-md shadow-lime/10"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Heart size={15} />
          <span>Favorites</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === "favorites" ? "bg-background/20 text-background" : "bg-panel text-muted"
            }`}
          >
            {favorites.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "collections"
              ? "bg-lime text-background shadow-md shadow-lime/10"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Folder size={15} />
          <span>Collections</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === "collections" ? "bg-background/20 text-background" : "bg-panel text-muted"
            }`}
          >
            {collections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "storage"
              ? "bg-lime text-background shadow-md shadow-lime/10"
              : "text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Database size={15} />
          <span>Storage & Backup</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {/* TAB 1: UPLOADS */}
        {activeTab === "uploads" && (
          <div>
            {uploadsLoading ? (
              <div className="masonry-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="masonry-item">
                    <div className="shimmer rounded-2xl" style={{ paddingBottom: "75%" }} />
                  </div>
                ))}
              </div>
            ) : uploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/50 py-20 px-4 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-surface text-lime">
                  <Upload size={32} />
                </div>
                <h3 className="mt-4 text-xl font-bold">No uploaded loops yet</h3>
                <p className="mt-2 text-sm text-muted max-w-md">
                  Upload GIF-sized videos or animated loops (under 25 MB). They are converted and
                  stored 100% locally in your browser&apos;s IndexedDB profile.
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-2.5 text-sm font-bold text-background transition-transform hover:scale-105"
                >
                  <Sparkles size={16} />
                  <span>Upload your first loop</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {uploads.map((upload) => {
                    const moodCfg = getMoodConfig(upload.mood);
                    const loopItem = userLoopItems.find((i) => i.id === upload.id);

                    return (
                      <div
                        key={upload.id}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-all hover:border-lime/30 hover:shadow-xl"
                      >
                        {/* Media Player / Looper */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <video
                            src={loopItem?.mp4}
                            poster={upload.posterDataUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            className="h-full w-full object-cover"
                          />

                          {/* GIF badge */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-black tracking-widest text-white backdrop-blur-md border border-white/10">
                            <span className="text-lime">GIF</span>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                            </span>
                          </div>

                          {/* Mood badge */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white backdrop-blur-md border border-white/10">
                            <span>{moodCfg?.emoji || "✨"}</span>
                            <span className="capitalize text-[11px]">{upload.mood}</span>
                          </div>
                        </div>

                        {/* Info & Card Actions */}
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-foreground line-clamp-1">
                                {upload.title}
                              </h4>
                              <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                                {formatFileSize(upload.bytes)}
                              </span>
                            </div>

                            {upload.description && (
                              <p className="mt-1 text-xs text-muted line-clamp-2">
                                {upload.description}
                              </p>
                            )}

                            {upload.tags && upload.tags.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {upload.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                            <Link
                              to={`/loop/${upload.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-lime hover:underline"
                            >
                              <span>View Loop</span>
                              <ArrowRight size={12} />
                            </Link>

                            <div className="flex items-center gap-1.5">
                              {/* Share */}
                              <button
                                onClick={() => handleShareUpload(upload)}
                                className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-lime/30 hover:text-foreground transition-colors"
                                title="Share loop"
                              >
                                {copiedId === upload.id ? (
                                  <Check size={12} className="text-lime" />
                                ) : (
                                  <Share2 size={12} />
                                )}
                              </button>

                              {/* Download GIF */}
                              <a
                                href={loopItem?.gif}
                                download={`${upload.slug}.gif`}
                                className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-lime/30 hover:text-foreground transition-colors"
                                title="Download GIF"
                              >
                                <Download size={12} />
                              </a>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUpload(upload)}
                                disabled={deletingId === upload.id}
                                className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-pink/40 hover:text-pink transition-colors disabled:opacity-50"
                                title="Delete upload"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {activeTab === "favorites" && (
          <div>
            {favoriteItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/50 py-20 px-4 text-center">
                <Heart size={40} className="text-muted/40" />
                <h3 className="mt-4 text-xl font-bold">No favorite loops</h3>
                <p className="mt-2 text-sm text-muted">
                  Click the heart icon on any loop to bookmark it to your profile.
                </p>
                <Link
                  to="/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-2.5 text-sm font-bold text-background"
                >
                  Explore loops
                </Link>
              </div>
            ) : (
              <Gallery
                items={favoriteItems}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>
        )}

        {/* TAB 3: COLLECTIONS */}
        {activeTab === "collections" && (
          <div>
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panel/50 py-20 px-4 text-center">
                <Folder size={40} className="text-muted/40" />
                <h3 className="mt-4 text-xl font-bold">No collections created</h3>
                <p className="mt-2 text-sm text-muted">
                  Create custom collections to categorize your loops and uploads.
                </p>
                <Link
                  to="/collections"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-2.5 text-sm font-bold text-background"
                >
                  Manage Collections
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    to={`/collection/${col.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-line bg-panel p-5 transition-all hover:border-lime/30 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-lime">
                          <Folder size={18} />
                        </span>
                        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                          {col.loopIds.length} loop{col.loopIds.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <h4 className="mt-4 text-lg font-bold text-foreground">{col.name}</h4>
                      {col.description && (
                        <p className="mt-1 text-xs text-muted line-clamp-2">{col.description}</p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-lime font-medium">
                      <span>Open collection</span>
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STORAGE & BACKUP */}
        {activeTab === "storage" && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-line bg-panel p-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Database size={16} className="text-lime" />
                <span>Browser Storage Status</span>
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                All your profile information, collections, favorites, and uploaded GIF-sized loops are
                safely persisted in your local browser&apos;s IndexedDB and localStorage. No data is
                ever transmitted to a remote server.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-line/50 pb-2">
                  <span className="text-muted">Total Uploads Stored</span>
                  <span className="font-semibold">{uploads.length} files</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-line/50 pb-2">
                  <span className="text-muted">IndexedDB Space Used</span>
                  <span className="font-semibold text-lime">
                    {totalUploadBytes > 0 ? formatFileSize(totalUploadBytes) : "0 KB"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-line/50 pb-2">
                  <span className="text-muted">Max Video Size Limit</span>
                  <span className="font-semibold">25 MB per loop</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <HardDrive size={16} className="text-cyan-400" />
                <span>Data Portability & Backup</span>
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Export your favorites, preferences, and collections as a portable JSON file to migrate
                or back up across browsers.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2.5 text-xs font-bold text-background hover:scale-105 transition-transform"
                >
                  <Download size={14} /> Export Backup (JSON)
                </button>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-medium text-muted hover:border-lime/40 hover:text-foreground transition-colors">
                  <Upload size={14} /> Import Backup (JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <p className="mt-3 text-xs font-medium text-lime">{importStatus}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}