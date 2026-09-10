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
