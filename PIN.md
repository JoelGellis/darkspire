# DARKSPIRE — SESSION PIN

> **Trigger:** When Joel says **"Darkspire Unpin"** in a new session, read this file + `DESIGN.md`
> to resume exactly here. This pin captures the state as of **2026-05-29**.

## What Darkspire is
Browser roguelike deckbuilder, "ROG Slay the Spire × Darkest Dungeon." Vanilla JS, no build
step — open `index.html`. Repo: `~/darkspire/` (Windows laptop) → GitHub `JoelGellis/darkspire`.
**Full design vision is in `DESIGN.md`, section "v0.2 DIRECTION" — that is the source of truth.**

## Where we are (the big picture)
This session = a live design brain-dump from Joel + the start of the build. The headline move:
an Apr-10 experiment had **removed the tactical position system**; Joel decided to **keep positions**,
so we **rebuilt them** on top of the (kept) Apr-10 visual overhaul.

### DONE & committed (Phase 1 — position system)
- `0bfec58` = safety checkpoint of the Apr-10 working tree (visual overhaul + position removal). Recoverable.
- `46617c2` = last commit that still HAD positions (reference for the rebuild).
- `fb3d29a` = restored position **engine + card data + state + relics** (combat.js/state.js only ever
  differed by position code, so restored wholesale; cards restored to position-flavored versions).
- `4e490e3` = position-aware **battlefield rendering** (heroes/enemies sorted by live pos, numbered badges).

### Also DONE (move buttons)
- `412a66c` = per-hero **move buttons** (▶ advance toward enemies / ◀ retreat) on each living hero,
  player-turn only, energy-cost aware (free with Position Boots). Calls `DS.Combat.moveHeroAction`.
  **Needs a human in-browser glance:** layout fit on narrow cards, and disabled-button click semantics.

## Decisions locked this session
- **Position model (UPDATED 2026-05-29, `e52eb68`):** position is a **HARD GATE** (Darkest-Dungeon
  rank lock) — a card is unplayable unless its hero's live pos ∈ `card.prefPos`. Reverses the
  earlier "soft +2 bonus, not a gate" call. UI: red border + corner rank badge on locked cards.
  Repositioning (move buttons / Shadow Step etc.) is now mandatory strategy, not optional.
- **Battlefield:** horizontal, 4 heroes vs ≤4 enemies. Hero pos 1 = front (rightmost, near enemies)…
  pos 4 = back. Enemy pos 1 = front (leftmost, near player). Enemy pos = spawn order.
- **4 mechanic cards:** Shadow Step = move forward; Smoke Bomb = block + swap-with-ally; Wizard
  Teleport = swap two heroes; Paladin Retribution = Pos-1-only bonus block. (`Shadow Step+` bug auto-fixed.)
- **Tune later, not by gut:** ship the coherent old kit, balance from playtest/sim data.

## Vision captured in DESIGN.md (not yet built — these are the remaining phases)
- **Gold economy:** single currency, banked to town between runs. Spends on (a) town upgrades,
  (b) **town merchant = same merchant as runs, GEAR/artifacts ONLY** (no cards, no card-removal in town).
- **Retreat & permadeath:** first run = forgiving auto-retreat, keep all heroes+gains; later runs =
  manual retreat banks a % of gains; heroes who die are lost + their equipped gear lost. Level-0 boss rotates.
- **Loadout/equipment:** lean partial-equip at run start + 1–2 party artifacts (roguelike, not RPG).
  Equipment shapes the starting deck (some items inject hero-flavored cards). Build mid-run at shop;
  **salvage** items for partial gold (rate TBD, ~50–60% so cheap gear has a burn cost). Standout
  rare/legendary = take-home, becomes a selectable loadout item next run. Cards = hero actions.
- **Content sourcing:** D&D for flavor · Darkest Dungeon for tactics · Slay the Spire for balance numbers.
- **Statistical iteration:** no player base → the AI plays the game (Monte-Carlo combat sims + self-play
  bots) to generate balance data. See `notes/sts-tuning-research.md`.
- **Reference-data database (requested 2026-05-29, not yet built):** compile a local, easily-accessible,
  **cited** set of reference files cataloguing card types, damage numbers, dice mechanics, and stats from
  the source games (D&D, Darkest Dungeon, Slay the Spire). Goal: fast context to pull real numbers when
  designing/balancing. Keep official + updated. Likely lives in `~/darkspire/reference/` as structured
  markdown/JSON, with source citations. (Extends the Content Sourcing Principle.)

## Reference docs in repo
- `DESIGN.md` — source of truth (v0.2 DIRECTION section).
- `notes/card-audit.md` — every card changed Apr-10, keep/restore decisions.
- `notes/sts-tuning-research.md` — Slay the Spire's tuning process + our proposed iteration protocol.

## Task list (5 phases)
1. ✅ Rebuild position system  ·  2. ✅ Reconcile cards
3. ✅ Gold economy + town merchant (gear-only)  — `6398af0`. Town merchant = same merchant,
   GEAR ONLY (no cards/removal). Banked `DS.Meta.gold`, `DS.Meta.ownedGear` persists w/ save
   backfill, placeholder `DS.Gear.catalog`. **Phase-5 TODOs:** gear effects, loadout wiring, salvage.
4. ⬜ Retreat + damned-hero permadeath
5. ⬜ Loadout + equipment economy (lean start, salvage, take-home)

## Tooling landed (2026-05-29, three-window fan-out)
- **`reference/`** (`98b94e0`) — cited reference-data DB: `sts.md`, `darkest-dungeon.md`,
  `dnd-5e.md`, `data.json`, `INDEX.md`. Real numbers for balancing. **Use this before tuning.**
- **`sims/`** (`01807aa`) — headless Monte-Carlo balance harness. Runs the REAL combat engine.
  `node sims/run.js` (1000/encounter), `--n 5000`, `--seed 42`. Output → `sims/REPORT.md`.
- **node is portable, NOT on PATH:** `C:\Users\joel\AppData\Local\Temp\node-portable\node-v24.16.0-win-x64\node.exe`
  (in Temp — may get wiped; reinstall/relocate if sims stop running).

## Balance findings from first sim (starting party, no progression — relative signal only)
- **Boss variance is the #1 problem:** floor-6 win% spread 74.8% — Spider Queen 13.9% (too hard) vs
  Iron Golem 88.7% (too easy). Whichever boss you draw swings the run too hard. **Compress this.**
- **21 normals trivial** (100% win, ~0% death) — most fights are no-stakes/flat.
- Caveat: greedy bot, starter decks only, no repositioning/relics → absolute win% is a *lower bound*;
  trust the *relative* ordering. F5/boss numbers = "unupgraded party vs scaled fight," not live runs.

## Balance pass progress
- ✅ **Boss variance fixed** (`6819f6a`): spread 74.8% → 28%. Iron Golem 88.7%→48.8%
  (+HP, 2nd attack), Spider Queen 13.9%→20.6% (dropped Spiderling poison-on-death, PSN 3→2).
  All 4 bosses now 20–49%. **Feel-check against real playtest before trusting** (sim = greedy
  bot, no relics/reposition → lower bound).
- ✅ **Sim AI repositions** (`4424690`): conservative — moves only to un-stick a hero with no
  playable card, never swaps a working neighbor (greedy moves scrambled the ideal line and tanked
  win rates). Valid proxy under the gate now.
- ✅ **Repositioning cards verified** (code-correct): Shadow Step (dmg+moveForward), Smoke Bomb
  (block+swap ally pos), Teleport (swap w/ frontmost), Retribution (dmg, +6 block only at pos 1).
- ⛔ **BLOCKED ON JOEL — difficulty-curve decision.** The hard gate ~quartered win rates (bosses
  2–12%, floor-5 normals too hard for a starter party). Options: (a) re-tune enemies DOWN across the
  board, (b) soften the gate (free/cheaper moves, or only SOME cards gated), (c) accept it (real runs
  have relics/upgrades the sim lacks → sim is a lower bound). **Do NOT auto-tune the whole game vs an
  unupgraded bot — that would make the real, progressed game trivial.** Await Joel's pick.
- ✅ **Dead-hero rank collision fixed** (`5af0d50`): move actions now swap with whoever holds the
  adjacent rank (alive or dead), keeping positions a clean 1..N permutation. Sim unchanged (no regr).
- ⬜ Next autonomous-safe item: **Phase 4 scaffolding** (retreat + damned-hero permadeath) per
  DESIGN.md. Rules are well-specified there; the only open param is the manual-retreat bank %
  (~50% default, flag for Joel). Touches state.js/main.js/ui.js. (Deck-size limit deferred — needs a
  spec, not autonomous.)

## UI fixes landed (2026-05-29, from playtest feedback)
- Combat battlefield: was rendering **vertical** + combat-log **over the enemies** — killed a dead
  `#heroes-panel{flex:1;flex-direction:column}` rule beating `.stage-heroes` on ID specificity;
  reserved a 195px right gutter for the log overlay (`a5677bb`).
- Map: nodes were **unclickable** (tall 500×700 canvas overflowed under header/footer, which ate
  clicks) — canvas now scales to fit (`a5677bb`). Added **hover feedback** (pointer + white ring on
  clickable nodes, shared hit-test w/ click — `3895202`) as a diagnostic + UX win.

## Immediate next steps on unpin
1. Joel playtests Phase 1 + Phase 3 (badges 1–4, targeting, reposition cards, move buttons;
   town → Merchant → buy gear → gold banks) + the rebalanced bosses.
2. Background loop continues the trivial-normals stakes pass (data/enemies.js → sims → compare).
3. Then Phase 4: retreat + damned-hero permadeath.
