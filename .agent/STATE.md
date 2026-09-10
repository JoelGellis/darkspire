# Current State — 2026-09-09

## Active 100-improvement round (incomplete)

User objective remains 100 justified major improvements, implementation and verification of every item, updated playable demo, then another round. Keep the root thread for discussion; agents perform implementation/testing. The user additionally requires full run archives, mandatory player identity, cheap repeatable testing and immersive full-screen game presentation.

- `docs/IMPROVEMENTS-100.md` and rendered `.html` are the central justified backlog. Only IDs 1–7 and 92 are presently marked verified; other engine additions remain implemented awaiting verification or planned. Do not claim the whole round complete.
- Rolled kits/mastery/wounds, lean equipment/artifacts, acquisition/salvage and survivor/death ownership have engine tests. Actual campfire/armory/embark was browser-tested. Independent merchant/fullscreen checks remain active with the party agent; see `docs/party-equipment-verification.md`.
- Combat reach, committed targets, guard, riposte, displacement, deck keywords, X-costs and canonical reward cloning have regressions. Save v2 restores exact combat piles/generated cards/effects/targets and combat RNG; resumed-versus-uninterrupted enemy-round equality covers HP, intents, targets and next hand. Maps/rewards are not fully seeded yet.
- `js/player-identity.js` gates new runs/resume: human chosen name; AI provider/exact model/version/thinking effort (explicit unknown allowed); scripted policy/version with effort not applicable. Per-tab session identity, Change player control, immutable actor attribution on every journal event. Browser checked blank rejection, named human embark and actor switch; exported JSON proves prior events keep the earlier actor.
- `js/telemetry.js` stores full game-only diagnostic events locally in IndexedDB with lossless gzip when available, synchronous localStorage write-ahead journal, reload continuity, unique run/session/event IDs, export and explicit write-failure handling. No network upload, no automatic retention deletion. Native Chrome archive persistence/export checked. Large export is still assembled in memory; browser storage is finite and not off-device backup. See `docs/RUN-ARCHIVE.md`.
- `sims/scripted-batch.js` runs bounded zero-LLM-token probes with tactician/newcomer/gambler/breaker policies receiving visible observations only. Max 32 probes/batch, 240 decisions/probe, at most 3 combats with drafts. Seed100 initial results: tactician3 combats/91 decisions; gambler3/67; newcomer lost after1/44; breaker lost after2/58. Full diagnostic archives and summaries are under ignored `private-run-data/`. These are not full expeditions and do not prove fun/balance. Full route/events/shop/rest/settlement driver remains next.
- Eight current Node suites pass via `node scripts/build-release.js`, including expanded combat save, identity/actor, archive, policy information barrier, equipment, campfire, world and archive analysis. Native browser fixture is `tests/telemetry-fixture.html`; `?manual=1` permits human identity/interaction checks with isolated persistent test storage.
- Authoritative held runtime-only artifact: `.release/a5ed01a38c196380/`, version `incremental-a5ed01a38c196380`, 58 runtime files, source HEAD `3391d21d1d30f27ba0e0daad7367f8c9b061106a` plus the uncommitted integrated wave. Earlier artifact `f05c3c9a1f08a83c` inadvertently included untested expedition.js due mixed line endings; DO NOT PUBLISH it. Current index explicitly excludes expedition.js; that file is preserved for later validation.
- GitHub repo is public, `master`, Pages disabled, homepage unset. No existing live demo URL verified. `scripts/build-release.js` + manual `.github/workflows/pages.yml` prepare runtime-only publication; exclude raw art, tests, logs and private archives. `docs/RELEASE-PROCEDURE.md` describes exact enable/dispatch/verify route. Publication is authorized by user but held for integrated browser/merchant/fullscreen freeze. Rebuild after any runtime change and verify actual manifest/URL; do not deploy the source tree.
- No commits or publication in this checkpoint. Preserve all pre-existing August work. Shared memory log updated; source checkpoint, public demo and remaining 100-item work are still pending.
- Content planners are separate design proposals: `docs/content/01-character-stacks.md` and `02-itemization.md`/HTML are complete (itemization proposes 32 personal items plus 6 artifacts, 55 total with 17 existing). They are not implemented. Reconcile Cleric rank proposals with DESIGN's rank 2/3 gate and preserve gear-card metadata before implementation. Enemy ecosystem planner is active.
- An independently created legacy `sims/soak.js` and `sims/logs/` were found during checkpoint inspection; they are not the bounded scripted-batch runner and their runtime ownership was not verified here. Logs are now ignored to avoid public source publication. Do not represent legacy aggregate soak reports as actor-attributed full expeditions.

## Previous 2026-09-05 checkpoint (retained)

## Latest milestone: shared campfire / hamlet / run interface

Joel expanded the scope after the campfire-only checkpoint: closely follow Diablo's selectable character lineup, Darkest Dungeon's hamlet composition and Slay the Spire's map/combat/card placement, using the same Darkspire assets throughout. This supersedes the old campfire-only scope below.

- Built `js/visual-system.js` and `css/game-theme.css`, loaded after the existing modules. No engine, framework, build step or runtime dependency was added. Presentation adapters preserve the underlying mechanics and saved data.
- Campfire controls are now full-body figures in the environment, not separate roster tiles below an introductory banner. Selected figures light up and carry rank badges; veteran/recruit/wound labels remain readable. Ordered party slots, descent, town, resume, help and an expandable graveyard remain live. Desktop composition is tightened; narrow layouts use two-column figures.
- Town is a full-width painted hamlet with five building labels anchored over their locations, persistent hero roster at right and a crimson assembly action below. Visiting an upgrade building opens a dialog with current benefits and an explicit price before purchase. Blacksmith and merchant still use their real existing actions.
- Map is now parchment with ink SVG routes and semantic HTML node buttons, preserving generated connections and legal next nodes. Party portraits/ranks remain visible; current/completed/available nodes are distinct; deck and retreat controls sit in the top HUD. No map animation loop is needed in this renderer.
- Battles share the eight campfire hero illustrations and eight reviewed enemy archetypes. Intent is overhead, HP/ranks/move actions below each figure, energy/draw at left, hand at bottom, and end-turn/discard at right. Cards, reward cards and deck/pile viewers share framed portraits, readable parchment descriptions and energy gems. Small screens use a horizontally scrollable hand rather than wrapping hidden cards.
- Rest, train, purge, events, shops, boss intros and summaries receive the common world backgrounds and frame treatment. Rest and summary heroes reuse the same portraits. Added keyboard activation to playable cards, valid targets, map nodes, building controls and applicable shop items.
- Added a short in-game How to Play dialog. Retreat uses a native HTML dialog, retaining the original confirmation text and original engine action. Its adapter intercepts only the synchronous `confirm` call, restores it in `finally`, then calls the original action after the player's explicit confirmation. No browser-native blocking prompt is left in that path.

### Production assets

- New plates: `assets/exported/renders/hamlet-environment.png` and `dungeon-environment.png` (1600 × 900).
- New archetype sprites: `assets/exported/sprites/enemy-{sentinel,goblin,occultist,wraith,slime,fungus,beast,spider}.png` (360 × 500, alpha).
- Raw generated layers are in `assets/source/ai-reference/`; SVG grading/scrim masters and `export-world.py` are in `assets/source/vector/`. Reviewed crops retain genuine alpha; source grade and framing are editable. Prompts, visual references and acceptance notes are in `assets/source/ai-reference/world-art-review.md`.
- Enemy families deliberately reuse archetypes; this is not bespoke artwork for every named enemy. Individual attack-card paintings, enemy variants, richer event illustrations and character animation are remaining art work.

### Verification for this milestone

- Portable Node parse checks for the presentation and fixture scripts; `tests/campfire-smoke.js` passes with the actual entry-point script order. It covers selection/ranks/recruits/embark/save/resume/death/refill/wipe/corrupt saves.
- `tests/world-smoke.js` passes: 100 independently generated route maps have exactly the engine's available nodes, valid geometry and one semantic button per node; every existing enemy resolves to an exported archetype; hero art, fallen state, escaped names, direct-file card URLs and runtime asset boundary are checked.
- Chrome inspection at normal desktop (~1530 × 686), 1440 × 900, 820 × 900 and 390 × 844. Fixed inherited town max-width, hidden card-art URLs resolving relative to CSS, an old log panel covering a hero, move-button positioning, and ID-specific hand wrapping. Inspected mobile hand reports 818 px of scrollable cards in a 390 px container, with no page-level horizontal overflow.
- Browser exercised Space/click party selection, removing rank II and closing the gap, then descending with Fighter/Wizard/Ranger/Paladin in order. A route node started combat. Magic Missile reduced Bone Archer HP 14→8 and energy 3→2; ending turn resolved attacks and redrew at turn 2 with 3 energy.
- In isolated fixtures: Chapel purchase changed gold 185→135 and added 3 preview HP; merchant opened; in-run card purchase changed gold 185→126 and displayed SOLD; rest healed Fighter 40→57 and returned to map; reward grew deck 32→33; event choice resolved and continued; retreat confirmation reached summary and banked 92 of 185 gained gold. Fixtures never read or overwrite normal campaign storage.
- Browser console had no unexpected errors/warnings in the inspected normal flows. There is no configured build, linter or type checker. Combat data/balance was not changed, so the earlier simulation checkpoint was not rerun.
- Saved-run fixture resumed the expected four-hero map with 43 gold; deck viewer used the same framed portrait cards. Inspected solo boss scale, eight-class campfire, and the How to Play dialog. Mobile layout intentionally favors scrolling and compact tactical figures; desktop remains the primary play surface.

### Worktree boundary and remaining gameplay issues

The prior August gameplay wave is still uncommitted and is not included in this presentation milestone. It was not refactored or checkpointed. Only the new visual CSS/JS, own tests/docs/assets and two new index includes are staged for this milestone; the older gear/intro includes remain unstaged. The incomplete rolled-kit handoff, injury penalty application, equipment/loadout UI, flee and temporary-power work remain separate. A clean release still needs that gameplay wave finished and honestly committed; do not discard it or mistake these presentation commits for a complete release branch.

---

## Previous checkpoint notes — campfire-only milestone (historical)

The following records the earlier `bfb6c39` milestone. Its statements about combat/map remaining unchanged apply to that earlier checkpoint, not the latest shared visual pass above.

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
