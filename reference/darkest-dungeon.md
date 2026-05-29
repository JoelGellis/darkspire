# Darkest Dungeon (DD1, 2016) — Tactics Mechanics Reference

**Purpose:** A cited catalogue of the *original* Darkest Dungeon's tactical-positioning mechanics, to anchor Darkspire's horizontal 4-rank battlefield (4 heroes ranks 1–4, rank 1 = front; up to 4 enemies in ranks 1–4; cards favor positions; heroes move forward/back; enemies target front/back). Source facts come first; Darkspire-mapping callouts are a bonus.

**Research date:** 2026-05-29
**Primary source:** Official Darkest Dungeon Wiki (`darkestdungeon.wiki.gg`). The Fandom mirror (`darkestdungeon.fandom.com`) returned 403/404 during research and was not used as a primary source.

**Confidence legend:**
- `[VERIFIED]` — official wiki / game data
- `[COMMUNITY]` — player guide / analysis
- `[INFERRED]` — my extrapolation, flagged as hypothesis

> ⚠️ **Sourcing caveat:** Hero-ability rank icons on the wiki are rendered as colored dots (grey = unavailable, yellow = launch rank, red = target rank). I transcribed these from the wiki's fetched markup; where a value looked internally inconsistent I flag it in "Couldn't verify." All damage values are base (Resolve level 0) unless noted; they scale with hero level.

---

## 1. Positioning / Rank System

`[VERIFIED]` Both the hero party and the enemy group are arranged into **4 ranks, numbered 1–4**. Rank 1 of each side is closest to the enemy (the "front"); rank 4 is farthest back. Most units (all heroes, most enemies) are **size 1** and occupy a single rank; some larger enemies occupy **multiple ranks** at once. ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))

`[VERIFIED]` **Every combat skill defines two independent rank constraints:**
1. **Launch ranks** — the ranks the *user* must be standing in to use the skill (rendered yellow on the wiki). If the hero is in the wrong rank, the skill is greyed out and unusable.
2. **Target ranks** — the *enemy* (or ally) ranks the skill can hit (rendered red on the wiki).

This is the core tactical engine: a skill is only available when the user's current rank is a launch rank, and it can only reach the enemy ranks in its target set. ([Combat Skills / Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started); [Template:Rank](https://darkestdungeon.wiki.gg/wiki/Template:Rank))

`[VERIFIED]` Some attacks hit **multiple ranks at once**; a multi-rank unit is affected if the attack hits *any* rank it occupies, but is affected **at most once** per attack regardless of how many of its ranks are struck. ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))

`[COMMUNITY]` General heuristic: front-rank heroes (1–2) tend to be melee tank/DPS that can only reach enemy ranks 1–2; back-rank heroes (3–4) tend to be ranged support/stress that can reach the enemy back line. ([Steam: Significance of position in battle?](https://steamcommunity.com/app/262060/discussions/0/392183857631203204/))

### Iconic hero ability rank tables

Notation: **From** = ranks the user must occupy; **Target** = enemy/ally ranks reachable.

#### Highwayman — [wiki](https://darkestdungeon.wiki.gg/wiki/Highwayman) `[VERIFIED]`
| Ability | From | Target | DMG mod | Effect |
|---|---|---|---|---|
| Wicked Slice | 2–4 | 1–2 | +15% | Single-target melee |
| Pistol Shot | 1–3 | 2–4 | −15% | +25% DMG vs Marked (→+50% maxed) |
| Point Blank Shot | 4 | 1 | +50% | Knockback 1 (100% base) |
| Duelist's Advance | 1–3 | 1–3 | −20% | Forward 1, self-Riposte (3 rds) |
| Open Vein | 2–4 | 1–2 | −15% | Bleed; lowers target bleed-resist/SPD |
| Grapeshot Blast | 2–3 | multi (adjacent ranks) | −50% | Raises crit-received on targets (3 rds) |
| Tracking Shot (buff) | any | any | −80% | Removes stealth; big self ACC/CRIT/DMG buff |

#### Arbalest (back-line sniper/support) — [wiki](https://darkestdungeon.wiki.gg/wiki/Arbalest) `[VERIFIED]`
| Ability | From | Target | DMG | Effect |
|---|---|---|---|---|
| Sniper Shot | 3–4 | 1–4 | 4–8 base | +50% DMG vs Marked (→+100% maxed) |
| Sniper's Mark | 3–4 | 1–4 | none | Mark (3 rds), −20 DODGE |
| Suppressing Fire | 3–4 | 3–4 | −80% | −15 ACC, −15% CRIT to target (2 rds) |
| Bola | 3–4 | 3–4 | −50% | Knockback 1 (75%→~105% base) |
| Blindfire | 3–4 | random enemy | −10% | +3–4 SPD self (4 rds) |
| Rallying Flare | 3–4 | allies | — | Clear Stun, Stress −3 (67%), +Torch |

#### Vestal (flexible healer/holy DPS) — [wiki](https://darkestdungeon.wiki.gg/wiki/Vestal) `[VERIFIED]`
| Ability | From | Target | Value | Effect |
|---|---|---|---|---|
| Judgement | 1–2 | enemy 1–4 | self-heal 3–5 | Ranged attack, −25% ACC mod |
| Dazzling Light | 1–3 | enemy 1–3 | — | Stun (100%→140% maxed), +Torch |
| Mace Bash | 3–4 | enemy 1–2 | 4–8 | Bonus vs unholy |
| Hand of Light | 3–4 | enemy 1–3 | 4–8 | Self +6 ACC/+25% DMG (4 rds) |
| Divine Grace | 1–2 | self | heal 4–5→8–9 | Self-heal |
| Divine Comfort | 1–3 | adjacent allies + self | heal 1–3→4–5 | Party heal |

#### Hellion (front-line bruiser, also reaches back) — [wiki](https://darkestdungeon.wiki.gg/wiki/Hellion) `[VERIFIED]`
| Ability | From | Target | DMG | Effect |
|---|---|---|---|---|
| Wicked Hack | 1–2 (front-line)* | 1–2 | 6–12 | Basic melee |
| Iron Swan | 1 | 4 | 6–12 | Reaches the enemy *back* rank from front |
| If It Bleeds | 1–2 | 2–3 | −35% | Bleed 2/rd, 3 rds |
| Bleed Out | 1 | 1 | +20% | Bleed 3/rd, 3 rds; self −DMG/−SPD debuff |
| Breakthrough | 1–2 | 1–3 | −50% | Forward 1; self −10% DMG/−1 SPD (3 rds) |
| Barbaric YAWP | 1–2 | 1–4 | none | Stun (110%); −20% DMG/−3 SPD to enemies; 3 uses/battle |
| Adrenaline Rush | 1 | self | heal | Cure Blight/Bleed, +5 ACC/+20% DMG (4 rds) |

\* The fetch returned conflicting launch ranks for some Hellion skills (3–4 vs 1–2). Hellion is canonically a **front-rank** class (launches mostly from ranks 1–2); I have listed the front-rank interpretation. See "Couldn't verify."

#### Plague Doctor (back-line blight/utility) — [wiki](https://darkestdungeon.wiki.gg/wiki/Plague_Doctor) `[VERIFIED]`
| Ability | From | Target | Effect |
|---|---|---|---|
| Noxious Blast | 3–4 (ranged) | enemy 1–2* | Blight DOT + ACC debuff |
| Plague Grenade | 3–4 (ranged) | enemy 3–4* | Blight DOT (back-rank AoE) |
| Blinding Gas | 3–4 (ranged) | enemy 3–4 | Stun (AoE); 3 uses/battle |
| Incision | 1–2 (melee) | enemy 1–2 | Bleed |
| Disorienting Blast | 3–4 (ranged) | enemy 2–4 | Shuffle + Stun |
| Battlefield Medicine | 1–2 | one ally (any rank) | Cure Blight/Bleed, heal |
| Emboldening Vapours | any | all allies | +20% DMG, +3 SPD; 2 uses/battle |

\* The fetched target-rank icons for Noxious Blast (front) vs Plague Grenade (back) appear swapped relative to common play experience (Plague Grenade is the front-rank AoE, Noxious Blast the back-reaching one). Treat exact target sets as approximate — see "Couldn't verify."

> **Darkspire mapping:** Give each card two rank masks — a `fromRanks` set (which hero rank can play it) and `targetRanks` set (which enemy rank it can hit). A card greys out unless the hero sits in a `fromRank`. This single rule reproduces DD's entire positioning puzzle without any extra systems.

---

## 2. Movement / Repositioning

`[VERIFIED]` Four repositioning effects exist, split by who moves: ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))
- **Forward / Back** — move the *user or an ally* toward / away from the enemy (changes which rank they occupy).
- **Pull / Knockback** — the enemy-facing equivalents: Pull drags an enemy toward rank 1, Knockback shoves an enemy toward rank 4.
- **Shuffle** — randomizes a target's position among its side's ranks.

`[VERIFIED]` Because skills are launch-rank gated (§1), moving a hero into the "wrong" rank **disables the skills that can't launch from there** — e.g. a Highwayman knocked to rank 4 loses Wicked Slice/Open Vein (launch 2–4 — well, those still work) but a melee-only class shoved to the back is left with few or no usable skills. Repositioning is therefore both an offensive tool (knock the enemy healer to the front) and a threat (enemy shuffles your back-line healer into melee range). ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))

`[VERIFIED]` Concrete examples from §1: Highwayman **Point Blank Shot** Knockback 1 on the enemy; **Duelist's Advance** moves the Highwayman Forward 1 and arms Riposte; Hellion **Breakthrough** moves herself Forward 1; Arbalest **Bola** Knockback 1; Plague Doctor **Disorienting Blast** Shuffles the enemy line. ([Highwayman](https://darkestdungeon.wiki.gg/wiki/Highwayman); [Hellion](https://darkestdungeon.wiki.gg/wiki/Hellion); [Arbalest](https://darkestdungeon.wiki.gg/wiki/Arbalest); [Plague Doctor](https://darkestdungeon.wiki.gg/wiki/Plague_Doctor))

> **Darkspire mapping:** Movement effects are deck-design gold — a card that pushes an enemy back or pulls them forward changes *which other cards become legal next turn*. Mirror DD's two-sided model: Forward/Back affects your own heroes, Pull/Knockback affects enemies, Shuffle randomizes.

---

## 3. Enemy Rank Targeting

`[VERIFIED]` Enemies obey the same rank system as heroes: an enemy sits in ranks 1–4 (or spans several if large), and **its abilities are launch- and target-rank gated** exactly like hero skills. An enemy in the back rank can only use skills that launch from the back and reach the player ranks those skills allow. ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))

`[VERIFIED]` **Concrete example — Bone Soldier** ([wiki](https://darkestdungeon.wiki.gg/wiki/Bone_Soldier)):
- Occupies ranks **1, 2, 3**.
- **Graveyard Slash** (main melee): targets player ranks **1–2** (front-rank mauler); 3–8 DMG at Apprentice, scaling to 5–15 at Champion.
- **Graveyard Stumble**: used when it has been pushed to **rank 4**; targets player ranks **1–2** at lower accuracy (~42.5–62.5%), lower DMG (2–5 → 3–9), and **advances itself Forward 1** to get back into melee position.

This illustrates the archetype split the designer described: **front-rank maulers** (skeletons, brigand cutthroats) hit your ranks 1–2; **back-rank snipers/casters** (brigand fusiliers, cultist acolytes) sit in ranks 3–4 and reach your ranks 3–4 to snipe healers or pile on stress. `[COMMUNITY]` ([Steam: Does Enemy positioning matter?](https://steamcommunity.com/app/262060/discussions/0/3211505894125676158/))

`[INFERRED]` (hypothesis) The reason DD encourages killing/knocking the *back* enemy ranks first is that back-rank enemies carry most stress and disruption; pulling them forward strips their usable skills. This is design intent inferred from the targeting tables above, not an explicit wiki claim.

> **Darkspire mapping:** Enemy AI should pick from a rank-gated skill list each turn. Tag enemies as "mauler" (target player rank 1–2) or "sniper" (target player rank 3–4), and let the player's positioning + Pull/Knockback cards disrupt the enemy's legal-skill set — that's the whole tactical loop.

---

## 4. Stress / Affliction System

`[VERIFIED]` Each hero has a **Stress meter from 0 to 200**. ([Stress](https://darkestdungeon.wiki.gg/wiki/Stress))
- **Threshold 1 — 100 stress:** crossing 100 triggers a **Resolve Test**. The hero becomes either **Afflicted** (bad) or **Virtuous** (good). ([Stress](https://darkestdungeon.wiki.gg/wiki/Stress); [Affliction](https://darkestdungeon.wiki.gg/wiki/Affliction))
- **Threshold 2 — 200 stress:** **Heart Attack.** HP immediately drops to 0, placing the hero on **Death's Door**; if already on Death's Door, the hero **dies outright**. (A Virtuous hero is immune — instead they lose the Virtue and reset Stress.) Stress is reduced to ~170 after surviving a heart attack. ([Stress](https://darkestdungeon.wiki.gg/wiki/Stress); [Heart attack](https://darkestdungeon.wiki.gg/wiki/Heart_attack))

### Affliction vs Virtue odds `[VERIFIED]`
Base **25% Virtue / 75% Affliction** on a resolve test (the Virtue chance is a flat base 25%, independent of which affliction is then rolled). Each affliction starts at a **base weight of 4**, +2 weight on repeat acquisition (diminishing repeats). With the standard affliction pool, each individual affliction is roughly **~14%** of the afflicted outcome. ([Affliction](https://darkestdungeon.wiki.gg/wiki/Affliction)) — *Confirms the designer's "~75% / ~25%" figure.*

### Named afflictions (DD1) `[VERIFIED]`
| Affliction | Rough effect (from wiki summary) |
|---|---|
| Fearful | Lowers DMG; tends to cower/refuse risky actions; raises own stress |
| Paranoid | Distrusts party; refuses heals/buffs, inflicts stress on allies |
| Selfish | Refuses to help allies; lowers ACC/DMG |
| Masochistic | Seeks self-harm; wants to be hit; lowers DODGE |
| Abusive | Verbally attacks allies (stress dmg to party); altered ACC/DMG |
| Hopeless | Lowers ACC, DODGE, SPD; defeatist |
| Irrational | Erratic ACC/DMG/SPD changes |
| Rapturous (Crimson Court DLC) | A "positive-flavored" affliction; +DMG/+SPD, −DODGE |
| Refracted (Color of Madness DLC) | +stress taken, −SPD, +bleed/blight chance |

> Note: the per-affliction stat numbers above are paraphrased from the wiki's summary and the fetcher partly conflated some lines; treat the *direction* of each effect as reliable and the exact stat deltas as approximate — see "Couldn't verify." ([Affliction](https://darkestdungeon.wiki.gg/wiki/Affliction))

### Virtues (the ~25% good outcome) `[COMMUNITY]`/`[VERIFIED]`
The five virtues are **Stalwart, Courageous, Focused, Powerful, Vigorous** — each grants combat buffs (e.g. +DODGE/+resist, +ACC, +CRIT, +DMG, +stress-heal) for the rest of the fight and can shrug off further stress. ([Affliction](https://darkestdungeon.wiki.gg/wiki/Affliction))

### How stress is dealt & healed `[VERIFIED]` ([Stress](https://darkestdungeon.wiki.gg/wiki/Stress))
- **Camping skills** (on long expeditions) reduce party stress.
- **Town:** Abbey (meditation/prayer/flagellation) and Tavern (bar/gambling/brothel) remove **a large amount of stress** for gold + holding the hero a week.
- **Idle in estate:** recover **5 stress/week** (15/week with the Puppet Theatre district upgrade).
- **Critical hit on an active enemy:** heal **3 stress** to the critting hero.
- **Killing an enemy:** **50% chance** to heal **3 stress** to the killer.
- **Critical heal:** **3 stress** relief to the healed hero.
- **Hero abilities** that reduce stress: Crusader *Inspiring Cry*, Jester *Inspiring Tune*, Abomination *Absolution*, Vestal/Arbalest *Rallying Flare*-type effects, Houndmaster, etc.

> **Darkspire mapping:** A two-threshold Stress track (100 = roll Affliction/Virtue, 200 = death-trigger) is a clean second resource layered over HP. Wire stress-heal to crits and kills so aggressive play self-stabilizes, and make afflictions *temporary card/AI debuffs* (e.g. "Fearful: this hero's attack cards cost +1") rather than full loss-of-control if you want it less punishing than DD.

---

## 5. Other Tactical Systems Worth Abstracting

### Turn order / Speed (SPD) `[VERIFIED]`
Initiative is rolled each round; **higher SPD = higher chance to act earlier**. SPD is not a strict sort — it weights a per-round roll, so a fast unit usually but not always goes first. ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started))

### Hit formula: ACC vs DODGE `[VERIFIED]`
Hit chance = attacker **ACC** (skill base ACC + ACC mods) minus target **DODGE**. A displayed **95% is the cap** and is internally treated as a guaranteed hit. Each *consecutive miss* after the first grants **+4 ACC** on the next attempt (anti-miss-streak). ([Getting Started](https://darkestdungeon.wiki.gg/wiki/Getting_Started); [Glossary](https://darkestdungeon.wiki.gg/wiki/Glossary))

### Critical hits `[VERIFIED]`
A crit deals **150% of the skill's *maximum* damage** (heroes and enemies). Status effects applied on a crit get **+20% apply chance**, and Bleed/Blight applied on a crit last **50% longer (rounded up, ~+2 turns)**. Crits also heal stress (§4). ([Critical Hit](https://darkestdungeon.wiki.gg/wiki/Critical_Hit); [Status effects](https://darkestdungeon.wiki.gg/wiki/Status_effects))

### DOT — Bleed & Blight `[VERIFIED]`
Both tick **at the start of the affected unit's turn**, **ignore Protection (armor) points**, and last a **default 3 turns** (→5 turns when applied on a crit). They stack as independent instances until each expires. Bleed is resisted by Bleed resist, Blight by Blight resist. ([Status effects](https://darkestdungeon.wiki.gg/wiki/Status_effects))

### Token-style mechanics `[VERIFIED]` ([Status effects](https://darkestdungeon.wiki.gg/wiki/Status_effects))
- **Guard:** guardian takes hits meant for the guarded ally; guard typically lasts 1–2 turns (with an accompanying defensive buff ~3 turns); **breaks if the guardian is stunned**; can't guard more than one ally at once.
- **Mark:** cannot be resisted; deals no damage itself; flags a target so "vs Marked" skills deal bonus damage and enemy AI may focus it.
- **Stun:** skips the target's next turn (lasts ~1 turn); on wearing off the target gains **50% Stun resist** for a turn, stacking toward 100% on repeated stuns.
- **Riposte:** the unit counter-attacks **any** incoming attack, whether it hits or misses; only some heroes/monsters have it; synergizes with Guard.

### Death's Door `[VERIFIED]` ([Death's Door](https://darkestdungeon.wiki.gg/wiki/Death's_Door_(Darkest_Dungeon)))
- A hero hitting **0 HP** is **not killed** — they enter **Death's Door** (the "one buffer" state). They die only if they take **further damage** and **fail a Deathblow resist check**.
- **Base Deathblow resist = 67%**, i.e. **~33% chance to die** on each additional hit while at 0 HP. (Flagellant base is 73%.) Resist is **not** improved by Resolve level, only trinkets/quirks; it **caps at 87%**.
- **While on Death's Door:** −10 ACC, −25% DMG, −5 SPD, **+33% Stress damage taken**. There is **no** damage reduction granted by being on Death's Door.
- On being healed off Death's Door, a softer "recovery" debuff applies: −2 ACC, −5% DMG, −1 SPD, +10% Stress (until it clears).

> **Darkspire mapping:** Death's Door is a great "one free hit" mechanic — at 0 HP a hero survives but each subsequent hit rolls a ~33% deathblow. Combined with the offensive debuffs, it pressures the player to heal *now* without an instant-loss feel. Crit = 150% of *max* damage is a punchy, simple crit rule worth copying.

---

## Sources

- Getting Started (positioning, movement, SPD, ACC/DODGE, multi-rank rules): https://darkestdungeon.wiki.gg/wiki/Getting_Started
- Template:Rank (launch/target rank rendering): https://darkestdungeon.wiki.gg/wiki/Template:Rank
- Highwayman skills: https://darkestdungeon.wiki.gg/wiki/Highwayman
- Arbalest skills: https://darkestdungeon.wiki.gg/wiki/Arbalest
- Vestal skills: https://darkestdungeon.wiki.gg/wiki/Vestal
- Hellion skills: https://darkestdungeon.wiki.gg/wiki/Hellion
- Plague Doctor skills: https://darkestdungeon.wiki.gg/wiki/Plague_Doctor
- Bone Soldier (enemy rank/targeting example): https://darkestdungeon.wiki.gg/wiki/Bone_Soldier
- Stress (meter, thresholds, healing): https://darkestdungeon.wiki.gg/wiki/Stress
- Affliction (odds, named afflictions, virtues): https://darkestdungeon.wiki.gg/wiki/Affliction
- Heart attack (200-stress effect): https://darkestdungeon.wiki.gg/wiki/Heart_attack
- Death's Door (DD1) (deathblow chance, penalties): https://darkestdungeon.wiki.gg/wiki/Death's_Door_(Darkest_Dungeon)
- Status effects (Bleed/Blight/Guard/Mark/Stun/Riposte): https://darkestdungeon.wiki.gg/wiki/Status_effects
- Critical Hit: https://darkestdungeon.wiki.gg/wiki/Critical_Hit
- Glossary (ACC/DODGE terms): https://darkestdungeon.wiki.gg/wiki/Glossary
- Steam — Significance of position in battle (community): https://steamcommunity.com/app/262060/discussions/0/392183857631203204/
- Steam — Does Enemy positioning matter (community): https://steamcommunity.com/app/262060/discussions/0/3211505894125676158/

---

## Couldn't verify

- **Exact per-affliction stat deltas.** The wiki lists each affliction, but the fetched summary partly conflated/duplicated stat lines (e.g. Fearful and Paranoid showed identical numbers, which is likely a fetch artifact). Effect *directions* are reliable; exact ±DMG/±DODGE/±SPD per affliction need a direct read of the Affliction page's table.
- **Hellion launch ranks.** Fetch returned conflicting launch ranks (some skills shown as 3–4). Hellion is canonically front-rank (launches mostly from 1–2); I listed the front-rank interpretation. Verify Wicked Hack / If It Bleeds / Breakthrough launch ranks directly.
- **Plague Doctor target ranks** for Noxious Blast vs Plague Grenade appeared possibly swapped vs in-game behavior (which is front-AoE vs back-reaching). Exact target masks should be re-read from the PD wiki table.
- **Exact "75%/25%" split nuance.** Wiki states a flat base 25% Virtue chance; some community sources cite quirk/trinket modifiers that shift it. The base figure is verified; modified real-game odds vary per hero.
- **Stress reset value after heart attack** (cited ~170) came from a summary line, not a hard table; treat as approximate.
- Some hero damage values are base/level-0 and scale with hero rank and Resolve; I did not catalogue full per-level scaling tables.
