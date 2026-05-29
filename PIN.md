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
- **Position model:** soft **+2 value bonus** in a card's preferred position (NOT a hard gate).
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
3. ⬜ Gold economy + town merchant (gear-only)
4. ⬜ Retreat + damned-hero permadeath
5. ⬜ Loadout + equipment economy (lean start, salvage, take-home)

## Immediate next steps on unpin
1. Confirm the move-button agent's commit landed and is sane.
2. Joel playtests Phase 1 (badges 1–4, front/back targeting, repositioning cards, move buttons).
3. Then Phase 3: gold economy + town merchant (gear-only). `js/town.js`, `js/meta.js`, `js/caravan.js`
   already exist (dual gold: `DS.State.run.gold` in-run, `DS.Meta.gold` banked) — build on them.
