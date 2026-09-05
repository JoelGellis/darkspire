# Darkspire Architecture

## Runtime

`index.html` loads vanilla JavaScript modules and `css/style.css` directly. The game must remain playable without an npm build process.

- `js/`: game flow, state, combat, UI, map, town, and summary screens.
- `data/`: data-driven heroes, cards, enemies, gear, relics, and events.
- `sims/`: headless balance harness using the real combat engine.
- `reference/`: cited tuning reference material.

## Asset boundary

Runtime code may reference only `assets/exported/`. Editable originals and raw generated references belong in `assets/source/`. See `ASSET_PIPELINE.md`.

## Visual implementation

The game remains 2D in the browser. Blender is used offline to create rendered plates, silhouettes, props, and lighting references; it does not imply a move to a 3D engine.
