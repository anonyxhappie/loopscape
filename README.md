# Loopscape

A curated, mood-led home for short looping visuals.

## Phase 1 — Static preview

The first release is a self-contained static website at **https://loopscape.heyakshay.in**.

- Plain HTML and CSS; no build step or JavaScript framework.
- No database, authentication, analytics, CMS, API, external asset CDN, or third-party runtime integration.
- The visual previews are generated with CSS, so the page has no external media dependencies.
- Responsive layout, accessible navigation, and reduced-motion support.
- Hosted with GitHub Pages from the `main` branch root.

See [the product architecture](docs/PRODUCT_DESIGN_ARCHITECTURE.md) for the staged roadmap.


## Phase 2 — Local media processing

The local FFmpeg/FFprobe pipeline is implemented on the Phase 2 branch.

Requirements: Python 3.10+, FFmpeg with FFprobe, and the libvpx-vp9 and libx264 encoders.

Run:

    python3 scripts/media_ingest.py --input ./media/incoming --output ./media/processed

Read [the media pipeline guide](docs/MEDIA_PIPELINE.md) for limits, outputs, validation, and review requirements. Generated media is local-only and excluded from Git. No cloud credentials or third-party service setup is needed.
