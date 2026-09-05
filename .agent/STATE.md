# Current State — 2026-09-05

## What works

- Darkspire is a vanilla JavaScript browser roguelike; open `index.html` directly.
- The position system, town/meta systems, retreat flow, stagecoach/campfire, character kits, and gear economy have recent implementation work recorded in `PIN.md`.
- Headless combat simulations live in `sims/`; the portable Node path is documented in `PIN.md`.
- The campfire visual slice now uses a gothic fortress/stagecoach environment, eight reusable class portraits, a central animated fire, restrained fog/embers and warm lighting. All art used at runtime is in `assets/exported/`.
- Separate living-roster and free-recruit panels, veteran return counts, wound labels, selected rank badges, ordered rank I–IV slots with removal, a genuinely disabled incomplete-party action, resume action and a non-interactive graveyard memorial all use existing game state.
- Click order still determines ranks. Removing a hero closes the gap. Keyboard Space/Enter selects heroes; focus survives the renderer refresh; live announcements expose rank changes and the four-hero cap.

## Visual production system

- The project now has a 2D/2.5D asset pipeline: Blender-rendered material and Krita/Aseprite work feed browser-ready exports.
- Editable originals belong in `assets/source/`; runtime code uses only `assets/exported/`.
- The visual identity is documented in `docs/ART_DIRECTION.md`: Darkest Dungeon outside runs, Slay-the-Spire-like readability inside runs.

## Important decisions

- Keep the existing vanilla browser architecture; do not migrate to Godot or Unity for the visual pass.
- Prefer a small number of intentional, reusable assets to inconsistent generated-art volume.
- AI imagery is reference/raw material and requires cleanup before runtime use.
- `js/campfire-view.js` replaces only the campfire renderer, after `intro.js` is loaded. `css/campfire.css` scopes every visual rule to campfire classes. Combat, map, economy, recruitment and save logic were not redesigned.
- Browser-safe Georgia serif type is used for this screen without requiring a downloaded font. Other screens retain their existing typography.
- Source production masters are an SVG environment composite and Python/SVG sprite-export recipe in `assets/source/vector/`. Reviewed raw layers and exact generation prompts are under `assets/source/ai-reference/`. `resvg-py==0.5.0` is an offline export tool only; no runtime dependency or build step was added.
- CSS atmosphere uses transforms/opacity and a small fixed number of elements. `prefers-reduced-motion: reduce` disables animations and transitions.

## Worktree safety and milestone boundary

- Inspected the prior August wave: DESIGN/PIN additions, 407 lines of CSS, cards and enemy tuning, main/meta/summary/town/UI changes, balance report, and untracked `data/gear.js` / `js/intro.js`.
- Deliberately did **not** checkpoint that wave. Although its main campfire flow works and all JavaScript parses, it has incomplete integration: `State.newRun` still uses the classic starter kit instead of the rolled kit, injury penalties are not applied there, and no loadout UI calls `Gear.applyLoadout`. These are gameplay follow-ups, not part of the visual milestone.
- Preserved prior file content byte-for-byte. `index.html` has only two additional visual includes on top of the prior includes. The visual commit stages only those two new lines; the pre-existing `gear.js` and `intro.js` includes stay unstaged with the gameplay wave.
- Consequently the visual commit is a presentation layer over that local gameplay wave. A clean checkout of the visual commit alone retains the older game flow until the gameplay wave is separately completed/committed. The renderer guards against absent `DS.Campfire`. Do not accidentally omit the gameplay wave when preparing a release.
- The HP preview intentionally matches current run creation (base + chapel + veteran bonus). Wounds display their readable name, but this milestone does not activate their planned HP penalty or rolled-kit gameplay. No `[object Object]` injury labels remain in this renderer.

## Checks run

- Before edits: parsed all JavaScript under `js/`, `data/`, `sims/` using `C:\Users\joel\tools\node-portable\node.exe`; browser-selected four heroes and descended to the map; ran 10 combats for each of the 31 sim encounter configurations (seed 42). The sim report-writing call was disabled in-memory, preserving the existing `sims/REPORT.md`.
- `node tests/campfire-smoke.js` passes against the actual index script order: selection/removal/ranks, recruit persistence on embark, deck/run creation, saved class order and gold, card-effect rehydration, death removal/refill, roster cap, post-wipe recruits, corrupt-save failure, asset existence and runtime source boundary.
- Changed JS and the browser-fixture inline script parse successfully. There is no configured build, linter, type checker or dependency install needed for the game itself.
- Browser visual inspection at 1440 × 1000, 820 × 1000 and 390 × 844. No horizontal page overflow or broken images in the inspected narrow/full-roster views. Long names containing `<` and `&` render literally and wrap in cards/ranks.
- Browser exercised mouse and Space selection, rejected a fifth selection, removed rank II and verified ranks closed up, reselected and descended with Fighter/Ranger/Wizard/Paladin in that order. Resume restored the expected map with 43 gold. Retreat reached its summary, returned through town, then showed veteran increments back at the campfire. The existing native retreat confirmation stalled browser tooling; Joel dismissed it and the subsequent flow was verified.
- Isolated browser fixtures exercised wounded veterans, four recruit classes, dead heroes, no recruits at full roster, an empty living roster replenished with four recruits, long names and more than six graves. Corrupt-save resume displayed recovery text and stayed at campfire.
- No unexpected browser errors in the normal inspected flows; the corrupt-save fixture deliberately produces the existing diagnostic warning. Fixtures substitute in-memory storage before scripts execute; they do not read/overwrite normal campaign saves.
- Reviewed PNG alpha, cell boundaries and class silhouettes at gameplay scale. Rejected a generated cleanup variant that baked a checkerboard into RGB; it was never shipped.

## Unresolved / next steps

1. Complete and separately checkpoint the existing gameplay wave: rolled-kit handoff, injury penalty integration, loadout UI and the already-planned flee/temporary-power work. Do not bundle these into this visual commit.
2. Optional future art refinement: bespoke painted fire animation, per-character portrait variants, and further manual paint-over of generated costume detail. The current scene uses reusable static class portraits and a CSS flame.
3. Combat/map visual production remains a separate milestone. No combat redesign or balancing was performed here.

See `tests/README.md` for reproducible checks and isolated visual scenarios, and `assets/source/ai-reference/campfire-art-review.md` for asset provenance and acceptance notes.
