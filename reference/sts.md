# Slay the Spire — Balance Numbers (Cited Reference)

A CITED catalogue of real Slay the Spire (StS) balance numbers — value yardsticks, card cost/value
curves, gold economy, enemy HP curves, and difficulty targets — to anchor Darkspire's own balance
decisions. Every number below carries an inline source. Numbers I could not verify are listed at the
bottom rather than guessed. Research date: **2026-05-29**.

**Source-confidence legend** (matches `notes/sts-tuning-research.md`):
`[VERIFIED]` = from the game files / official-grade wiki card-data tables (slaythespire.wiki.gg).
`[COMMUNITY]` = player/analyst data or third-party analysis, not the devs.
`[INFERRED]` = my reasonable extrapolation; treat as a hypothesis, not fact.

> Note on sources: the Fandom wiki (slay-the-spire.fandom.com) blocks automated fetching (HTTP 403),
> so exact numbers below were pulled from the community-run **slaythespire.wiki.gg** mirror, which hosts
> the same game-files-derived card/enemy data tables. Both are treated as `[VERIFIED]` for raw card/enemy
> stats. Win-rate metrics come from a community statistical analysis and are `[COMMUNITY]`.

---

## 1. Baseline Value Yardstick

The two starter cards define StS's whole value economy: **1 energy buys ~5–6 points of effect.**

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Energy gained per turn (baseline) | 3 | `[VERIFIED]` | [Energy](https://slaythespire.wiki.gg/wiki/Energy) |
| Cards drawn at start of each turn | 5 | `[VERIFIED]` | [Mechanics / Draw](https://slaythespire.wiki.gg/wiki/Draw) |
| Max hand size | 10 (excess discarded) | `[VERIFIED]` | [Draw](https://slaythespire.wiki.gg/wiki/Draw) |
| Strike — cost / damage | 1 energy → **6** dmg (9 upgraded) | `[VERIFIED]` | [Strike](https://slaythespire.wiki.gg/wiki/Strike) |
| Defend — cost / block | 1 energy → **5** block (8 upgraded) | `[VERIFIED]` | [Defend (Ironclad)](https://slaythespire.wiki.gg/wiki/Defend_(Ironclad)) |
| Bash (starter, 2-cost) | 2 energy → 8 dmg + 2 Vulnerable (10/3 upgraded) | `[VERIFIED]` | [Bash](https://slaythespire.wiki.gg/wiki/Bash) |

**The "1 energy ≈ X value" rule of thumb** `[COMMUNITY]`: the basic-card baseline is roughly
**6 damage per energy** (Strike) and **5 block per energy** (Defend). The community uses this as the
break-even line: a card that beats ~5–6 effect-per-energy is "above rate," and a card below it must pay
for itself with an attached effect (draw, debuff, scaling). Derived directly from the Strike/Defend
values above ([Strike](https://slaythespire.wiki.gg/wiki/Strike),
[Defend (Ironclad)](https://slaythespire.wiki.gg/wiki/Defend_(Ironclad))).

**Energy carryover** `[INFERRED]`: unspent energy is lost at end of turn (standard for the game; not
explicitly captured in the fetched Energy-page excerpt — flagged below in "Couldn't verify").

---

## 2. Card Energy Costs & Value Curves

All cards below are Ironclad (the baseline class) for apples-to-apples comparison. "Value/energy" is
the headline number (damage or block) divided by energy cost; X-cost and scaling cards are noted
separately because the simple ratio breaks down.

### 2a. Attack cards — damage scaling common → rare

| Card | Rarity | Cost | Base dmg | Upgraded | Dmg/energy (base) | Note | Source |
|---|---|---|---|---|---|---|---|
| Strike | Basic | 1 | 6 | 9 | 6.0 | starter yardstick | [link](https://slaythespire.wiki.gg/wiki/Strike) |
| Twin Strike | Common | 1 | 10 (5×2) | 14 (7×2) | 10.0 | above-rate; 2 hits | [link](https://slaythespire.wiki.gg/wiki/Twin_Strike) |
| Pommel Strike | Common | 1 | 9 | 10 | 9.0 | +draw 1 (2 upgraded) | [link](https://slaythespire.wiki.gg/wiki/Pommel_Strike) |
| Iron Wave | Common | 1 | 5 dmg + 5 block | 7/7 | 5.0 dmg (+5 blk) | hybrid attack | [link](https://slaythespire.wiki.gg/wiki/Iron_Wave) |
| Heavy Blade | Common | 2 | 14 | 14 | 7.0 | Strength counts ×3 (×5 upg) — scaling | [link](https://slaythespire.wiki.gg/wiki/Heavy_Blade) |
| Uppercut | Uncommon | 2 | 13 | 13 | 6.5 | +1 Weak +1 Vuln (2/2 upg) | [link](https://slaythespire.wiki.gg/wiki/Uppercut) |
| Whirlwind | Uncommon | X | 5 per hit (×X), AoE | 8 per hit | varies | X-cost AoE; spends all energy | [link](https://slaythespire.wiki.gg/wiki/Whirlwind) |
| Bludgeon | Rare | 3 | 32 | 42 | 10.7 | top single-target | [link](https://slaythespire.wiki.gg/wiki/Bludgeon) |

**Cost→value takeaway** `[VERIFIED]` from the table: at 1 energy the basic floor is 6 dmg; commons that
spend the same energy push to 9–10 (Pommel, Twin) but staple a downside or split the damage. At 2 energy
the rate climbs (Heavy Blade 14 = 7/energy, Uppercut 13 = 6.5 + debuff). At 3 energy the rare Bludgeon
hits 32 (≈10.7/energy) — rarity buys raw efficiency *and* a higher ceiling.

### 2b. Block / skill cards

| Card | Rarity | Cost | Base block | Upgraded | Block/energy | Note | Source |
|---|---|---|---|---|---|---|---|
| Defend | Basic | 1 | 5 | 8 | 5.0 | starter yardstick | [link](https://slaythespire.wiki.gg/wiki/Defend_(Ironclad)) |
| Shrug It Off | Common | 1 | 8 | 11 | 8.0 | +draw 1 | [link](https://slaythespire.wiki.gg/wiki/Shrug_It_Off) |
| Iron Wave (block half) | Common | 1 | 5 | 7 | 5.0 | also deals dmg | [link](https://slaythespire.wiki.gg/wiki/Iron_Wave) |

Block scales the same way: basic floor 5/energy, common Shrug It Off pushes to 8/energy *and* draws —
defensive cards "pay rent" the same way attacks do.

### 2c. Scaling cards & Powers (ratio doesn't apply — value compounds over turns)

| Card | Rarity | Type | Cost | Effect | Upgraded | Source |
|---|---|---|---|---|---|---|
| Inflame | Uncommon | Power | 1 | +2 Strength (permanent, this combat) | +3 | [link](https://slaythespire.wiki.gg/wiki/Inflame) |
| Demon Form | Rare | Power | 3 | +2 Strength at start of EVERY turn | +3 | [link](https://slaythespire.wiki.gg/wiki/Demon_Form) |
| Heavy Blade | Common | Attack | 2 | Strength affects damage ×3 (×5 upg) | — | [link](https://slaythespire.wiki.gg/wiki/Heavy_Blade) |

`[VERIFIED]` Powers invert the rate logic: Demon Form does *zero* immediate damage for 3 energy, but its
value is the integral over the fight (turn 1: +2 Str, turn 5: +10 Str). This is StS's core lesson for
Darkspire — **scaling cards are priced on expected combat length, not on turn-one value.**

---

## 3. Gold Economy

| Item | Value | Confidence | Source |
|---|---|---|---|
| Starting gold | 99 | `[VERIFIED]` | [Gold](https://slaythespire.wiki.gg/wiki/Gold) |
| Combat reward — normal fight | 10–20 | `[VERIFIED]` | [Gold](https://slaythespire.wiki.gg/wiki/Gold) |
| Combat reward — elite | 25–35 | `[VERIFIED]` | [Gold](https://slaythespire.wiki.gg/wiki/Gold) |
| Combat reward — boss | 95–105 (71–79 at high Ascension) | `[VERIFIED]` | [Gold](https://slaythespire.wiki.gg/wiki/Gold) |

### Shop prices (Merchant) — `[VERIFIED]` [Merchant](https://slaythespire.wiki.gg/wiki/Merchant)

| Purchase | Price (base Ascension) | At Ascension 16 |
|---|---|---|
| Card — Common (colored) | 45–55 | 50–61 |
| Card — Uncommon (colored) | 68–83 | 75–91 |
| Card — Rare (colored) | 135–165 | 149–182 |
| Colorless card — Uncommon | 81–99 | 89–109 |
| Colorless card — Rare | 162–198 | 178–218 |
| Relic — Common / Shop | 143–158 | 157–173 |
| Relic — Uncommon | 238–263 | 261–289 |
| Relic — Rare | 285–315 | 314–347 |
| Potion — Common | 48–53 | 52–58 |
| Potion — Uncommon | 71–79 | 79–87 |
| Potion — Rare | 95–105 | 105–116 |

**Card Removal Service** `[VERIFIED]`: starts at **75 gold**, escalates **+25 gold per use** (tracked per
shop / per run). Fixed at 50 (no escalation) with the Smiling Mask relic.
[Merchant](https://slaythespire.wiki.gg/wiki/Merchant)

**Economy takeaway** `[INFERRED]`: one normal fight (~15g) ≈ one-third of a common card or one-fifth of a
removal. A removal (75g) costs ~5 normal fights' worth of gold — deck-thinning is deliberately expensive
relative to combat income, which is what makes the removal-vs-card-vs-potion shop decision tense.

---

## 4. Enemy HP Curves

HP ranges are the in-game roll ranges. Higher-Ascension column is the documented HP bump (A7+ for normals,
A8+ for elites, A9+ for bosses). All `[VERIFIED]` from slaythespire.wiki.gg enemy pages.

### Act 1

| Enemy | Type | HP (base) | HP (higher Asc) | Source |
|---|---|---|---|---|
| Red Louse | normal | 10–15 | 11–16 (A7+) | [link](https://slaythespire.wiki.gg/wiki/Louses) |
| Green Louse | normal | 11–17 | 12–18 (A7+) | [link](https://slaythespire.wiki.gg/wiki/Louses) |
| Jaw Worm | normal | 40–44 | 42–46 (A7+) | [link](https://slaythespire.wiki.gg/wiki/Jaw_Worm) |
| Cultist | normal | 48–54 | 50–56 (A7+) | [link](https://slaythespire.wiki.gg/wiki/Cultist) |
| Gremlin Nob | elite | 82–86 | 85–90 (A8+) | [link](https://slaythespire.wiki.gg/wiki/Gremlin_Nob) |
| Lagavulin | elite | 109–111 | 112–115 (A8+) | [link](https://slaythespire.wiki.gg/wiki/Lagavulin) |
| Sentry (each, ×3) | elite | 38–42 | 39–45 (A8+) | [link](https://slaythespire.wiki.gg/wiki/Sentry) |
| The Guardian | boss | 240 | 250 (A9+) | [link](https://slaythespire.wiki.gg/wiki/The_Guardian) |
| Hexaghost | boss | 250 | 264 (A9+) | [link](https://slaythespire.wiki.gg/wiki/Hexaghost) |
| Slime Boss | boss | 140 | 150 (A9+) | [link](https://slaythespire.wiki.gg/wiki/Slime_Boss) |

### Act 2 (scaling examples)

| Enemy | Type | HP (base) | HP (higher Asc) | Source |
|---|---|---|---|---|
| Byrd | normal | 25–31 | 26–33 (A7+) | [link](https://slaythespire.wiki.gg/wiki/Byrd) |
| Bronze Automaton | boss | 300 | 320 (A9+) | [link](https://slaythespire.wiki.gg/wiki/Automaton) |
| The Champ | boss | 420 | 440 (A9+) | [link](https://slaythespire.wiki.gg/wiki/The_Champ) |

### Act 3 + final boss

| Enemy | Type | HP (base) | HP (higher Asc) | Source |
|---|---|---|---|---|
| Time Eater | boss | 456 | 480 (A9+) | [link](https://slaythespire.wiki.gg/wiki/Time_Eater) |
| Corrupt Heart (Act 4 final) | boss | 750 | 800 (A9+) | [link](https://slaythespire.wiki.gg/wiki/Corrupt_Heart) |

**HP-curve takeaway** `[INFERRED]`: Act 1 normals sit at ~10–55 HP, elites ~80–110, the Act 1 boss
jumps to 140–250. Each act roughly doubles the boss wall (≈250 → ≈420 → ≈456 → 750 Heart). Ascension HP
bumps are small (single-digit to ~20 HP) — StS scales difficulty far more through enemy *damage/buffs*
than through raw HP. Darkspire should copy that: raise threat through mechanics, not HP inflation.

---

## 5. Difficulty Targets (raw numbers only)

> For the full metrics-driven tuning *process* (pick rate, win rate, telemetry loop), **see
> `notes/sts-tuning-research.md`** — this section is just the headline target numbers.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Overall aggregate win rate (all players, all ascensions) | **~9%** (1.6M wins / 18M runs, 2020 dataset) | `[COMMUNITY]` | [Fox Row analysis](https://foxrow.com/slay-the-spire-statistical-analysis) |
| Heart fatal rate (deadliest enemy), Ironclad | 51.12% | `[COMMUNITY]` | [Fox Row](https://foxrow.com/slay-the-spire-statistical-analysis) |
| Heart fatal rate, Silent | 47.64% | `[COMMUNITY]` | [Fox Row](https://foxrow.com/slay-the-spire-statistical-analysis) |
| Heart fatal rate, Defect | 52.75% | `[COMMUNITY]` | [Fox Row](https://foxrow.com/slay-the-spire-statistical-analysis) |
| Heart fatal rate, Watcher | 51.96% | `[COMMUNITY]` | [Fox Row](https://foxrow.com/slay-the-spire-statistical-analysis) |
| A20 win rate for strong players | **~50%** (community anchor; see note) | `[COMMUNITY]` | (could not pin to one citation — see below) |

**The "~50% at A20 for strong players" anchor** `[COMMUNITY]`: widely cited community design target —
Ascension 20 is tuned so that a *strong, experienced* player wins roughly half their runs (vs. ~9%
aggregate across everyone). I could not nail this to a single authoritative URL; documented streamer
A20 win rates I found ranged widely and A15 best-player rates run far higher (~94% over small samples).
Treat ~50% as the directional design intent, not a measured figure. (See "Couldn't verify" below.)

---

## Sources

- Energy — https://slaythespire.wiki.gg/wiki/Energy
- Draw / Mechanics — https://slaythespire.wiki.gg/wiki/Draw
- Strike — https://slaythespire.wiki.gg/wiki/Strike
- Defend (Ironclad) — https://slaythespire.wiki.gg/wiki/Defend_(Ironclad)
- Bash — https://slaythespire.wiki.gg/wiki/Bash
- Twin Strike — https://slaythespire.wiki.gg/wiki/Twin_Strike
- Pommel Strike — https://slaythespire.wiki.gg/wiki/Pommel_Strike
- Iron Wave — https://slaythespire.wiki.gg/wiki/Iron_Wave
- Heavy Blade — https://slaythespire.wiki.gg/wiki/Heavy_Blade
- Uppercut — https://slaythespire.wiki.gg/wiki/Uppercut
- Whirlwind — https://slaythespire.wiki.gg/wiki/Whirlwind
- Bludgeon — https://slaythespire.wiki.gg/wiki/Bludgeon
- Shrug It Off — https://slaythespire.wiki.gg/wiki/Shrug_It_Off
- Inflame — https://slaythespire.wiki.gg/wiki/Inflame
- Demon Form — https://slaythespire.wiki.gg/wiki/Demon_Form
- Gold — https://slaythespire.wiki.gg/wiki/Gold
- Merchant — https://slaythespire.wiki.gg/wiki/Merchant
- Louses (Red/Green Louse) — https://slaythespire.wiki.gg/wiki/Louses
- Jaw Worm — https://slaythespire.wiki.gg/wiki/Jaw_Worm
- Cultist — https://slaythespire.wiki.gg/wiki/Cultist
- Gremlin Nob — https://slaythespire.wiki.gg/wiki/Gremlin_Nob
- Lagavulin — https://slaythespire.wiki.gg/wiki/Lagavulin
- Sentry — https://slaythespire.wiki.gg/wiki/Sentry
- The Guardian — https://slaythespire.wiki.gg/wiki/The_Guardian
- Hexaghost — https://slaythespire.wiki.gg/wiki/Hexaghost
- Slime Boss — https://slaythespire.wiki.gg/wiki/Slime_Boss
- Byrd — https://slaythespire.wiki.gg/wiki/Byrd
- Bronze Automaton — https://slaythespire.wiki.gg/wiki/Automaton
- The Champ — https://slaythespire.wiki.gg/wiki/The_Champ
- Time Eater — https://slaythespire.wiki.gg/wiki/Time_Eater
- Corrupt Heart — https://slaythespire.wiki.gg/wiki/Corrupt_Heart
- Fox Row statistical analysis — https://foxrow.com/slay-the-spire-statistical-analysis

---

## Couldn't verify

- **A20 ~50% strong-player win rate** — no single authoritative citation found. It is a well-known
  community design anchor, but the hard public data I located was either aggregate (~9% all players) or
  A15 small-sample best-player rates (~94%), not a measured A20 strong-player figure. Listed as
  `[COMMUNITY]` directional intent only.
- **Energy carryover rule** — the fetched Energy page excerpt didn't explicitly state that unspent energy
  is lost at turn end. It is (standard game behavior), but not directly quoted from the source, so marked
  `[INFERRED]`.
- **Per-enemy fatal rates beyond the Heart** — Fox Row notes mid-tier enemies fall in a 12–35% fatal-rate
  band and lists Automaton/Time Eater behind the Heart, but I did not capture exact per-enemy percentages
  for those, so only the four Heart figures are quoted.
- **Fandom wiki direct fetch** — slay-the-spire.fandom.com returns HTTP 403 to automated requests; all
  raw stats above were sourced from the slaythespire.wiki.gg mirror instead (same game-files data).
