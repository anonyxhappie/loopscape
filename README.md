# Loopscape

A curated, mood-led home for short looping visuals.

**Live at:** [loopscape.heyakshay.in](https://loopscape.heyakshay.in)

## Architecture

Loopscape V1 is built on a **100% client-side, static-first architecture** with browser-local persistence.
Zero runtime backend, database, authentication, or external storage dependencies.

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion
- **Navigation & Routing:** React Router v7 with static SPA fallback
- **Search & Discovery:** Client-side fuzzy search (Fuse.js) by mood, category, tags, and creator
- **Media Engine:**
  - Viewport-aware lazy loading via `IntersectionObserver`
  - Priority-managed playback coordinator (max 3 simultaneous videos)
  - WebM (VP9) primary with MP4 (H.264) compatibility fallback
  - Silent by default with smooth loop handling
  - Fullscreen viewing and downloadable media variants
- **Persistence:**
  - `localStorage` for favorites, preferences, and recently viewed
  - `IndexedDB` for custom user collections
  - JSON import/export with Zod schema validation
- **Content:** Static catalogue (`public/data/catalogue.json`) generated from local ingestion pipeline

## Project Structure

```
├── public/
│   ├── data/
│   │   └── catalogue.json
│   ├── media/
│   │   ├── posters/
│   │   ├── webm/
│   │   └── mp4/
│   ├── manifest.webmanifest
│   ├── 404.html
│   └── CNAME
├── src/
│   ├── components/      # Shell, Header, Footer, Layout
│   ├── features/
│   │   ├── gallery/     # Masonry gallery, LoopCard, MoodGrid
│   │   ├── player/      # Fullscreen LoopViewer, playback controls
│   │   └── discovery/   # Search and FilterBar
│   ├── hooks/           # useCatalogue, useFavorites, useCollections, useIntersection
│   ├── lib/
│   │   ├── catalogue/   # Loader, filters, taxonomy
│   │   ├── media/       # Formatters, codec detection
│   │   ├── playback/    # PlaybackCoordinator
│   │   └── storage/     # localStorage, IndexedDB, JSON import/export
│   ├── pages/           # Home, Explore, Category, LoopDetail, Favorites, Collections
│   ├── styles/          # Tailwind CSS theme and styles
│   └── types/           # Zod schemas and TypeScript types
├── scripts/
│   ├── media_ingest.py     # Local deterministic video processor (FFmpeg/FFprobe)
│   └── build_catalogue.py  # Static catalogue builder & media stager
└── tests/
    ├── catalogue.test.ts
    ├── portability.test.ts
    ├── test_media_ingest.py
    └── test_build_catalogue.py
```

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Build & Test

```bash
# Run unit tests (TypeScript + Python)
npm test
python3 -m unittest discover -s tests -v

# Build production bundle
npm run build
```

### Media Pipeline & Ingest

```bash
# 1. Ingest raw media from incoming folder
python3 scripts/media_ingest.py --input ./media/incoming --output ./media/processed

# 2. Build static catalogue and stage media variants
python3 scripts/build_catalogue.py --publish-all
```
