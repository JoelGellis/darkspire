# Release handoff - 2026-09-10

Integration lead: Mendel 01a08bb5-b30a-7ca1-b97d-8d14b979cc18.

## Source and localhost

- `localhost:4173` is Python `http.server` PID 26724.
- It serves `C:\Users\joel\darkspire` byte-for-byte for `index.html` and `js/state.js`.
- A stale browser view is therefore cache or session state, not a stale serving directory.
- Safe refresh origin: `http://127.0.0.1:4173/`. Restart from `C:\Users\joel\darkspire`; preserve localStorage on that origin.

## Release work completed

- `scripts/build-release.js` now injects a content version, translucent `YYYY-MM-DD HHMM` publication label, and a dismissible `What changed` notice keyed by localStorage version.
- `js/state.js` now uses schema 3, filters retired card IDs from decks and combat piles, preserves a valid-save-only `darkspire_save_backup`, falls back from corrupt active saves, preserves the recovery checkpoint, and exposes a migration notice.
- `tests/persistence-migration.js` passes migration, retired-card filtering, backup recovery, and checkpoint-preservation checks.

## Release result

The missing `js/bug-report.js` runtime is now restored compatibly with `tests/bug-report.js`; the duplicate index reference is harmless because the release allowlist deduplicates it. The full release builder is green: all 15 suites pass and it produced `.release/94aec3c65d99257b` from source commit `af354efa373ad7a1206965b0764c7b8e313fb03d`.

Artifact metadata: version `incremental-94aec3c65d99257b`, publication label `2026-09-10 1545`, save schema `3`. The artifact contains the release metadata, translucent version label, and dismissible What changed notice.

## Release command

```powershell
$env:RELEASE_PUBLISHED_AT=(Get-Date).ToString('o')
& C:\Users\joel\tools\node-portable\node.exe scripts\build-release.js
```

The command must finish with all suites green before Mendel publishes. The generated `.release/<hash>/` artifact is the only publication input.

## Bug-report integration checkpoint — 2026-09-10

- The two reported blockers are resolved in the current worktree: `tests/bug-report.js` passes its floor assertion, and `tests/combat-depth.js` no longer fails during bug-report mounting against the minimal harness DOM.
- Full `scripts/build-release.js` passes all 15 suites and produced `.release/8b1e93ea415bf21e/` (`incremental-8b1e93ea415bf21e`, 63 runtime files) from source commit `af354efa373ad7a1206965b0764c7b8e313fb03d`.
- The reporter also restores the accepted local clipboard-copy action with success/fallback feedback; the DOM lookup is guarded for minimal harnesses.
- No commit, publication, or external transmission was made. Mendel should use the newest build artifact for any later release decision.

## Four-hero correction checkpoint — 2026-09-10 1814

- Party size is now hard four across campfire, caravan, run creation, selection UI, tutorial copy, town wording, and responsive campfire layout. Roster capacity is separate: a new campaign starts with four original heroes and capacity four; the first resolved run grants one roster berth, and tavern upgrades expand the roster only.
- Existing active five-hero saves are detected before run rehydration. The exact raw save is retained in `darkspire_recovery_checkpoint`; the active run is cleared and the player returns to campfire with the full meta roster, gear, build, and town progress untouched. A migration notice explains the repair. This avoids resuming an illegal party while keeping recovery evidence.
- Focused checks pass: `tests/campfire-smoke.js`, `tests/progression.js`, and `tests/persistence-migration.js`. The full `scripts/build-release.js` run passes all 15 suites.
- New release artifact: `.release/4d19090c47245ca5`, version `incremental-4d19090c47245ca5`, 63 runtime files, publication label generated at build time as `2026-09-10 1414` (the release timestamp is `2026-09-10T18:14:20.129Z`; the label uses local HHMM).
- The local source server is `C:\Users\joel\darkspire`, PID 29444, at `http://127.0.0.1:4173/`; `curl` byte comparison confirms served `index.html` matches source and the served `state.js` contains the five-hero migration gate. Refreshing this origin preserves its localStorage.
- Mendel publication input and command: publish only `.release/4d19090c47245ca5` after integrated checks; rebuild with `$env:RELEASE_PUBLISHED_AT=(Get-Date).ToString('o'); & C:\Users\joel\tools\node-portable\node.exe scripts\build-release.js`. No external deployment was executed by this workstream.

## Progression migration coordination — Heisenberg scope correction

- Progression owner Heisenberg is replacing birth-time kit variants with stable base-class identity and three meaningful player-chosen subclasses per class, each offering randomized skill options. Larger subclass pools are deferred.
- Legacy migration contract: do not infer or force a subclass from an old kit/signature/variant label. Preserve learned effects when they remain compatible with the new class tree; filter retired IDs; leave incompatible effects unassigned or reset only where the new schema requires it. Preserve hero level, gear, wounds, roster membership, and campaign progress.
- Bacon/state boundary: `state.js` continues to preserve run hero power/block/build snapshots and tolerant card migration; it must not select subclasses or rewrite progression trees. Mendel should integrate party-four/roster expansion with Heisenberg's final progression schema, then rerun the full build before same-URL publication.

## Subclass progression correction — 2026-09-10

- DONE in source: recruits are base-class identities only; starter kits still roll mechanically, but kit signatures are not shown as birth variants.
- DONE in source: every class exposes three distinct subclass paths through its skill tree. The first skill-point spend selects a path; later points are limited to that subclass. Skill node choices remain randomized within the class/path structure.
- DONE and tested: `tests/progression.js` covers null recruit subclass, three paths per class, first-choice selection, alternate-path lockout, kit variation, and persistence.
- DEFERRED by scope: larger recruit rolling pools and multiple simultaneous subclass options per hero beyond the three progression paths.
- PUBLISH STATUS: this correction is built locally and awaits the same-origin deployment below.

## Subclass release result — 2026-09-10 1820

- LIVE at https://joelgellis.github.io/darkspire/ as `incremental-c1669fcf84a18cb1`, publication label `2026-09-10 1820`, save schema 3, source commit `e61e8d070ee40f7ebe782576228aa6badf97ed3c`.
- GitHub Actions deployment `34513682807` completed successfully. Live manifest, headless browser DOM, identity gate, four-hero copy, skill runtime, bug-report launcher, version label, and no runtime syntax/reference errors verified.
- DONE: four-person expeditions and separate roster capacity; base-class recruits with variable starter kits; three progression-selected subclasses per class with randomized class/subclass skill options.
- DEFERRED: larger recruit rolling pools beyond the fixed three progression paths.

## Final subclass integration handoff (supersedes earlier completion report)
Progression finished and browser-verified the final mastery/migration/identity/UI fixes AFTER the earlier1820 release. All12 release suites pass; final held artifact incremental-e9ee051fe2a5ca4d (63 files). tests/subclasses.js covers24 paths/72 actual technique plays and meaningful mastery behavior. Desktop and390px native Chrome fixture PASS, chosen class visible, focus returns correctly. See .agent/PROGRESSION.md and docs/SUBCLASSES.md. Ownership released to Mendel. Rebuild/commit/publish same URL with actual HHMM; earlier c1669fcf84a18cb1 must not be claimed to contain these newer local changes. No publication by Progression.

STATUS RECHECK after user gogogo: runtime SHA-256 comparison against tested .release/e9ee051fe2a5ca4d reports ZERO changed runtime files;12 suites and native Chrome desktop/mobile evidence remain valid. No progression code/test blocker. Public release-manifest.json fetched directly still reports incremental-c1669fcf84a18cb1, label2026-09-10 1820, sourcee61e8d070ee40f7ebe782576228aa6badf97ed3c. Final progression edits remain uncommitted in shared worktree. Mendel: integrate/commit final files + new tests/subclasses.js and docs/SUBCLASSES.md; deploy same URL and verify live manifest. No independent publish; prior ownership release stands.

## Final publication — 2026-09-10 1911

- LIVE same origin: https://joelgellis.github.io/darkspire/ — `incremental-e9ee051fe2a5ca4d`, `2026-09-10 1911`, save schema 3, source `d185fbe3891e22c5ecf4ecfc18534e1f9255213f`.
- Deployment `34518833337` succeeded. All 12 release suites pass. Native Chrome desktop and 390px fixture checks pass per Heisenberg handoff; live headless DOM verifies four-party copy, skill runtime, migration hook, bug reporter, version label, and no runtime errors.
- Done/live: four-person party, separate roster capacity, base-class birth identity, three explicit player-chosen subclasses per class, randomized in-path skill options, mastery behavior and migration.
- Deferred/planned: larger recruit rolling pools.
