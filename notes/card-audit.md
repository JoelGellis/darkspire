# Card Reconciliation Audit — Position System Rebuild

Comparing the last position-system commit vs. the rebalance checkpoint, so we can decide per card: **keep new**, **restore old**, or **merge**.

- **OLD** = `46617c2` (positions intact; cards position-flavored)
- **NEW** = `0bfec58` (positions removed; cards rebalanced)

Source files: `data/cards.js` (fighter, rogue, cleric, wizard) and `data/heroes-barbarian-ranger.js`, `data/heroes-necromancer-paladin.js` (barbarian, ranger, necromancer, paladin). Upgrade variants live in `cards.js` `UPGRADE_DEFS`.

## How to read this

Two kinds of change happened in the Apr-10 pass:

1. **Position scaffolding removed everywhere.** *Every* card lost its `prefPos` array, and every hero lost `startPos`. This is universal and not listed per-card below (it's a given of rebuilding positions — you'll re-add `prefPos` regardless). What I *do* list is where positions leaked into the **description text or the effect logic**.
2. **Real changes** — value/effect/desc rebalances, and position *mechanics* baked into effects (move forward, swap, conditional pos bonuses).

**Legend for the "Decision flag" column:**
- 🟥 **POSITION MECHANIC** — old version used move/swap/pos-conditional logic. Genuine keep-vs-restore call.
- 🟨 **POS TEXT ONLY** — only difference is "Pos X only" stripped from desc; value/effect identical. Trivial: just re-add the gate when rebuilding.
- 🟦 **REBALANCE** — value/effect/cost changed, no position involved. The new numbers are the "good rebalance" you said to keep.
- ⬜ **NO REAL CHANGE** — only lost `prefPos`. Re-add prefPos and move on.

---

## Fighter

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Strike | 1c, 7 dmg, prefPos [1,2,3] | 1c, 7 dmg | prefPos removed only | ⬜ |
| Shield Block | 1c, 8 blk, [1,2] | 1c, 8 blk | prefPos removed only | ⬜ |
| Heavy Blow | 2c, 15 dmg, [1], "Pos 1 only" | 2c, 15 dmg | "Pos 1 only" text dropped; value same | 🟨 |
| Rally | 1c, 4 blk all, [1,2] | 1c, 4 blk all | prefPos removed only | ⬜ |
| Cleave | 2c, 6 dmg all, [1,2] | same | prefPos removed only | ⬜ |
| Taunt | 1c, 5 blk + taunt, [1] | same | prefPos removed only | ⬜ |
| Fortify | 1c, half-block min 3, [1,2,3] | same | prefPos removed only | ⬜ |
| Second Wind | 1c, heal 6 exhaust, [1,2] | same | prefPos removed only | ⬜ |
| War Cry | 1c, +2 Str exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Shield Bash | 2c, 8 dmg +2 Vuln, [1] | same | prefPos removed only | ⬜ |
| Whirlwind | 3c, 10 dmg all, [1], "Pos 1 only" | 3c, 10 dmg all | "Pos 1 only" dropped; value same | 🟨 |
| Iron Will | 1c, 12 blk exhaust, [1,2] | same | prefPos removed only | ⬜ |

**Fighter upgrade (+) notes:** `Heavy Blow+` OLD = "Deal 18. Pos 1-2." + `prefPos [1,2]`; NEW = "Deal 18 damage." (pos text + prefPos dropped, value identical). `Whirlwind+` OLD desc said "Pos 1 only", NEW dropped it. Both 🟨.

---

## Rogue

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Backstab | 1c, 8 dmg, [1,2,3] | same | prefPos removed only | ⬜ |
| Evade | 1c, 6 blk, [2,3,4] | same | prefPos removed only | ⬜ |
| Throwing Knife | 1c, 5 dmg any, [2,3,4] | same | prefPos removed only | ⬜ |
| **Shadow Step** | 1c, **4 dmg + move forward 1**, [2,3] | 1c, **6 dmg. Draw 1 card.** | Position move replaced with draw; dmg 4→6 | 🟥 |
| Flurry | 1c, 3×3 dmg, [1,2] | same | prefPos removed only | ⬜ |
| **Smoke Bomb** | 1c, **gain 4 Block + swap positions w/ ally**, target ally, [2,3,4] | 1c, **give ally 5 Block. Draw 1 card.** | Position swap removed; self-block→ally-block, +1 value, +draw | 🟥 |
| Poison Blade | 1c, 4 dmg +3 Poison, [2,3] | same | prefPos removed only | ⬜ |
| Fan of Knives | 2c, 3 dmg all, [3,4] | same | prefPos removed only | ⬜ |
| Nerve Strike | 1c, 3 dmg +2 Weak, [2,3] | same | prefPos removed only | ⬜ |
| Lacerate | 1c, 5 dmg +3 Bleed, [1,2,3] | same | prefPos removed only | ⬜ |
| Assassinate | 2c, 20 dmg exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Caltrops | 1c, 2 Poison all, [2,3,4] | same | prefPos removed only | ⬜ |

**Rogue upgrade (+) notes — BUG WORTH FLAGGING:**
- `Shadow Step+` in NEW (`0bfec58`) STILL reads **"Deal 7 damage + move forward 1."** — the base card was changed to draw-a-card but the upgrade text was never updated. Stale either way; whatever you pick for the base, fix this `+` def to match.
- `Smoke Bomb+`: OLD "Gain 7 Block. Swap positions"; NEW "Give an ally 8 Block. Draw 1 card." (matches its new base).

---

## Cleric

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Smite | 1c, 5 dmg, [2,3,4] | same | prefPos removed only | ⬜ |
| Divine Shield | 1c, give 7 blk, [3,4] | same | prefPos removed only | ⬜ |
| Heal | 1c, heal 8, [3,4] | same | prefPos removed only | ⬜ |
| Bless | 2c, all 4 blk +2 HP, [4], "Pos 4 only" | 2c, all 4 blk +2 HP | "Pos 4 only" dropped; value same | 🟨 |
| Holy Fire | 2c, 9 dmg, [2,3,4] | same | prefPos removed only | ⬜ |
| Sanctuary | 2c, all 3 blk +3 HP, [3,4] | same | prefPos removed only | ⬜ |
| Purify | 0c, remove poison, [3,4] | same | prefPos removed only | ⬜ |
| Resurrect | 3c, revive 1 HP exhaust, [4] | same | prefPos removed only | ⬜ |
| Divine Wrath | 2c, 4 dmg all +1 Vuln, [3,4] | same | prefPos removed only | ⬜ |
| Cleansing Light | 1c, heal 3 all + clear Weak, [3,4] | same | prefPos removed only | ⬜ |
| Martyrdom | 1c, -5 HP heal 10 others, [3,4] | same | prefPos removed only | ⬜ |
| Holy Nova | 2c, 5 dmg all + heal 3 all, [3,4] | same | prefPos removed only | ⬜ |

**Cleric upgrade (+) notes:** `Bless+` OLD desc "Pos 4 only", NEW dropped it (value 6/+4 HP identical). 🟨. No other cleric upgrade changes.

---

## Wizard

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Magic Missile | 1c, 6 dmg any, [3,4] | same | prefPos removed only | ⬜ |
| Arcane Ward | 1c, 5 blk, [3,4] | same | prefPos removed only | ⬜ |
| Fireball | 2c, 4 dmg all, [4], "Pos 4 only" | 2c, 4 dmg all | "Pos 4 only" dropped; value same | 🟨 |
| Arcane Intellect | 1c, draw 3, [4], "Pos 4 only" | 1c, draw 3 | "Pos 4 only" dropped; value same | 🟨 |
| Chain Lightning | 2c, 4×3 random, [4] | same | prefPos removed only | ⬜ |
| Frost Nova | 1c, 2 dmg all 25% stun, [3,4] | same | prefPos removed only | ⬜ |
| Mana Shield | 0c, energy→4 blk each, [3,4] | same | prefPos removed only | ⬜ |
| **Teleport** | 0c, **swap two heroes' positions, exhaust** (v0), [1,2,3,4] | 0c, **gain 1 energy. Draw 1 card. Exhaust.** | Entire position-swap effect replaced with energy+draw | 🟥 |
| Blizzard | 3c, 3 dmg all +2 Weak, [4] | same | prefPos removed only | ⬜ |
| Empower | 1c, +3 Str ally exhaust, [3,4] | same | prefPos removed only | ⬜ |
| Meteor | 3c, 15 dmg all exhaust, [4] | same | prefPos removed only | ⬜ |
| Mirror Image | 1c, all 3 blk + draw 1, [3,4] | same | prefPos removed only | ⬜ |

**Wizard upgrade (+) notes:**
- `Teleport+`: OLD "Swap two heroes' positions. Both gain 3 Block. Exhaust." → NEW "Gain 2 energy. Draw 2 cards. Exhaust." (matches new base). 🟥
- `Fireball+` / `Arcane Intellect+`: OLD descs said "Pos 4 only", NEW dropped. 🟨

---

## Barbarian

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Savage Strike | 1c, 8 dmg, [1,2] | same | prefPos removed only | ⬜ |
| Tough Skin | 1c, 6 blk, [1,2,3] | same | prefPos removed only | ⬜ |
| Reckless Charge | 1c, 12 dmg, -3 HP, [1], "Pos 1 only" | 1c, 12 dmg, -3 HP | "Pos 1 only" dropped; value same | 🟨 |
| Blood Rage | 1c, +2 Str -4 HP exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Rampage | 1c, 6 dmg (×2 if <50% HP), [1,2] | same | prefPos removed only | ⬜ |
| Bloodlust | 2c, 10 dmg, kill→heal 5, [1], "Pos 1 only" | 2c, 10 dmg, kill→heal 5 | "Pos 1 only" dropped; value same | 🟨 |
| Whirlwind Axe | 2c, 7 dmg all, [1], "Pos 1 only" | 2c, 7 dmg all | "Pos 1 only" dropped; value same | 🟨 |
| Berserker Roar | 1c, all +2 Vuln, self +1 Str, [1,2] | same | prefPos removed only | ⬜ |
| Pain Threshold | 1c, blk = missing HP (max 15), [1,2,3] | same | prefPos removed only | ⬜ |
| Undying Rage | 2c, set HP 1, +6 Str exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Headbutt | 1c, 7 dmg 30% stun, [1], "Pos 1 only" | 1c, 7 dmg 30% stun | "Pos 1 only" dropped; value same | 🟨 |
| Frenzy | 1c, 4×2 dmg (+1 if <50%), [1,2] | same | prefPos removed only | ⬜ |

**Barbarian upgrade (+) notes:** `Reckless Charge+` OLD "Take 2 dmg. Pos 1 only." → NEW "Take 2 damage." `Bloodlust+` OLD "Pos 1 only" → dropped. `Whirlwind Axe+` OLD "Pos 1 only" → dropped. `Headbutt+` OLD "Pos 1 only" → dropped. All 🟨 (values identical). NB: barbarian upgrade defs are also in `cards.js`.

---

## Ranger

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Quick Shot | 1c, 6 dmg any, [1,2,3] | same | prefPos removed only | ⬜ |
| Dodge Roll | 1c, 5 blk, [1,2,3,4] | same | prefPos removed only | ⬜ |
| Aimed Shot | 1c, 9 dmg, [2,3,4] | same | prefPos removed only | ⬜ |
| Snare Trap | 1c, 2 Weak +2 Vuln, [2,3,4] | same | prefPos removed only | ⬜ |
| Mark Prey | 0c, mark +3, [1,2,3,4] | same | prefPos removed only | ⬜ |
| Volley | 2c, 4 dmg all, [3,4] | same | prefPos removed only | ⬜ |
| Poison Arrow | 1c, 3 dmg +3 Poison any, [2,3,4] | same | prefPos removed only | ⬜ |
| Called Shot | 2c, 14 dmg (+6 if Marked), [2,3] | same | prefPos removed only | ⬜ |
| Multi-Shot | 1c, 3× random 3 dmg, [2,3,4] | same | prefPos removed only | ⬜ |
| Camouflage | 1c, 8 blk + draw 1, [1,2,3,4] | same | prefPos removed only | ⬜ |
| Bear Trap | 1c, 5 dmg +3 Bleed, [2,3,4] | same | prefPos removed only | ⬜ |
| Rain of Arrows | 3c, 8 dmg all exhaust, [3,4] | same | prefPos removed only | ⬜ |

**Ranger:** no desc/value/effect changes at all — only prefPos stripped. Cleanest hero to rebuild. No upgrade-def changes.

---

## Necromancer

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Life Drain | 1c, 4 dmg heal 3, [3,4] | same | prefPos removed only | ⬜ |
| Shadow Bolt | 1c, 6 dmg any, [3,4] | same | prefPos removed only | ⬜ |
| Bone Shield | 1c, 5 blk, [3,4] | same | prefPos removed only | ⬜ |
| Hex | 1c, 2 Weak, [3,4] | same | prefPos removed only | ⬜ |
| Plague Spread | 1c, double poison/else 3, [3,4] | same | prefPos removed only | ⬜ |
| Soul Siphon | 2c, 6 dmg heal lowest 6, [3,4] | same | prefPos removed only | ⬜ |
| Corpse Explosion | 1c, 2×dead all, [4], "Pos 4 only" | 1c, 2×dead all | "Pos 4 only" dropped; value same | 🟨 |
| Dark Pact | 0c, -5 HP draw 3 exhaust, [3,4] | same | prefPos removed only | ⬜ |
| Mass Curse | 2c, all 2 Weak +1 Vuln, [4], "Pos 4 only" | 2c, all 2 Weak +1 Vuln | "Pos 4 only" dropped; value same | 🟨 |
| Death Coil | 2c, 12 dmg heal 4, [3,4] | same | prefPos removed only | ⬜ |
| Blight | 1c, 2 Poison all, [3,4] | same | prefPos removed only | ⬜ |
| Raise Shade | 2c, 10 dmg +3 Poison exhaust, [4], "Pos 4 only" | 2c, 10 dmg +3 Poison exhaust | "Pos 4 only" dropped; value same | 🟨 |

**Necromancer upgrade (+) notes:** `Corpse Explosion+` and `Mass Curse+` and `Raise Shade+` OLD descs said "Pos 4 only", NEW dropped. All 🟨, values identical.

---

## Paladin

| Card | OLD (46617c2) | NEW (0bfec58) | What changed | Flag |
|------|---------------|---------------|--------------|------|
| Holy Strike | 1c, 5 dmg +3 blk, [1,2] | same | prefPos removed only | ⬜ |
| Shield of Faith | 1c, give 7 blk, [1,2,3] | same | prefPos removed only | ⬜ |
| Lay on Hands | 1c, heal 6, [1,2,3] | same | prefPos removed only | ⬜ |
| Righteous Blow | 1c, 8 dmg, [1,2] | same | prefPos removed only | ⬜ |
| Divine Smite | 2c, 12 dmg +2 Vuln, [1], "Pos 1 only" | 2c, 12 dmg +2 Vuln | "Pos 1 only" dropped; value same | 🟨 |
| Consecrate | 2c, 4 dmg all + 3 blk all, [1,2] | same | prefPos removed only | ⬜ |
| Guardian Stance | 2c, 14 blk + taunt all, [1], "Pos 1 only" | 2c, 14 blk + taunt all | "Pos 1 only" dropped; value same | 🟨 |
| Holy Avenger | 2c, dmg = your Block, exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Aura of Protection | 1c, all +4 blk, [1,2] | same | prefPos removed only | ⬜ |
| **Retribution** | 1c, **6 dmg. Pos 1: also gain 4 Block.** [1,2] | 1c, **6 dmg. Gain 4 Block.** | Pos-1-conditional block made UNCONDITIONAL | 🟥 |
| Sacred Oath | 1c, +2 Str +5 blk exhaust, [1,2] | same | prefPos removed only | ⬜ |
| Crusader Strike | 2c, 10 dmg heal 5, [1], "Pos 1 only" | 2c, 10 dmg heal 5 | "Pos 1 only" dropped; value same | 🟨 |

**Paladin upgrade (+) notes:** `Retribution+` OLD "Pos 1: also gain 6 Block" → NEW "Gain 6 Block" (unconditional, matching new base). 🟥. Several others dropped "Pos 1 only" desc text (Divine Smite+, Guardian Stance+, Crusader Strike+) with identical values — 🟨. Paladin class identity ("Pos 1 devotion bonus" comment in old file header) was the most position-dependent of any class.

---

## Summary counts

- **Heroes:** 8. **Cards per hero:** 12 → **96 base cards total.**
- **Cards that lost only `prefPos` (⬜, trivial):** ~69
- **Cards where "Pos X only" was stripped from desc but value/effect identical (🟨):** 20
- **Cards with a real position MECHANIC in the effect (🟥, need a deliberate call):** **4**
  - Rogue **Shadow Step** (move forward → draw)
  - Rogue **Smoke Bomb** (swap positions → ally block + draw)
  - Wizard **Teleport** (swap positions → energy + draw)
  - Paladin **Retribution** (pos-1 conditional block → unconditional block)
- **Cards with a non-position value/effect rebalance (🟦):** 0 in the base sets — the Apr-10 numeric changes on these four are *bundled with* their position-mechanic swap, not standalone. Everything else kept identical values.

---

## Decisions needed (the real judgment calls)

These 4 are where keep-vs-restore is a genuine design choice. The other ~89 cards just need `prefPos` re-added and (for the 🟨 ones) the "Pos X only" text put back — no judgment required.

1. **Wizard — Teleport.** OLD was a pure position tool (swap two heroes, free, exhaust). With positions BACK, the old swap is genuinely useful again and is the only hero-repositioning card the wizard has. NEW (gain energy + draw) is a generic value cantrip with no position flavor. **Recommend: restore OLD swap** (it's the marquee position card) — or merge: keep swap AND add a small draw so it's not dead when positioning doesn't matter.

2. **Rogue — Smoke Bomb + Shadow Step (treat together).** Both old versions were the rogue's mobility/repositioning identity (move forward to reach front, swap with an ally). NEW versions turned both into generic "draw a card" attached to block/damage. With positions back, the rogue loses its in-combat mobility theme if you keep NEW. **Recommend: restore the position mechanic on at least one** (Shadow Step "move forward" is the cleaner read), and keep the NEW draw on the other (Smoke Bomb) so you don't have two redundant move cards. This is the call most affected by the "rogue feels positionally agile" fantasy.

3. **Paladin — Retribution.** OLD gave the +4 Block only when in Pos 1 (reinforced the "Pos 1 devotion" class identity called out in the old file header). NEW gives it unconditionally — strictly stronger and flavor-flat. **Recommend: decide the paladin's whole pos-1 identity first.** If you're rebuilding the "Pos 1 devotion bonus" theme, restore the conditional; if you decided paladins are position-agnostic now, keep the unconditional (but then nerf value, since unconditional 6 dmg + 4 block for 1 energy is a lot).

**Also fix regardless of decision (not a judgment call, just a bug):** `Shadow Step+` upgrade def in `0bfec58` still says "Deal 7 damage + move forward 1" while its base card no longer moves forward. Whatever you pick for base Shadow Step, sync the `+` def.
