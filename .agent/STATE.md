# Current State

## What works

- Darkspire is a vanilla JavaScript browser roguelike; open `index.html` directly.
- The position system, town/meta systems, retreat flow, stagecoach/campfire, character kits, and gear economy have recent implementation work recorded in `PIN.md`.
- Headless combat simulations live in `sims/`; the portable Node path is documented in `PIN.md`.

## Visual production system

- The project now has a 2D/2.5D asset pipeline: Blender-rendered material and Krita/Aseprite work feed browser-ready exports.
- Editable originals belong in `assets/source/`; runtime code uses only `assets/exported/`.
- The visual identity is documented in `docs/ART_DIRECTION.md`: Darkest Dungeon outside runs, Slay-the-Spire-like readability inside runs.

## Important decisions

- Keep the existing vanilla browser architecture; do not migrate to Godot or Unity for the visual pass.
- Prefer a small number of intentional, reusable assets to inconsistent generated-art volume.
- AI imagery is reference/raw material and requires cleanup before runtime use.

## Unresolved / next steps

1. Checkpoint and browser-playtest the existing uncommitted August gameplay build before overlapping feature work.
2. Build one polished vertical-slice visual scene using the new pipeline: campfire or combat, not both at once.
3. Add first runtime assets only after the scene composition and gameplay-scale readability are verified.
