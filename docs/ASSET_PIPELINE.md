# Darkspire Asset Pipeline

## Folder roles

- `assets/source/`: editable originals.
- `assets/exported/`: game-ready runtime files.
- `assets/reference/`: curated visual reference that defines or supports the style.
- `assets/source/ai-reference/`: raw AI-generated concepts; these are source material, not finished game art.

The runtime must never depend on Downloads, an editor-specific file, or a raw AI export.

## 2D and 2.5D workflow

- Aseprite originals: `assets/source/aseprite/`; exports: `assets/exported/sprites/` or `assets/exported/tilesets/`.
- Krita originals: `assets/source/krita/`; exports: `assets/exported/renders/` or `assets/exported/ui/`.
- Blender originals: `assets/source/blender/`; renders/models: `assets/exported/renders/` or `assets/exported/models/`.
- Audio sessions: `assets/source/audio/`; runtime audio: `assets/exported/audio/`.
- Browser composites and sprite extraction recipes: `assets/source/vector/`; raster exports remain under `assets/exported/renders/` and `assets/exported/sprites/`. SVG masters may reference repo-local raw source layers; those references never enter runtime code.

The campfire export recipe is `assets/source/vector/export-campfire.py` (offline Python with `resvg-py==0.5.0`). It applies the editable environment scrims and grade, then crops and grades eight alpha sprites. The checked-in PNGs require no exporter, Python, network access, or build step to play. Review decisions and generation prompts live in `assets/source/ai-reference/campfire-art-review.md`.

Use Blender to create gothic rooms, towers, altars, weapons, statues, chains, candles, fog, boss silhouettes, and lighting reference. For this browser 2D game, export transparent PNGs, sprite sheets, background plates, or optimized web-ready models only where the existing runtime can use them.

## Export conventions

- Preserve a source file for every important asset.
- Use PNG/WebP for visual exports and OGG for runtime audio when supported; keep WAV masters as source.
- Name source and export consistently, for example `prop-rusted-candelabra.blend` and `prop-rusted-candelabra.png`.
- Update code references with the exported file only.
- Remove broken exports only when no runtime reference remains.

## Agent checklist

When creating or changing an asset, agents must:

1. Save the editable source.
2. Produce and name the runtime export.
3. Verify it at gameplay size and against the art direction.
4. Wire the export into the game and test the affected screen.
5. Record non-obvious usage or pipeline changes in documentation.
