# Darkspire Agent Operating Contract

Read `PIN.md`, `DESIGN.md`, `.agent/STATE.md`, and relevant files in `docs/` before changing Darkspire.

## Default behavior

Act rather than explain. Inspect the existing browser-game architecture, implement the smallest coherent change, run it, and fix failures before reporting completion.

Do not replace the vanilla JavaScript/browser architecture with a game engine unless Joel explicitly requests an engine migration. Preserve unrelated uncommitted work.

## Quality bar

- Keep the game runnable by opening `index.html` in a browser.
- Parse-check changed JavaScript with the portable Node executable documented in `PIN.md` when practical.
- Run relevant simulations when combat data changes.
- Visually inspect UI changes in a browser when available.
- Update `.agent/STATE.md` after substantial work.

## Asset rules

- Follow `docs/ART_DIRECTION.md` and `docs/ASSET_PIPELINE.md`.
- Store editable originals only in `assets/source/`; commit them when licensing and size allow.
- Store runtime-ready files only in `assets/exported/`; code must reference only these files.
- Keep raw AI imagery in `assets/source/ai-reference/`, never as an unreviewed runtime asset.
- Use lowercase kebab-case asset names.
- Preserve source and export together; never rely on Downloads as an asset source.

## Scope discipline

Darkspire is a dark-fantasy positional deckbuilder. Outside-run screens are gothic, torchlit, and painterly; in-run combat and maps remain readable, Slay-the-Spire-like tactical interfaces. Do not add art, mechanics, or dependencies that conflict with this direction.
