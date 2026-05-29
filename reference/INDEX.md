# Darkspire Reference Catalogue — INDEX

A local, **cited** database of real numbers from Darkspire's three source games, so you can pull
accurate values fast when designing or balancing. Built 2026-05-29. Every number in these files
carries an inline source (wiki URL or SRD section) — uncited numbers were omitted, not guessed.

This catalogue is the artifact requested by the **Content Sourcing Principle** in `../DESIGN.md`
(and the "Reference-data database TODO" in `../PIN.md`): triangulate from three sources —
**D&D for flavor · Darkest Dungeon for tactics · Slay the Spire for balance numbers** — then
abstract / "find the mean," never copy one wholesale.

---

## What's where

| File | Source game | What it gives you | Use it for |
|---|---|---|---|
| [`sts.md`](sts.md) | **Slay the Spire** | Card energy costs & damage/block curves (common→uncommon→rare), the "1 energy ≈ 5-6 value" yardstick, gold economy (rewards, shop prices, removal cost), enemy HP curves (Acts 1-4 + the Heart), difficulty/win-rate targets | **Balance numbers** — tuning card values, shop prices, enemy HP, gold flow |
| [`darkest-dungeon.md`](darkest-dungeon.md) | **Darkest Dungeon (DD1)** | Rank/positioning rules (launch ranks + target ranks), iconic hero abilities with from-rank/target-rank/effect, movement & repositioning, enemy rank-targeting, the Stress→Affliction system, combat math (Death's Door, deathblow %, ACC-DODGE, crit) | **Tactics mechanics** — the position system, repositioning cards, enemy targeting, status/affliction design |
| [`dnd-5e.md`](dnd-5e.md) | **D&D 5e SRD** (license-clean) | 12 class names + hit dice + SRD subclass, weapon damage dice + damage types, iconic spell dice, ~20 monsters (CR→HP→AC→attack), the full Monster-Statistics-by-CR table (CR 0-10), ~15 magic-item names by rarity | **Flavor** — naming heroes/monsters/gear, picking damage dice, HP-by-CR baselines for enemy scaling |
| [`data.json`](data.json) | all three | Machine-readable mirror of the headline numbers from all three files, each with a `source` URL | Scripts, sims, the future balance pipeline (`notes/sts-tuning-research.md` §2) — pull numbers programmatically instead of re-parsing markdown |

## Related docs (outside reference/)
- `../notes/sts-tuning-research.md` — the StS *tuning process* (metrics-driven design, the AI-self-play
  balance protocol). `sts.md` is the **numbers**; that file is the **method**. They pair.
- `../DESIGN.md` → "Content Sourcing Principle" — why this catalogue exists.

## Confidence legend (used across all files)
- `[VERIFIED]` — from game files / official-grade wiki data tables / the SRD.
- `[COMMUNITY]` — player or analyst data, third-party analysis (not the devs/official).
- `[INFERRED]` — a reasonable extrapolation; treat as hypothesis, not fact.

## Sourcing notes (read before trusting a number cold)
- **StS:** the Fandom wiki blocks automated fetch (HTTP 403), so numbers came from the
  **slaythespire.wiki.gg** mirror (same game-files-derived tables). Win rates are `[COMMUNITY]`
  (foxrow's 18M-run dataset).
- **Darkest Dungeon:** sourced from **darkestdungeon.wiki.gg** (DD1, not DD2). A few exact per-affliction
  stat deltas and two ability target-masks came back inconsistent in fetch and are flagged in-file —
  verify against a direct table read before hard-coding.
- **D&D 5e:** **open5e** SRD mirror + dndbeyond free rules. SRD-only is deliberate — it's the
  license-clean set, so borrowing names/numbers carries no IP risk. The CR table comes from faithful
  reproductions that agree cell-by-cell (no clean WotC URL exists).

## How to extend
Add a new source-game file as `reference/<game>.md`, mirror its headline numbers into `data.json`
under a new top-level key, and add a row to the table above. Keep the confidence legend and the
"every number cites its source" rule.
