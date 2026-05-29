# Slay the Spire Tuning Research → Darkspire Balancing Protocol

Research date: 2026-05-29. Purpose: model Darkspire's balancing process on Mega Crit's
real, data-driven tuning of Slay the Spire (StS).

**Source-confidence legend:**
`[VERIFIED]` = stated by the devs or in a primary write-up of their GDC talk.
`[COMMUNITY]` = from player/analyst data or third-party analysis, not the devs.
`[INFERRED]` = my reasonable extrapolation; treat as a hypothesis, not fact.

---

## 1. What Slay the Spire actually did

### 1.1 The core method: metrics-driven design

Anthony Giovannetti (Mega Crit co-founder) gave a GDC 2019 talk titled
**"Slay the Spire: Metrics Driven Design and Balance"** (~35 min). This is the
canonical primary source for everything below. The clearest written summary is the
Game Developer article "How Slay the Spire's devs use data to balance their roguelike
deck-builder."

`[VERIFIED]` The team's stated reason for going data-driven, in Giovannetti's words:
> "We have so many cards and so many interactions that even though we have a pretty
> strong card game background there's no way we can intuitively do it all correctly."

So the philosophy is: **designer intuition sets the starting point; data corrects it.**
They did NOT replace judgment with data — they used data to catch what intuition missed
across a combinatorial space too large to reason about by hand.

### 1.2 What telemetry they collected

`[VERIFIED]` Per the Game Developer write-up, the metrics that mattered most:

- **Pick rate** — how often a card is taken when it's offered as a reward choice.
- **Win rate** — how often a card appears in *winning* decks (i.e. decks that beat the run).
- **Damage taken** — average damage players sustained when using a given card against a
  given enemy (a per-encounter, per-card stat).
- **What players chose a card *over*** — the comparison context of a reward screen, not
  just the raw pick.

`[VERIFIED]` Scale of instrumentation grew massively. Casey Yano:
> "The first time we made our metrics, we had three graphs; now we have at least 90."

`[VERIFIED]` They started collecting in the **prototype phase** (Netrunner players hitting
a metrics server), but Early Access dwarfed it. Giovannetti:
> "In one hour we get more data than we had throughout the whole prototyping phase."

That is the central lesson: the **open Early Access data loop** is what made the tuning
possible. A real player base generates more signal in an hour than a closed test does in
months.

### 1.3 How they decided a card was over/underpowered

`[VERIFIED]` The two key signals:

- **Underpowered → low pick rate.** A card players almost never choose is, per
  Giovannetti, "basically not a card in our game." Low pick rate = dead content, flag for
  buff or redesign.
- **Overpowered → over-represented in winning decks.** If a card shows up too often in
  decks that win, it's distorting the meta and is a nerf candidate.

`[INFERRED]` Note the two metrics catch different failure modes. Pick rate catches
"nobody wants this." Win-rate-in-winning-decks catches "this is a default include / the
correct answer too often." A card can be picked a lot *and* be fine, or rarely picked but
a hidden bomb — you need both axes. The devs did not publish exact numeric thresholds; the
specific cutoffs are NOT publicly documented (see 1.7).

### 1.4 Case study they cited: Dual Wield

`[VERIFIED]` Walkthrough of one real tuning loop:
- Dual Wield was **strong but under-picked** (low pick rate despite power → a sign the
  value wasn't legible to players).
- They buffed it to duplicate *any* card in hand → it became **broken**: "You could copy
  skills and go infinite really easily."
- They re-restricted it to copy **Attack/Skill** cards only, killing the infinite.

This shows the cadence: change → watch data + playtest → over-corrected → pull back. They
expect to overshoot and iterate, not nail it in one patch.

### 1.5 Philosophy: fun vs. balanced, and "going infinite"

`[VERIFIED]` Giovannetti:
> "Going infinite is the number one thing we try to make really rare. It makes the actual
> playing of the game trivial."

The principle: a few overpowered *outliers are fine and even fun* — what they hunt and
kill is anything that **removes the game** (infinite combos that trivialize all decisions).
Power fantasy is good; turning the game off is not.

`[VERIFIED]` On qualitative feedback:
> "A single well-reasoned post is a lot more useful than lots of players saying 'nerf this'."

So: weight *reasoned* feedback over *volume* of feedback. Loud sentiment is noise; a clear
mechanism-level argument is signal. Data tells you *what* is wrong; a good post often tells
you *why*.

`[VERIFIED — Justin Gary podcast]` Giovannetti's two repeated mantras elsewhere: the core
loop is **"risk versus reward,"** and **"Playtest more than you think you need to."** Data
did not replace playtesting for them — it complemented it.

### 1.6 Iteration cadence

`[VERIFIED]` During Early Access they shipped **weekly patches**, and players understood
"the balance will change." `[VERIFIED]` The QA team got new builds **weekly**, "a mix of new
cards and old ones that have been altered somehow." `[VERIFIED]` Giovannetti credited
**watching streamers** play during EA as a major indirect feedback source (you see where
real players get confused / stuck / overpowered without them filing a report).

`[VERIFIED]` His closing endorsement:
> "Any other game I make going forward I'd do something similar, and I'd recommend other
> indies to use it whenever they can."

### 1.7 Numbers and rules of thumb — what's real vs. folklore

- `[COMMUNITY]` **Strike = 6 damage / 1 energy; Defend = 6 block / 1 energy.** This is the
  baseline starter-card ratio, observable in-game. It is widely treated as the "1 energy ≈
  6 value" yardstick by the community. **NOT confirmed as a stated dev formula** — it's an
  observed pattern. Use it as a sanity anchor, not gospel.
- `[COMMUNITY]` **~50% win rate at Ascension 20 even for top players** is the de-facto
  intended difficulty target for the hardest tier. Player data shows pros land roughly
  40–72% per character on A20 (e.g. one strong player: Ironclad 52% / Silent 40% /
  Defect 46% / Watcher 72% over last 50 each). This is a *target the community infers*,
  not a published dev spec — but it's a sound anchor: "best players ~coin-flip at max
  difficulty."
- `[COMMUNITY]` **Overall ~9% win rate** across ALL players and all difficulties (foxrow's
  analysis of 18M runs from 2020). Confirms that aggregate win rate is low because most
  runs are low-ascension / new players — so **you must segment by skill/ascension** or the
  numbers are meaningless.
- `[COMMUNITY]` Enemy lethality is tracked as **fatal rate** (% of encounters with that
  enemy that kill the player). The Heart (final boss) sits at ~47–52%; Time Eater /
  Automaton ~23–35%. This is exactly the kind of per-encounter stat the devs described as
  "damage taken vs. enemy."
- `[UNVERIFIED]` I found **no published dev statement** of exact pick-rate or win-rate
  *cutoff numbers* (e.g. "nerf anything above X%"). Anyone citing a hard threshold as
  Mega Crit's is almost certainly extrapolating. Treat specific cutoffs as our own design
  choice, not StS canon.

### 1.8 Sources

- GDC 2019 talk — *"Slay the Spire: Metrics Driven Design and Balance,"* Anthony
  Giovannetti. Video: https://www.youtube.com/watch?v=7rqfbvnO_H0 ;
  GDC Vault: https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics
- Game Developer — *"How Slay the Spire's devs use data to balance their roguelike
  deck-builder"* (primary written summary of the talk, with the key quotes):
  https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- Justin Gary podcast/interview with Anthony Giovannetti (#59):
  https://justingarydesign.substack.com/p/anthony-giovannetti-crafting-slay
- foxrow community statistical analysis (18M runs, 2020):
  https://foxrow.com/slay-the-spire-statistical-analysis
- Cloudfall Studios design reverse-engineering (downside/trade-off design):
  https://www.cloudfallstudios.com/blog/2020/11/2/game-design-tips-reverse-engineering-slay-the-spires-decisions
- A20 difficulty / win-rate context: https://www.kwansqualms.com/qualms/2025/2/19/sts ,
  https://www.thegamer.com/slay-the-spire-a20-tips-help/
- Energy / starter-card ratios: https://slay-the-spire.fandom.com/wiki/Energy

---

## 2. Darkspire statistical-iteration protocol

We are a solo-JS roguelike deckbuilder with **no player base yet**. We cannot get
"more data in an hour than the whole prototype phase." So we adapt StS's method to the
no-player-base reality: **the AI plays the game thousands of times instead of humans.**
This is the single biggest divergence from StS and the thing that makes this protocol work.

### 2.1 Translating StS's metrics to a solo JS game

StS logged real runs to a server. We log **every run to a JSON file / localStorage**, then
analyze it offline. Same metrics, different data source.

Instrument these per run (write one JSON record at run end to
`data/runs/<timestamp>.json`, or append to a single `data/run-log.ndjson`):

```jsonc
{
  "runId": "uuid",
  "timestamp": "ISO",
  "buildVersion": "0.x.y",      // CRITICAL: tag every run with game version
  "source": "ai-sim" | "self-play" | "human",
  "ascension": 0,               // or our difficulty tier
  "character": "id",
  "result": "win" | "death" | "abandon",
  "deathFloor": 12,
  "deathEnemy": "enemyId",
  "finalHp": 0,
  "floorsCleared": 24,
  "deck": ["cardId", ...],      // final deck composition
  "relics": ["relicId", ...],
  "cardChoices": [              // every reward screen
    { "floor": 4, "offered": ["a","b","c"], "picked": "b" | "skip" }
  ],
  "combats": [                 // per-fight outcome
    { "floor": 8, "enemy": "id", "hpLost": 14, "turns": 5, "won": true }
  ]
}
```

From this we derive the StS metrics directly:

| StS metric | Our derivation |
|---|---|
| **Pick rate** | times a card was `picked` / times it appeared in `offered` |
| **Win-rate-in-winning-decks** | of `result==win` runs, % whose `deck` contains the card |
| **Card win-rate delta** | win rate of runs containing card − overall win rate (segment by ascension) |
| **Damage taken vs enemy** | mean `hpLost` per `enemy` from `combats` |
| **Enemy fatal rate** | deaths to enemy / encounters with enemy |
| **Skip rate** | a card/relic offered and skipped a lot = dead content |

### 2.2 Bootstrapping balance WITHOUT players (the key adaptation)

Three escalating tiers, cheapest first:

**Tier A — Designer heuristics (instant, free).**
Anchor every card to an explicit value formula before it ships. Pick a baseline like StS's
`1 energy ≈ 6 "value points"` (damage, block, or equivalent). For each card compute
expected value/energy and flag anything that deviates without a justifying downside
(status card added, exhaust, situational, scaling-not-frontloaded). Keep a
`data/card-budget.json` spreadsheet-equivalent: `cost`, `rawValue`, `valuePerEnergy`,
`downside`, `tag`. This is our "intuition layer" — it catches gross errors before any sim.

**Tier B — Monte-Carlo combat sims (cheap CPU, no humans).**
Write a headless combat simulator in JS (reuse the actual combat engine, no rendering).
For a fixed deck vs. a fixed enemy, run N=1,000–10,000 fights with randomized draw order
and enemy AI, and record win %, avg turns, avg HP lost. Use this to:
- Validate single-card power: "swap card X for a Strike in this reference deck — does
  win% / HP-lost change a lot?" (marginal-value testing).
- Tune enemy numbers to a **target fatal rate** (see 2.4).
This is the closest thing to A/B testing we can do with zero players: hold the deck
constant, vary one card, measure the delta. **Do this; it's where most of our signal
comes from pre-launch.**

**Tier C — AI self-play full runs (more compute, best signal).**
Build a simple greedy/heuristic bot (or a small search) that plays *whole runs*: makes
card-reward picks via a scoring heuristic, plays combats via the Tier-B engine. Run
hundreds–thousands of full runs per build, tagged `source:"ai-sim"`. This yields real
**pick-rate and win-rate-in-winning-decks** numbers — the exact StS signals — without a
single human. The bot does NOT need to be optimal; it needs to be *consistent* so that
relative card strength shows up. (A naive bot that over-values a broken card is itself a
signal that the card is broken.)

**Caveat to log honestly:** AI-sim data measures *what the bot exploits*, not what humans
enjoy. It is great for finding **degenerate/infinite combos and dead cards**, weaker for
"is this fun." So: sims find the math problems; you + a few human self-play runs judge feel.

### 2.3 Thresholds for flagging cards (OUR choices — StS never published theirs)

Segment everything by difficulty tier; never look at a global blended number (the StS
~9% lesson). Suggested starting flags, to be tuned:

- **Dead card (buff/redesign):** pick rate **< 15%** when offered (across enough samples),
  OR appears in winning decks far below its offer rate.
- **Auto-include / likely overpowered (nerf candidate):** pick rate **> 70%** when offered
  *and* win-rate-of-runs-containing-it is **> +8 percentage points** above the segment's
  overall win rate.
- **Degenerate (top priority, hard nerf):** enables an infinite or pushes a reference-deck
  sim win% to **> ~95%**. Following StS — **killing infinites is priority #1.**
- **Enemy too swingy:** fatal rate way off its intended band (see 2.4).
- **Minimum sample gate:** don't act on a card with **< ~200 offered instances** /
  **< ~50 runs containing it** — small-sample noise will lie to you.

These numbers are starting guesses. Calibrate them against our own first few hundred sim
runs, then write the calibrated values back into this file.

### 2.4 Difficulty / win-rate targets (anchored to StS community data)

Set explicit target win-rate bands per difficulty tier and tune toward them:

- Easiest tier: **~70–80%** win for a competent line of play (sim bot or you).
- Mid tier: **~45–55%**.
- Hardest tier (our "A20"): **~40–55%** for *strong* play — i.e. a coin flip at the top,
  mirroring StS's de-facto A20 target.
- Per-enemy **fatal-rate band:** normal elites ~10–25%; act bosses ~20–35%; final boss
  ~45–55%. Tune enemy stats in Tier-B sims until they land in band.

### 2.5 Iteration cadence (solo + AI version of StS's weekly loop)

StS: weekly patch + weekly QA builds + stream-watching. Ours:

1. **Every change is version-tagged.** Bump `buildVersion`; every logged run carries it.
   Never compare runs across versions without the tag — this is the #1 way to fool yourself.
2. **Per balance pass (≈ weekly, or per feature):**
   a. Make the change (one logical change set, not ten random tweaks).
   b. Run the sim battery: Tier-B reference-deck tests for any touched card/enemy, plus a
      batch of Tier-C full runs (e.g. 500–2000).
   c. Pull the report: pick rates, win-rate deltas, fatal rates, flagged outliers.
   d. Compare against thresholds (2.3) and targets (2.4). Apply changes to the worst
      offenders only — **don't over-nerf.** StS expected to overshoot (Dual Wield) and
      pull back; so do we. One or two targeted changes beat a shotgun.
   e. Do **3–10 human self-play runs** for *feel* — the thing sims can't measure.
   f. Append a one-line entry to a `notes/balance-log.md`: version, what changed, why,
      the metric that triggered it. (This is our "patch notes + rationale" trail.)
3. **Build the analysis script once** (`scripts/analyze-runs.js`): read the run log, emit
   the tables in 2.1. Re-run it every pass. This is our equivalent of StS going from
   "3 graphs to 90" — start with the few that matter (pick rate, win-rate delta, fatal
   rate), add more only when a question demands it.
4. **When a real player base eventually exists:** flip `source` to `"human"`, keep the
   identical pipeline, and weight human data above sim data. The infrastructure doesn't
   change — only the data source gets better.

### 2.6 Guardrails (the StS philosophy, encoded as rules for us)

- **Intuition first, data corrects.** Don't outsource design to the bot; use it to catch
  what we missed.
- **Hunt infinites above all.** Anything that trivializes the game ("going infinite") is
  the top nerf target, even if it's "fun" for one run.
- **Outliers are OK; game-removers are not.** A few strong cards are good. Cards that make
  decisions irrelevant are bad.
- **Reasoned argument > volume.** One clear "here's the mechanism that's broken" beats a
  pile of "this feels OP." (For us, solo: a clear sim result beats a vibe.)
- **Segment by difficulty, gate on sample size, tag by version.** Three ways to avoid
  lying to ourselves with our own data.
- **Small, targeted patches; expect to overshoot and revert.** That's the loop, not a
  failure of it.
