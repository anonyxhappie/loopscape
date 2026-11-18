# Loopscape local media pipeline

Phase 2 is a reproducible local CLI, not a hosted backend. The static website and hosting remain independent.

## Requirements

- Python 3.10+
- FFmpeg with FFprobe on PATH
- FFmpeg encoders libvpx-vp9 and libx264
- No Python packages, accounts, credentials, or API keys

Check the environment:

    python3 --version
    ffmpeg -version
    ffprobe -version
    ffmpeg -hide_banner -encoders | grep -E 'libvpx-vp9|libx264'

## Process videos

    python3 scripts/media_ingest.py --input ./media/incoming --output ./media/processed

The command scans supported video extensions recursively. Defaults reject sources above 500 MiB, 60 seconds, 3840×2160, or 120 fps. Outputs are silent video at 30 fps: a JPEG poster, VP9 WebM, and H.264 MP4.

For a single file:

    python3 scripts/media_ingest.py --input ./media/incoming/soft-orbit.mp4 --output ./media/processed

Tune limits:

    python3 scripts/media_ingest.py --input ./media/incoming --output ./media/processed --max-duration 20 --max-width 1920 --max-height 1080 --fps 24

## Output layout

    media/processed/
    ├── assets/
    │   └── soft-orbit/
    │       └── <first-12-chars-of-source-sha256>/
    │           ├── asset.json
    │           ├── poster.jpg
    │           ├── loop.webm
    │           └── loop.mp4
    └── ingest-report.json

Each versioned directory is keyed by the source SHA-256. The per-asset manifest records source metadata, variant checksums/sizes, and review state. New assets are marked processed_pending_review; rights are unknown, seam review is pending, and publication approval is false. Processing does not grant rights or publish an asset.

Existing version output is immutable by default. If the same source version already exists, processing rejects it unless --overwrite is explicitly supplied.

## Validation

- File existence, supported extension, non-zero size, source size limit.
- FFprobe must find a valid video stream, dimensions, duration, and frame rate.
- Duration, dimensions, and extreme frame rates are checked.
- Poster extraction and decoding must succeed.
- WebM must contain VP9; MP4 must contain H.264.
- Generated video must contain no audio.
- FFmpeg decodes each full output to a null sink.
- SHA-256 checksums are recorded for source and variants.

The pipeline does not prove a loop is seamless. A curator must inspect the loop boundary, visual quality, crop, rights, and attribution before publication.

## Tests

    python3 -m unittest discover -s tests -v

Unit tests use only the Python standard library. Full media integration tests require FFmpeg and a representative source corpus.

## Integration boundary

This phase writes locally only. It does not upload to object storage, write to a database, expose public URLs, generate signed links, or connect to GitHub Pages. A future storage adapter and catalog persistence layer can consume the manifest contract after provider and rights decisions are made.
