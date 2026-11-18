import { useState } from "react";
import { Link } from "react-router-dom";
import { Folder, Plus, Trash2, ArrowRight } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useCollections } from "@/hooks/useCollections";
import { exportUserData, importUserData } from "@/lib/storage/portability";

export function Collections() {
  const { collections, loading, createCollection, removeCollection, refresh } = useCollections();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCollection(name.trim(), description.trim());
    setName("");
    setDescription("");
    setIsCreating(false);
  };

  const handleExport = async () => {
    const json = await exportUserData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loopscape-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await importUserData(text);
    if (res.success) {
      setImportStatus("Data imported successfully!");
      await refresh();
    } else {
      setImportStatus(res.error || "Failed to import");
    }
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <Shell className="py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Collections</h1>
          <p className="mt-2 text-sm text-muted">
            Organize and group loops into custom local collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-xs font-semibold text-background hover:scale-105 transition-transform"
          >
            <Plus size={14} /> New Collection
          </button>
          <button
            onClick={handleExport}
            className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            Export JSON
          </button>
          <label className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors">
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="mb-6 rounded-xl border border-line bg-panel p-3 text-xs text-lime">
          {importStatus}
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-line bg-panel p-6">
          <h2 className="text-base font-semibold mb-4">Create New Collection</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ambient Moods"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-lime/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A collection of calm looping visuals..."
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-lime/40"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-lime px-4 py-2 text-xs font-semibold text-background"
              >
                Create Collection
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-2xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Folder size={48} className="text-muted/30" />
          <p className="mt-4 text-lg text-muted">No collections created yet</p>
          <p className="mt-1 text-sm text-muted/60">
            Create a collection to organize your favorite loops locally.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-panel p-5 transition-all hover:border-lime/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{col.name}</h2>
                  <button
                    onClick={() => removeCollection(col.id)}
                    className="text-muted/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete collection"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {col.description && (
                  <p className="mt-2 text-xs text-muted line-clamp-2">{col.description}</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-line/40 text-xs">
                <span className="text-muted">{col.loopIds.length} loop{col.loopIds.length !== 1 ? "s" : ""}</span>
                <Link
                  to={`/collection/${col.id}`}
                  className="inline-flex items-center gap-1 font-medium text-lime hover:underline"
                >
                  View <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
