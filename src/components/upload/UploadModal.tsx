import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Film, AlertCircle, Sparkles, Check } from "lucide-react";
import { MOODS } from "@/lib/catalogue/moods";
import { saveUserUpload, type UserUpload } from "@/lib/storage/uploads";
import { formatFileSize } from "@/lib/media/format";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (upload: UserUpload) => void;
};

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB limit for GIF-sized loops in browser storage
const CATEGORIES = ["cats", "memes", "funny", "viral", "animation", "art", "chill", "other"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom-loop";
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [posterDataUrl, setPosterDataUrl] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState("calm");
  const [category, setCategory] = useState("cats");
  const [tagsInput, setTagsInput] = useState("cat, funny, loop");

  const [duration, setDuration] = useState(3.0);
  const [dimensions, setDimensions] = useState({ width: 480, height: 480 });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl("");
      setPosterDataUrl("");
      setTitle("");
      setDescription("");
      setError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleFileChange = (selectedFile: File) => {
    setError(null);

    if (selectedFile.size > MAX_BYTES) {
      setError(
        `File is too large (${formatFileSize(selectedFile.size)}). Please choose a GIF-sized video or loop under 25 MB.`,
      );
      return;
    }

    const isVideo = selectedFile.type.startsWith("video/") || selectedFile.name.endsWith(".mov");
    const isGif = selectedFile.type === "image/gif" || selectedFile.name.endsWith(".gif");

    if (!isVideo && !isGif) {
      setError("Unsupported format. Please select an MP4, WebM, MOV, or GIF file.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const objUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(objUrl);

    // Auto-suggest title from file name
    const rawName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const cleanTitle = rawName
      .replace(/[-_.]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setTitle(cleanTitle);

    if (isVideo) {
      // Create temporary video element to measure duration & capture poster
      const tempVideo = document.createElement("video");
      tempVideo.src = objUrl;
      tempVideo.muted = true;
      tempVideo.preload = "auto";
      tempVideo.playsInline = true;

      tempVideo.onloadedmetadata = () => {
        const w = tempVideo.videoWidth || 480;
        const h = tempVideo.videoHeight || 480;
        const dur = Math.min(tempVideo.duration || 3.0, 15.0);
        setDimensions({ width: w, height: h });
        setDuration(Math.round(dur * 100) / 100);

        // Seek slightly to capture a non-black poster frame
        tempVideo.currentTime = Math.min(0.1, dur * 0.1);
      };

      tempVideo.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = tempVideo.videoWidth || 480;
          canvas.height = tempVideo.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setPosterDataUrl(dataUrl);
          }
        } catch (e) {
          console.warn("Could not extract poster frame from video:", e);
        }
      };
    } else if (isGif) {
      const img = new Image();
      img.src = objUrl;
      img.onload = () => {
        setDimensions({ width: img.naturalWidth || 480, height: img.naturalHeight || 480 });
        setDuration(3.0);
        setPosterDataUrl(objUrl);
      };
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Please select a file and provide a title.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const uniqueSuffix = Math.random().toString(36).slice(2, 7);
      const cleanSlug = `${slugify(title)}-${uniqueSuffix}`;
      const id = `upload-${Date.now().toString(36)}-${uniqueSuffix}`;

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const aspect =
        dimensions.height > 0
          ? Math.round((dimensions.width / dimensions.height) * 1000) / 1000
          : 1.0;

      const upload: UserUpload = {
        id,
        slug: cleanSlug,
        title: title.trim(),
        description: description.trim(),
        category,
        mood,
        tags,
        creator: "You",
        license: "Personal Upload",
        duration_seconds: duration,
        width: dimensions.width,
        height: dimensions.height,
        aspect_ratio: aspect,
        posterDataUrl: posterDataUrl || previewUrl,
        mediaBlob: file,
        mediaType: file.type || (file.name.endsWith(".gif") ? "image/gif" : "video/mp4"),
        bytes: file.size,
        uploadedAt: new Date().toISOString(),
      };

      await saveUserUpload(upload);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess?.(upload);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Save upload error:", err);
      setError("Failed to save upload to local browser storage: " + String(err));
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-2xl transition-all my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime/10 text-lime">
              <Film size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Upload Loop to Profile</h2>
              <p className="text-xs text-muted">Stores GIF-sized videos directly in your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime/20 text-lime">
              <Check size={24} />
            </div>
            <h3 className="text-base font-semibold">Loop Added to Your Profile!</h3>
            <p className="text-xs text-muted">Saved locally to browser storage with GIF playback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* File dropzone / Selector */}
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface/50 p-8 text-center cursor-pointer hover:border-lime/40 hover:bg-surface transition-all"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted group-hover:text-lime transition-colors">
                  <Upload size={22} />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Click or drag & drop a GIF or video here
                </p>
                <p className="mt-1 text-xs text-muted">
                  Supports MP4, WebM, MOV, and GIF up to 25 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/gif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Live Preview Card */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
                  {file.type.startsWith("video/") || file.name.endsWith(".mov") ? (
                    <video
                      ref={videoPreviewRef}
                      src={previewUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Uploaded preview"
                      className="h-full w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setFile(null);
                      setPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white/80 hover:text-white backdrop-blur-md"
                    title="Change file"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
                    {formatFileSize(file.size)} · {dimensions.width}×{dimensions.height} · {duration}s
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Title <span className="text-lime">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. My Cat Doing Backflips"
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-lime/40 focus:outline-none"
                  />
                </div>

                {/* Mood & Category selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Mood</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-lime/40 focus:outline-none capitalize"
                    >
                      {MOODS.map((m) => (
                        <option key={m.slug} value={m.slug}>
                          {m.emoji} {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-lime/40 focus:outline-none capitalize"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of this loop..."
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-lime/40 focus:outline-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="cat, funny, meme"
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-lime/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || !title.trim() || isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-lime px-5 py-2 text-xs font-bold text-background transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Sparkles size={14} />
                <span>{isSubmitting ? "Saving to Profile..." : "Add to Profile"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
