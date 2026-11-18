#!/usr/bin/env python3
"""Local, deterministic media ingestion for Loopscape. Requires FFmpeg and FFprobe."""
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {".mp4", ".mov", ".m4v", ".mkv", ".webm", ".avi", ".mpeg", ".mpg"}

class IngestError(Exception):
    pass

def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(command, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except FileNotFoundError as exc:
        raise IngestError(f"Required executable not found: {command[0]}") from exc
    except subprocess.CalledProcessError as exc:
        raise IngestError(f"Command failed: {(exc.stderr or '')[-1200:]}") from exc

def require_tools() -> None:
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if missing:
        raise IngestError("Missing required tools: " + ", ".join(missing) + ". Install FFmpeg and FFprobe.")

def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    return re.sub(r"-{2,}", "-", value).strip("-")[:72].strip("-") or "untitled-loop"

def rational(value: str | None) -> float | None:
    if not value or value in ("0/0", "N/A"):
        return None
    try:
        if "/" in value:
            numerator, denominator = value.split("/", 1)
            denominator = float(denominator)
            return float(numerator) / denominator if denominator else None
        return float(value)
    except (ValueError, ZeroDivisionError):
        return None

def probe(path: Path) -> dict[str, Any]:
    result = run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)])
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise IngestError("FFprobe returned invalid JSON.") from exc

def inspect_source(path: Path, args: argparse.Namespace) -> dict[str, Any]:
    if not path.is_file():
        raise IngestError("Source is not a regular file.")
    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise IngestError(f"Unsupported extension: {path.suffix or '(none)'}")
    size = path.stat().st_size
    if size <= 0:
        raise IngestError("Source file is empty.")
    if size > args.max_bytes:
        raise IngestError(f"Source exceeds size limit ({size} > {args.max_bytes} bytes).")
    data = probe(path)
    streams = data.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    if not video or video.get("codec_name") == "unknown":
        raise IngestError("No valid video stream found.")
    width, height = int(video.get("width") or 0), int(video.get("height") or 0)
    duration = float(video.get("duration") or data.get("format", {}).get("duration") or 0)
    fps = rational(video.get("avg_frame_rate")) or rational(video.get("r_frame_rate"))
    if width <= 0 or height <= 0 or duration <= 0 or fps is None or fps <= 0:
        raise IngestError("Video dimensions, duration, or frame rate are missing/invalid.")
    if width > args.max_width or height > args.max_height:
        raise IngestError(f"Dimensions {width}x{height} exceed {args.max_width}x{args.max_height}.")
    if duration > args.max_duration:
        raise IngestError(f"Duration {duration:.2f}s exceeds {args.max_duration:.2f}s.")
    if fps > 120:
        raise IngestError(f"Frame rate {fps:.2f}fps exceeds safety limit 120fps.")
    return {
        "source_file": path.name, "source_sha256": sha256_file(path), "source_bytes": size,
        "duration_seconds": round(duration, 3), "width": width, "height": height,
        "frame_rate": round(fps, 3), "source_video_codec": video.get("codec_name"),
        "source_pixel_format": video.get("pix_fmt"),
        "has_audio": any(s.get("codec_type") == "audio" for s in streams),
    }

def verify_video(path: Path, expected_codec: str) -> dict[str, Any]:
    data = probe(path)
    streams = data.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    if not video or video.get("codec_name") != expected_codec:
        raise IngestError(f"{path.name}: expected {expected_codec} video stream.")
    if any(s.get("codec_type") == "audio" for s in streams):
        raise IngestError(f"{path.name}: output unexpectedly contains audio.")
    duration = float(video.get("duration") or data.get("format", {}).get("duration") or 0)
    if duration <= 0:
        raise IngestError(f"{path.name}: invalid output duration.")
    run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"])
    return {
        "codec": video.get("codec_name"), "width": int(video.get("width") or 0),
        "height": int(video.get("height") or 0), "duration_seconds": round(duration, 3),
        "bytes": path.stat().st_size, "sha256": sha256_file(path),
    }

def encode(source: Path, staging: Path, metadata: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    duration = metadata["duration_seconds"]
    poster_at = min(max(duration * 0.1, 0.0), max(duration - 0.05, 0.0))
    poster, webm, mp4 = staging / "poster.jpg", staging / "loop.webm", staging / "loop.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{poster_at:.3f}", "-i", str(source),
         "-frames:v", "1", "-vf", f"scale='min({args.max_width},iw)':-2", "-q:v", "3", str(poster)])
    common = ["-i", str(source), "-map", "0:v:0", "-an",
              "-vf", f"scale='min({args.max_width},iw)':-2,fps={args.fps}"]
    run(["ffmpeg", "-y", "-v", "error", *common, "-c:v", "libvpx-vp9", "-deadline", "good",
         "-cpu-used", "2", "-crf", str(args.webm_crf), "-b:v", "0", "-row-mt", "1",
         "-pix_fmt", "yuv420p", str(webm)])
    run(["ffmpeg", "-y", "-v", "error", *common, "-c:v", "libx264", "-preset", args.x264_preset,
         "-crf", str(args.mp4_crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)])
    if not poster.is_file() or poster.stat().st_size == 0:
        raise IngestError("Poster extraction failed.")
    run(["ffmpeg", "-v", "error", "-i", str(poster), "-f", "null", "-"])
    return {
        "poster": {"file": "poster.jpg", "bytes": poster.stat().st_size,
                   "sha256": sha256_file(poster), "format": "jpeg"},
        "webm": verify_video(webm, "vp9"), "mp4": verify_video(mp4, "h264"),
    }

def process_one(source: Path, output: Path, args: argparse.Namespace) -> dict[str, Any]:
    metadata = inspect_source(source, args)
    digest, slug = metadata["source_sha256"], slugify(source.stem)
    version = digest[:12]
    destination = output / "assets" / slug / version
    if destination.exists() and not args.overwrite:
        raise IngestError(f"Immutable output already exists: {destination}. Use --overwrite to replace.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".loopscape-ingest-", dir=str(destination.parent)) as temp:
        staging = Path(temp)
        variants = encode(source, staging, metadata, args)
        ready = staging / "ready"
        ready.mkdir()
        for filename in ("poster.jpg", "loop.webm", "loop.mp4"):
            shutil.move(str(staging / filename), str(ready / filename))
        manifest = {
            "schema_version": 1, "asset_id": f"{slug}-{version}", "slug": slug, "version": version,
            "status": "processed_pending_review", "created_at": datetime.now(timezone.utc).isoformat(),
            "source": metadata,
            "variants": {
                "poster": {"path": "poster.jpg", **variants["poster"]},
                "webm": {"path": "loop.webm", **variants["webm"]},
                "mp4": {"path": "loop.mp4", **variants["mp4"]},
            },
            "review": {"rights_status": "unknown", "seam_review": "pending",
                       "approved_for_publication": False},
        }
        (ready / "asset.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        if destination.exists():
            shutil.rmtree(destination)
        os.replace(ready, destination)
    return {"asset_id": manifest["asset_id"], "output_dir": str(destination), "status": manifest["status"]}

def collect_sources(input_path: Path, output: Path) -> list[Path]:
    if input_path.is_file():
        return [input_path]
    if not input_path.is_dir():
        raise IngestError(f"Input path does not exist: {input_path}")
    output_resolved = output.resolve()
    sources = []
    for path in sorted(input_path.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                path.resolve().relative_to(output_resolved)
                continue
            except ValueError:
                sources.append(path)
    return sources

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create validated local Loopscape media variants.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-bytes", type=int, default=500 * 1024 * 1024)
    parser.add_argument("--max-duration", type=float, default=60.0)
    parser.add_argument("--max-width", type=int, default=3840)
    parser.add_argument("--max-height", type=int, default=2160)
    parser.add_argument("--fps", type=float, default=30.0)
    parser.add_argument("--webm-crf", type=int, default=32)
    parser.add_argument("--mp4-crf", type=int, default=23)
    parser.add_argument("--x264-preset", default="medium")
    parser.add_argument("--overwrite", action="store_true")
    return parser.parse_args()

def main() -> int:
    args = parse_args()
    if min(args.max_bytes, args.max_duration, args.max_width, args.max_height, args.fps) <= 0:
        print("Size, duration, dimensions, and fps limits must be positive.", file=sys.stderr)
        return 2
    try:
        require_tools()
        sources = collect_sources(args.input, args.output)
        if not sources:
            raise IngestError(f"No supported video files found under {args.input}.")
        args.output.mkdir(parents=True, exist_ok=True)
        processed, failures = [], []
        for source in sources:
            try:
                item = process_one(source, args.output, args)
                processed.append(item)
                print(f"OK   {source} -> {item['output_dir']}")
            except IngestError as exc:
                failures.append({"source": str(source), "error": str(exc)})
                print(f"FAIL {source}: {exc}", file=sys.stderr)
        report = {
            "schema_version": 1, "generated_at": datetime.now(timezone.utc).isoformat(),
            "processed": len(processed), "rejected": len(failures),
            "assets": processed, "failures": failures,
        }
        (args.output / "ingest-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"\nFinished: {len(processed)} processed, {len(failures)} rejected.")
        return 1 if failures else 0
    except IngestError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
