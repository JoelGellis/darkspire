# Darkspire Balance Sim Harness

A headless Monte-Carlo combat simulator for Darkspire. It runs the **real game
engine** (`js/combat.js`, `js/state.js`, `data/*.js`) — unmodified — thousands of
times per encounter and reports where the game looks too easy or too hard.

This is the Tier-B "Monte-Carlo combat sims" layer from
[`notes/sts-tuning-research.md`](../notes/sts-tuning-research.md): hold the deck
constant, throw it at every encounter pool, measure the deltas.

## Requirements

- **Node.js** (any modern version; built and verified on Node 24 LTS). No npm
  install, no dependencies — pure standard library (`vm`, `fs`, `path`).

> **Heads up:** this Windows laptop did **not** have Node on the PATH when the
> harness was built. If `node --version` fails for you, either:
> - install it once: `winget install OpenJS.NodeJS.LTS` (then reopen the terminal), or
> - grab a portable build (no admin, no PATH change) and call it by full path:
>   ```powershell
>   $ver="v24.16.0"; $url="https://nodejs.org/dist/$ver/node-$ver-win-x64.zip"
>   Invoke-WebRequest $url -OutFile "$env:TEMP\node.zip"
>   Expand-Archive "$env:TEMP\node.zip" "$env:TEMP\node-portable" -Force
>   & "$env:TEMP\node-portable\node-$ver-win-x64\node.exe" sims\run.js
>   ```

## Run it

From the repo root (`~/darkspire`):

```
node sims/run.js               # 1000 combats per encounter, prints tables + writes sims/REPORT.md
node sims/run.js --n 5000      # more samples = tighter win-rate confidence
node sims/run.js --seed 42     # reproducible batch (same draws + enemy rolls every run)
node sims/run.js --quiet       # skip the console tables, just (re)write REPORT.md
```

Default run is ~30k combats and finishes in well under a minute.

## What it does

For every encounter pool the game can spawn (`DS.Enemies.normal/elite/boss`), at
the floors where that pool actually appears in the map (normals on floors 1 & 5,
elites on floor 4, boss on floor 6), it runs N combats of the **default party**
— Fighter / Rogue / Cleric / Wizard, starting decks only — and records:

| Metric | Meaning |
|---|---|
| **Win%** | enemies cleared without a party wipe |
| **Wipe%** | entire party died |
| **Timeout%** | hit the 60-turn cap (a stall the greedy bot can't finish) |
| **Avg Turns** | mean combat length |
| **Avg HP Lost** | party max-HP minus HP remaining at end (net of healing) |
| **Any-Death%** | share of fights where ≥1 hero died |
| **Verdict** | TOO EASY / ok / hard / TOO HARD vs. starting-party expectations |

Results print as tables and are written to [`sims/REPORT.md`](REPORT.md) with
auto-generated headline findings.

## Files

- `loader.js` — the headless trick. Evals the unmodified game files in a Node
  `vm` sandbox with `window`/`document`/`setTimeout` shims, then overrides
  `DS.Combat.sleep` so the animation delays don't apply. See the comment block at
  the top for exactly what's stubbed and why.
- `policy.js` — the AI: greedy "play the highest-value affordable card, focus the
  front enemy," with trivial anti-waste guards. Deterministic given game state.
- `run.js` — orchestrates the batch, computes stats, prints tables, writes the report.
- `REPORT.md` — generated output (overwritten each run).

## Honest limitations

The bot plays the **raw starting deck with no progression** (no relics, reward
cards, upgrades, or repositioning) and is not a skilled human. So:

- Absolute win rates are a **lower bound** — a real, progressing party does better.
- The trustworthy signal is the **relative ordering** of pools: which encounters
  spike, which are pushovers, and how steep the floor-scaling curve is.

Full caveats are in the generated `REPORT.md`.
