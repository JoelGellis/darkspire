# D&D 5e SRD — Reference Catalogue for Darkspire Flavor

**Purpose:** A cited palette of license-clean fantasy flavor — class names, weapon/spell damage dice, monster names + stats, the HP-by-CR curve, and magic-item names — drawn from the **D&D 5e System Reference Document (SRD)** for use in the Darkspire roguelike deckbuilder.

**Research date:** 2026-05-29

**Why SRD-only matters:** The SRD is the slice of 5e that Wizards of the Coast released under the Open Gaming License (and later Creative Commons CC-BY-4.0). Names and stats inside the SRD can be reused commercially without IP risk. Anything *outside* the SRD (e.g. mind flayers, beholders, displacer beasts, most named subclasses beyond the one-per-class set) is protected IP and is flagged below. Darkspire should borrow only from the [VERIFIED] SRD set.

**Confidence legend:**
- `[VERIFIED]` — directly from an SRD source (open5e API mirrors the WotC SRD; dndbeyond free rules; DMG SRD table reproductions).
- `[COMMUNITY]` — secondary compilation / community summary.
- `[INFERRED]` — extrapolation or designer note, not a direct quote.

---

## 1. Classes (SRD names + identity flavor)

All 12 SRD classes. Hit Die from the open5e SRD mirror `[VERIFIED]`. The SRD includes exactly **one** subclass per class (the "default" archetype) — the rest of each class's subclasses are non-SRD IP. Subclass names `[VERIFIED]`/`[COMMUNITY]` as noted.

| Class | Hit Die | SRD Subclass (the only one included) | Hero archetype it implies |
|---|---|---|---|
| Barbarian | d12 | Path of the Berserker | Raging frontline bruiser; highest HP-per-level |
| Bard | d8 | College of Lore | Support/face; buffs, debuffs, jack-of-all-trades |
| Cleric | d8 | Life Domain | Holy healer/tank; radiant damage, restoration |
| Druid | d8 | Circle of the Land | Shapeshifter/nature caster; terrain-themed magic |
| Fighter | d10 | Champion | Pure martial; crits, durability, weapon mastery |
| Monk | d8 | Way of the Open Hand | Unarmed striker; speed, ki, mobility |
| Paladin | d10 | Oath of Devotion | Holy warrior; smites, auras, oath-bound |
| Ranger | d10 | Hunter | Wilderness skirmisher; favored prey, ranged/dual-wield |
| Rogue | d8 | Thief | Stealth/precision; sneak attack burst, utility |
| Sorcerer | d6 | Draconic Bloodline | Innate caster; metamagic, elemental bloodline |
| Warlock | d8 | The Fiend | Pact caster; eldritch invocations, patron boons |
| Wizard | d6 | School of Evocation | Scholar caster; sculpted area damage, widest spell list |

- Hit Dice: `[VERIFIED]` — open5e `/v1/classes/` (mirrors WotC SRD). Barbarian d12; Fighter/Paladin/Ranger d10; Bard/Cleric/Druid/Monk/Rogue/Warlock d8; Sorcerer/Wizard d6.
- SRD subclass set: `[VERIFIED]`/`[COMMUNITY]` — confirmed via community SRD compilations (5thsrd.org, 5esrd.com) and the open SRD. The one-per-class list is a well-known SRD constraint.
- Archetype descriptions: `[INFERRED]` — designer-facing flavor summary, not SRD text.

---

## 2. Damage Dice & Weapons

### Weapon damage dice (SRD Equipment table)

`[VERIFIED]` — open5e `/v1/weapons/` and dndbeyond free-rules Equipment > Weapons table.

| Weapon | Damage | Type | Versatile (two-handed) |
|---|---|---|---|
| Dagger | 1d4 | Piercing | — |
| Mace | 1d6 | Bludgeoning | — |
| Quarterstaff | 1d6 | Bludgeoning | 1d8 |
| Handaxe | 1d6 | Slashing | — |
| Spear | 1d6 | Piercing | 1d8 |
| Shortsword | 1d6 | Piercing | — |
| Scimitar | 1d6 | Slashing | — |
| Shortbow | 1d6 | Piercing | — |
| Rapier | 1d8 | Piercing | — |
| Longsword | 1d8 | Slashing | 1d10 |
| Battleaxe | 1d8 | Slashing | 1d10 |
| Warhammer | 1d8 | Bludgeoning | 1d10 |
| Light Crossbow | 1d8 | Piercing | — |
| Longbow | 1d8 | Piercing | — |
| Heavy Crossbow | 1d10 | Piercing | — |
| Greataxe | 1d12 | Slashing | — |
| Greatsword | 2d6 | Slashing | — |
| Maul | 2d6 | Bludgeoning | — |

### Damage types (SRD)

`[VERIFIED]` — SRD "Damage Types" (13 total): **Acid, Bludgeoning, Cold, Fire, Force, Lightning, Necrotic, Piercing, Poison, Psychic, Radiant, Slashing, Thunder.**

### Iconic SRD spell damage dice

`[VERIFIED]` — open5e `/v1/spells/` + dndbeyond free-rules spell descriptions. Dice shown at base level; most scale on upcast.

| Spell | Dice (base) | Damage / effect type | Note |
|---|---|---|---|
| Fire Bolt (cantrip) | 1d10 | Fire | Scales 2d10/3d10/4d10 at lvl 5/11/17 |
| Eldritch Blast (cantrip) | 1d10 | Force | +1 beam at lvl 5/11/17 |
| Sacred Flame (cantrip) | 1d8 | Radiant | Dex save; scales by level |
| Magic Missile | 3 × (1d4+1) | Force | Auto-hit; +1 dart per slot above 1st |
| Cure Wounds | 1d8 + mod | Healing | +1d8 per slot above 1st |
| Burning Hands | 3d6 | Fire | 15-ft cone, Dex save |
| Fireball | 8d6 | Fire | 20-ft radius, Dex save; +1d6 per slot above 3rd |
| Lightning Bolt | 8d6 | Lightning | 100-ft line, Dex save; +1d6 per slot above 3rd |

---

## 3. Monsters (SRD names + stats)

`[VERIFIED]` — open5e per-monster endpoints (`/v1/monsters/<slug>/`, WotC SRD document). HP = SRD average. "Signature attack" = primary action's dice (before/with its flat bonus). All listed monsters are **in the SRD** (license-safe).

| Monster | CR | HP | AC | Signature attack (dice) |
|---|---|---|---|---|
| Kobold | 1/8 | 5 | 12 | Dagger 1d4+2 piercing |
| Bandit | 1/8 | 11 | 12 | Scimitar 1d6+1 slashing |
| Goblin | 1/4 | 7 | 15 | Scimitar 1d6+2 slashing |
| Skeleton | 1/4 | 13 | 13 | Shortsword 1d6+2 piercing |
| Zombie | 1/4 | 22 | 8 | Slam 1d6+1 bludgeoning |
| Orc | 1/2 | 15 | 13 | Greataxe 1d12+3 slashing |
| Gnoll | 1/2 | 22 | 15 | Spear 1d6+2 (1d8 two-handed) piercing |
| Bugbear | 1 | 27 | 16 | Morningstar 2d8+2 piercing |
| Ghoul | 1 | 22 | 12 | Claws 2d4+2 slashing (+paralysis) |
| Giant Spider | 1 | 26 | 14 | Bite 1d8+3 piercing + 2d8 poison |
| Ogre | 2 | 59 | 11 | Greatclub 2d8+4 bludgeoning |
| Owlbear | 3 | 59 | 13 | Claws 2d8+5 slashing |
| Wight | 3 | 45 | 14 | Longsword 1d8+2 / Life Drain 1d6+2 necrotic |
| Mummy | 3 | 58 | 11 | Rotting Fist 2d6+3 bludg + 3d6 necrotic |
| Troll | 5 | 84 | 15 | Claw 2d6+4 slashing (regenerates) |
| Hill Giant | 5 | 105 | 13 | Greatclub 3d8+5 bludgeoning |
| Wraith | 5 | 67 | 13 | Life Drain 4d8+3 necrotic |
| Young Red Dragon | 10 | 178 | 18 | Bite 2d10+? +1d6 fire / Fire Breath 16d6 |
| Adult Red Dragon | 17 | 256 | 19 | Bite 2d10+8 +2d6 fire / Fire Breath 18d6 |
| Lich | 21 | 135 | 17 | Paralyzing Touch 3d6 cold (+paralysis) |

20 monsters spanning CR 1/8 → CR 21. **All are SRD monsters** — no IP flags needed. (Owlbear, dragons, troll, lich, wight, wraith, mummy, ghoul, etc. are all in the SRD. Note: SRD includes generic chromatic/metallic dragons like the Red Dragon line, but NOT IP-specific creatures such as beholders, mind flayers, or displacer beasts — avoid those.)

---

## 4. HP-by-CR Baseline (DMG "Monster Statistics by Challenge Rating")

`[VERIFIED]` — the official DMG SRD-equivalent MSCR table (DMG p.274), reproduced at tomedunn.github.io / anyflip DMG mirror. **This is the single most useful table for setting Darkspire enemy HP curves.**

| CR | Prof. Bonus | AC | Hit Points | Attack Bonus | Damage / Round | Save DC |
|---|---|---|---|---|---|---|
| 0 | +2 | 13 | 1–6 | +3 | 0–1 | 13 |
| 1/8 | +2 | 13 | 7–35 | +3 | 2–3 | 13 |
| 1/4 | +2 | 13 | 36–49 | +3 | 4–5 | 13 |
| 1/2 | +2 | 13 | 50–70 | +3 | 6–8 | 13 |
| 1 | +2 | 13 | 71–85 | +3 | 9–14 | 13 |
| 2 | +2 | 13 | 86–100 | +3 | 15–20 | 13 |
| 3 | +2 | 13 | 101–115 | +4 | 21–26 | 13 |
| 4 | +2 | 14 | 116–130 | +5 | 27–32 | 14 |
| 5 | +3 | 15 | 131–145 | +6 | 33–38 | 15 |
| 6 | +3 | 15 | 146–160 | +6 | 39–44 | 15 |
| 7 | +3 | 15 | 161–175 | +6 | 45–50 | 15 |
| 8 | +3 | 16 | 176–190 | +7 | 51–56 | 16 |
| 9 | +4 | 16 | 191–205 | +7 | 57–62 | 16 |
| 10 | +4 | 17 | 206–220 | +7 | 63–68 | 16 |

> Designer note `[INFERRED]`: This is the *idealized/budget* HP curve. Real published SRD monsters (Section 3) run well below it because they trade raw HP for special abilities, multiattack, and resistances. For Darkspire, the MSCR table is the clean baseline for "how tanky should a tier-N enemy feel," while Section 3 shows where real designers actually landed. The two are intentionally different — use MSCR for curve shape, Section 3 for concrete flavor.

---

## 5. Items / Magic Items (SRD names for loot flavor)

`[VERIFIED]` — open5e `/v1/magicitems/<slug>/` (WotC SRD / "5e Core Rules" document). All 17 below are **in the SRD** (license-safe). Rarity tiers: Common < Uncommon < Rare < Very Rare < Legendary.

| Item | Rarity | Flavor hook |
|---|---|---|
| Potion of Healing | Common | Consumable heal (2d4+2 base; variants scale up) |
| Bag of Holding | Uncommon | Extradimensional storage / inventory item |
| Cloak of Protection | Uncommon | +1 AC and saves |
| Gauntlets of Ogre Power | Uncommon | Sets STR to 19 — flat power buff |
| Cloak of Elvenkind | Uncommon | Stealth advantage |
| Wand of Magic Missiles | Uncommon | Charged ranged force damage |
| Amulet of Health | Rare | Sets CON to 19 — HP buff |
| Flame Tongue | Rare | Sword, +2d6 fire damage on hit |
| Boots of Speed | Rare | Double speed, activated |
| Ring of Protection | Rare | +1 AC and saves (attunement) |
| Bracers of Defense | Rare | +2 AC when unarmored |
| Staff of Power | Very Rare | 20-charge caster artifact + retributive strike |
| Robe of the Archmagi | Legendary | Caster armor + magic resistance + spell DC/attack boost |
| Vorpal Sword | Legendary | +3 sword, decapitation on nat 20 |
| Ring of Invisibility | Legendary | At-will invisibility |

> Note `[VERIFIED]`: Potion of Healing's *base* form is Common; "Greater/Superior/Supreme" variants climb to Uncommon/Rare/Very Rare. open5e labels the base item rarity as "varies" because it bundles the variants. All four healing-potion variants are SRD.

> Non-SRD flag `[INFERRED]`: Iconic items like the *Deck of Many Things*, *Holy Avenger*, and most artifact-tier named relics are NOT in the SRD — do not borrow those names. The 15+ above are all confirmed SRD.

---

## Sources

- Classes + Hit Dice: https://api.open5e.com/v1/classes/
- SRD subclass set (one per class): https://5thsrd.org/character/classes/ , https://www.5esrd.com/database/class , https://dnd5e.info/classes/
- Weapons: https://api.open5e.com/v1/weapons/ , https://www.dndbeyond.com/sources/dnd/free-rules/equipment
- Spells: https://api.open5e.com/v1/spells/fireball/ , https://api.open5e.com/v1/spells/magic-missile/ , https://api.open5e.com/v1/spells/eldritch-blast/ , https://api.open5e.com/v1/spells/cure-wounds/ , https://api.open5e.com/v1/spells/lightning-bolt/ , https://api.open5e.com/v1/spells/fire-bolt/ , https://www.dndbeyond.com/sources/dnd/free-rules/spell-descriptions
- Monsters: https://api.open5e.com/v1/monsters/ (per-slug: goblin, kobold, skeleton, zombie, bandit, orc, gnoll, ghoul, giant-spider, bugbear, ogre, owlbear, wight, mummy, troll, hill-giant, wraith, young-red-dragon, adult-red-dragon, lich)
- HP-by-CR (DMG MSCR): https://tomedunn.github.io/the-finished-book/monsters/calculating-monster-cr/ , https://online.anyflip.com/tqblu/sfae/files/basic-html/page274.html , https://slyflourish.com/lazy_5e_monster_building_resource_document.html
- Magic items: https://api.open5e.com/v1/magicitems/ (per-slug: potion-of-healing, bag-of-holding, cloak-of-protection, ring-of-protection, flame-tongue, boots-of-speed, amulet-of-health, staff-of-power, gauntlets-of-ogre-power, wand-of-magic-missiles, robe-of-the-archmagi, bracers-of-defense, cloak-of-elvenkind, vorpal-sword, ring-of-invisibility)

---

## Couldn't verify

- **Young Red Dragon Bite flat bonus:** open5e returned "2d10 + 1d6" without the clean flat STR modifier (likely 2d10+6 +1d6 fire by the SRD stat block); the dice are right, the flat add is unconfirmed here. Marked with "?" in Section 3.
- **5e.tools / wikidot SRD pages:** returned 403/404 to the fetcher, so subclass confirmation leans on 5thsrd.org / 5esrd.com / dnd5e.info compilations rather than a single canonical WotC page. The one-per-class subclass list is consistent across all three.
- **Official DMG MSCR table:** WotC does not host this table at a clean public URL; values were taken from faithful community reproductions (tomedunn, anyflip DMG scan p.274) which agree on every cell. Treated as `[VERIFIED]` because multiple independent reproductions match exactly.
- **Potion of Healing exact rarity in API:** open5e reports "varies" (bundled variants); base = Common is the established SRD value but not a single clean API field.
