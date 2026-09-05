# Campfire verification

## Shared-world interface checks

Also run `C:\Users\joel\tools\node-portable\node.exe tests/world-smoke.js`. This checks 100 map generations, available-node rendering, every enemy's art mapping, shared hero exports, escaped/dead party labels, direct-file card-art URLs and runtime asset boundaries. It is a small DOM-contract harness, not a substitute for browser layout checks.

The same isolated fixture URL now also accepts `town`, `map`, `combat`, `boss`, `reward`, `rest`, `train`, `purge`, `shop`, `event` and `summary`. `world-fixture.js` starts real engine state at those destinations after the normal boot, and is never loaded by production. `boss` opens an Iron Golem combat. Reloading resets the in-memory campaign. Visual checks and manually exercised flows are recorded in `.agent/STATE.md`.

## Original campfire checks

Run from the repository root:

```powershell
& C:\Users\joel\tools\node-portable\node.exe tests/campfire-smoke.js
```

This loads the actual scripts in `index.html` order and checks party selection/removal/ranks, recruitment on embark, the 32-card run, save/resume with rehydrated effects, death/refill, full roster, wipe, corrupt saves, and runtime asset paths. It uses in-memory storage and no-op render calls. It does not claim to test browser layout or complete gameplay balance.

Browser fixtures require a local server, e.g. `python -m http.server 8765 --bind 127.0.0.1` in the repository. Visit `http://127.0.0.1:8765/tests/campfire-fixtures.html?state=returning`. Supported states: `fresh`, `returning`, `full`, `empty`, `resume`, `corrupt`, `long`. The fixture fetches the actual entry point and substitutes storage before game scripts run; normal campaign saves are never read or overwritten. Reloading resets the fixture. No test code is loaded by normal `index.html`.

The visual layer and these integration checks depend on the pre-existing August gameplay wave, including `js/intro.js` and `data/gear.js`. That wave intentionally remains uncommitted: do not silently stage it with the visual slice. On a clean checkout before the gameplay wave is committed, `campfire-view.js` safely does nothing when `DS.Campfire` is absent; the campfire integration test requires that wave.

Browser checklist: select with click and Space/Enter; try a fifth pick; remove rank II; confirm later ranks compact; reselect and descend; verify resulting map party; resume a save; return through town; check the fallen and fresh replacements. Inspect desktop, 820 px and 390 px layouts, plus long names and empty/full rosters. Do not use the normal campaign's NEW GAME action for testing.
