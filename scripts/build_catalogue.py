#!/usr/bin/env python3
"""Builds public/data/catalogue.json and stages media assets (MP4, GIF, Poster) from media/processed/assets."""
from __future__ import annotations
import argparse, json, os, shutil, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_EDITORIAL: dict[str, dict[str, Any]] = {
    "flower-0cd83d944a6c": {
        "title": "Golden Bloom",
        "description": "An ethereal botanical bloom unfolding in continuous, radiant motion.",
        "category": "nature",
        "mood": "ethereal",
        "tags": ["nature", "botanical", "bloom", "golden", "organic"],
        "creator": "Loopscape Curations",
        "license": "Creative Commons Attribution 4.0",
        "approved_for_publication": True,
    },
    "friday-339504acdef4": {
        "title": "Friday Pulse",
        "description": "Vibrant kinetic rhythm and motion captured in a seamless geometric loop.",
        "category": "kinetic",
        "mood": "kinetic",
        "tags": ["kinetic", "motion", "energy", "pulse", "rhythm"],
        "creator": "Loopscape Curations",
        "license": "Creative Commons Attribution 4.0",
        "approved_for_publication": True,
    },
    "gravitational-wave-loop-142f7037c486": {
        "title": "Spacetime Ripple",
        "description": "Mesmerizing gravitational wave curvature visualized in a continuous loop.",
        "category": "science",
        "mood": "geometric",
        "tags": ["science", "astronomy", "spacetime", "waves", "physics"],
        "creator": "Scientific Simulation Archive",
        "license": "Public Domain / Open Data",
        "approved_for_publication": True,
    },
}

def load_editorial_file(path: Path | None) -> dict[str, dict[str, Any]]:
    if not path or not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"Warning: Failed to load editorial file {path}: {exc}", file=sys.stderr)
        return {}

def copy_or_link(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        # Check if identical inode (already hardlinked) or identical size
        if dest.stat().st_ino == src.stat().st_ino or dest.stat().st_size == src.stat().st_size:
            return
        dest.unlink()
    try:
        os.link(src, dest)
    except Exception:
        shutil.copy2(src, dest)

def generate_gif(video_src: Path, gif_dest: Path, max_width: int = 480, fps: int = 15) -> None:
    gif_dest.parent.mkdir(parents=True, exist_ok=True)
    if gif_dest.is_file() and gif_dest.stat().st_size > 0:
        return
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", str(video_src),
        "-vf", f"fps={fps},scale='min({max_width},iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
        str(gif_dest),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as exc:
        print(f"Warning: Failed to generate GIF for {video_src}: {exc}", file=sys.stderr)

def build_catalogue(
    processed_dir: Path,
    public_dir: Path,
    editorial_path: Path | None = None,
    publish_all: bool = False,
    stage_media: bool = True,
) -> dict[str, Any]:
    if not processed_dir.is_dir():
        raise FileNotFoundError(f"Processed directory does not exist: {processed_dir}")

    editorial_overrides = {**DEFAULT_EDITORIAL, **load_editorial_file(editorial_path)}

    manifest_files = sorted(processed_dir.glob("*/*/asset.json"))
    if not manifest_files:
        raise ValueError(f"No asset.json files found under {processed_dir}")

    posters_dir = public_dir / "media" / "posters"
    mp4_dir = public_dir / "media" / "mp4"
    gifs_dir = public_dir / "media" / "gifs"

    items: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for manifest_path in manifest_files:
        try:
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as exc:
            skipped.append({"file": str(manifest_path), "reason": f"Invalid JSON: {exc}"})
            continue

        asset_id = data.get("asset_id")
        if not asset_id:
            skipped.append({"file": str(manifest_path), "reason": "Missing asset_id"})
            continue

        asset_dir = manifest_path.parent
        review = data.get("review", {})
        ed = editorial_overrides.get(asset_id, {})

        is_approved = review.get("approved_for_publication", False) or ed.get("approved_for_publication", False)
        if not is_approved and not publish_all:
            skipped.append({"asset_id": asset_id, "reason": "Pending review / unapproved for publication"})
            continue

        variants = data.get("variants", {})
        poster_info = variants.get("poster")
        mp4_info = variants.get("mp4")

        if not poster_info or not mp4_info:
            skipped.append({"asset_id": asset_id, "reason": "Missing required media variants"})
            continue

        poster_src = asset_dir / poster_info.get("path", "poster.jpg")
        mp4_src = asset_dir / mp4_info.get("path", "loop.mp4")
        gif_src = asset_dir / "loop.gif"

        if not (poster_src.is_file() and mp4_src.is_file()):
            skipped.append({"asset_id": asset_id, "reason": "Variant files missing on disk"})
            continue

        poster_filename = f"{asset_id}.jpg"
        mp4_filename = f"{asset_id}.mp4"
        gif_filename = f"{asset_id}.gif"
        gif_dest = gifs_dir / gif_filename

        gif_bytes = None
        if stage_media:
            copy_or_link(poster_src, posters_dir / poster_filename)
            copy_or_link(mp4_src, mp4_dir / mp4_filename)

            if gif_src.is_file():
                copy_or_link(gif_src, gif_dest)
            elif shutil.which("ffmpeg"):
                generate_gif(mp4_src, gif_dest)

            if gif_dest.is_file():
                gif_bytes = gif_dest.stat().st_size

        width = mp4_info.get("width") or data.get("source", {}).get("width") or 1920
        height = mp4_info.get("height") or data.get("source", {}).get("height") or 1080
        aspect_ratio = round(width / height, 3) if height else 1.778
        duration_seconds = (
            mp4_info.get("duration_seconds")
            or data.get("source", {}).get("duration_seconds")
            or 5.0
        )

        slug = data.get("slug") or asset_id.split("-")[0]
        title = ed.get("title") or slug.replace("-", " ").title()
        description = ed.get("description", "")
        category = ed.get("category", "general")
        mood = ed.get("mood", "calm")
        tags = ed.get("tags", [category, mood])
        creator = ed.get("creator", "")
        license_str = ed.get("license", "")

        item: dict[str, Any] = {
            "id": asset_id,
            "slug": slug,
            "title": title,
            "description": description,
            "category": category,
            "mood": mood,
            "tags": tags,
            "creator": creator,
            "license": license_str,
            "duration_seconds": round(duration_seconds, 3),
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "poster": f"/media/posters/{poster_filename}",
            "mp4": f"/media/mp4/{mp4_filename}",
            "gif": f"/media/gifs/{gif_filename}",
            "poster_bytes": poster_src.stat().st_size,
            "mp4_bytes": mp4_src.stat().st_size,
            "published_at": datetime.now(timezone.utc).isoformat(),
        }
        if gif_bytes:
            item["gif_bytes"] = gif_bytes

        items.append(item)

    catalogue = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }

    data_dir = public_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    catalogue_dest = data_dir / "catalogue.json"
    catalogue_dest.write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return {
        "total_manifests": len(manifest_files),
        "published_items": len(items),
        "skipped_items": len(skipped),
        "skipped_details": skipped,
        "catalogue_path": str(catalogue_dest),
    }

def main() -> int:
    parser = argparse.ArgumentParser(description="Build static Loopscape catalogue and stage media variants.")
    parser.add_argument("--processed-dir", type=Path, default=Path("media/processed/assets"))
    parser.add_argument("--public-dir", type=Path, default=Path("public"))
    parser.add_argument("--editorial", type=Path, default=Path("media/editorial.json"))
    parser.add_argument("--publish-all", action="store_true", help="Publish even if review approval is false")
    parser.add_argument("--no-media", action="store_true", help="Skip copying media variants")

    args = parser.parse_args()

    try:
        report = build_catalogue(
            processed_dir=args.processed_dir,
            public_dir=args.public_dir,
            editorial_path=args.editorial,
            publish_all=args.publish_all,
            stage_media=not args.no_media,
        )
        print(f"✓ Catalogue built: {report['published_items']} items published, {report['skipped_items']} skipped.")
        print(f"  Destination: {report['catalogue_path']}")
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
