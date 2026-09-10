# Itemization — specialist plan 2

Status: implementation proposal grounded in the September 9 working tree, not shipped content. Companion: [character stacks](01-character-stacks.md). Numbers below are original balance hypotheses; they are not claims about reference-game statistics. This plan owns content definitions only, preserving current runtime and other agents' work.

## Equipment contract

Keep weapon, armor, trinket, trinket2 on each hero; two party artifacts outside those slots. Embark permits at most two equipped items per hero; the expedition permits all four. These existing limits produce eight empty personal slots across a full party. No head/gloves/belt expansion: four slots already create sixteen individual equipment decisions and the shared deck cannot absorb an action from each slot without losing its character identity.

One definition is one uniquely owned item in v1. `Meta.ownedGear` currently stores IDs, not instance objects, and `buyGear` rejects duplicates. Keep this model while shipping the roster. Duplicate drops award the item's stated salvage gold through a single logged transaction; they never silently vanish and never make a second wearable copy. Two different trinkets may be worn; the same item cannot occupy both slots. Random affixes, durability, socket currencies and set completion bonuses are deferred. They multiply balance states before the base weapons are interesting.

All surviving purchased rarities remain permanent. `CONSUME_ON_RUN_END=false` already implements the intended direction; old common-item comments about temporary/burnable equipment and rarity-only take-home language are stale. Common equipment remains useful as an affordable alternative, not a rental. Permanent means persistent ownership subject to the explicit death/flee rules, not immunity from loss. No gold-bought temporary buffs or potions. Earned potions/blessings stay separate systems.

Swapping is free in town and between encounters, never during combat. Equipping maximum-HP gear changes capacity without granting healing; reducing capacity clamps current HP. Restore the prior maximum on unequip, never subtract an accumulated delta twice. Start-of-combat blocks, strength and other triggers cannot fire by repeatedly opening the armory.

## Actual integration boundary

Existing `DS.Gear` surfaces: `classAllowed`, `slotsForItem`, `getModifier`, `getGrantedCards`, `_makeGearCard`, `_rehydrateGearCard`, `applyLoadout`, `buyOnRun`, `reassignOnRun`, `salvage`, `resolveRunEnd`. Current 17 items are enumerated in [inventory](01-current-inventory.md). Five inject actions; other items use `mods` or `flags`. Live modifier vocabulary: `startBlock`, `strength`, `damageBonus`, `maxHp`, `endCombatHeal`, `firstTurnDraw`; flags include party-scoped `freeMove` and `energyBonus`.

Do not put novel keys in `mods` and assume they work. New trigger items require explicit event processing. The existing gear hook wrapper handles combat start, card play and combat end; it does not constitute a generic, owner-safe event bus. `guardAlly` and `displace` exist, as do Mark/riposte/exhaust mechanics, but the payloads required for conditional item procs are not all exposed.

Critical prerequisite: `_makeGearCard`/rehydration currently copy a fixed field list omitting explicit reach and proposed keywords such as exhaust/retain. Add canonical metadata preservation before adding the cards below. The current `fromGear` source field must survive every pile, export and restoration. Source identity is the item definition ID under unique ownership, plus stable owner ID and unique card-instance ID. Do not derive ownership solely from class: two Fighters can join one party.

## Shared-deck cost

Live start: four owners × eight cards = 32, draw five. Adding eight item actions yields 40 cards. A particular one-copy payoff appears in the opening five with probability 5/32 = 15.625% before equipment and 5/40 = 12.5% afterward. Expected draws to cycle rise from 6.4 to 8 turns, before extra draw and retain. With eight owner cards, chance of seeing none of that owner in five draws is C(24,5)/C(32,5), about 21%; giving only the other heroes eight injected actions raises it to C(32,5)/C(40,5), about 30.6%. A stronger sword can therefore make the Cleric less reliable.

Adopt a proposed two-active-item-action cap per owner, independent of slots: all four items can supply passives, but at most two contribute actions. The armory lets the player sheathe an item's action while retaining explicitly listed passives. This is new behavior and must ship with its save/UI contract; until then, use the existing one-card-per-item behavior and show actual deck size rather than pretending the cap exists. Display total deck size, owner share, injected cards and opening draw probability when comparing items. No automatic owner draw guarantee in this wave.

Planner 1 proposes testing a leaner 24-card base. At 24+8=32, a one-copy action has 15.625% opening visibility; that is a separate controlled balance experiment with saved-kit migration. Do not silently reduce veteran stacks to compensate for excessive loot. Prefer distinctive one-action items and passive alternatives over stuffing two or three new cards into each weapon.

## Concrete additions: 32 personal items

IDs are `gear_` + the lowercase underscore name below. C/U/R/L = common/uncommon/rare/legendary. Price in gold. W/A/T = weapon/armor/trinket. Class listed is the exact compatibility restriction; these specialist tools supplement unrestricted existing basics. E = energy; launch ranks L; target reach R; “any” means 1–4. Every action is one injected card. Exhaust means once per combat unless explicitly recovered by a legal effect. Conditional triggers affect only the wearer unless stated. All caps reset at combat start; per-turn caps reset at player-turn start. No proc retriggers itself.

| Item / class | Slot, rarity, price | Exact proposed effect | Choice it creates / prerequisite |
|---|---|---|---|
| Notched Longsword / Fighter | W C 35 | **Lever Cut**, 1E L1/2 R1/2: 5 damage, push target one rank. | Trades raw hit for exposure of rear support; declare reach metadata. |
| Warden Harness / Fighter | A U 70 | **Take the Blow**, 1E L1/2 ally: guard ally this round and gain 5 block. Exhaust. | Finite rescue competes with damage; use `guardAlly`. |
| Reprisal Nail / Fighter | T R 130 | First actual intercepted attack each turn grants one riposte charge, damage 4, lasting this round. No trigger on zero incoming damage. | Rewards taking a real threat, not taunt spam; needs interception event. |
| Marshal Blade / Fighter | W L 280 | **Advance the Line**, 2E L1/2 ally: swap ranks with ally; each gains 7 block; next ally attack this turn gains 4 damage once. Exhaust. | Consumes most energy to arrange another owner's strike; needs owner-specific one-shot bonus. |
| Hook Knife / Rogue | W C 35 | **Slip Inside**, 1E L2/3 R1/2: 5 damage then move wearer forward one rank if possible. | Builds the approach to ambush rather than free damage. |
| Viper Sheath / Rogue | T U 65 | **Fresh Venom**, 1E L2/3 self: next two Rogue attack cards each apply 2 Poison to their first successfully hit enemy. Exhaust. | Setup competes with immediate attacks; requires bounded card-level hit trigger. |
| Mourning Veil / Rogue | A R 130 | **Disappear**, 0E L1/2 self: move back one rank, deliberately discard one other chosen hand card. Exhaust. If no other card, action illegal. | Tempo costs another owner's possible action; chosen discard UI required. |
| Seam Ripper / Rogue | W L 285 | **Open the Seam**, 1E L1/2/3 R1/2: 8 damage, +6 if wearer voluntarily moved this turn; consumes this movement benefit. | Once-per-turn positional burst; voluntary movement history required. |
| Pilgrim Bell / Cleric | T C 30 | **Quiet Ward**, 1E L2/3 ally: 5 block and remove 1 Poison. | Small dual-purpose prevention; no endless healing. |
| Mercy Vestment / Cleric | A U 70 | **Shelter**, 1E L2/3 ally: 8 block; if ally below 30% maximum HP, add 4 block. Exhaust. | Supports emergencies without rewarding repeated heal farming. |
| Triage Rosary / Cleric | T R 135 | First time wearer heals another hero below 30% HP each combat, add 4 actual healing and 4 block after normal heal. Check threshold before heal. | Single rescue; actual-heal/threshold event needed. |
| Dawn Censer / Cleric | W L 280 | **Hold the Dawn**, 2E L2/3 all allies: each living ally gains 7 block and clears Poison. Exhaust. | Party stabilization spends offensive turn; cannot revive. |
| Frost Wand / Wizard | W C 35 | **Rime Needle**, 1E L3/4 Rany: 4 damage and 1 Weak. | Defense through reducing a telegraphed attacker, not rear melee. |
| Scribe Cuff / Wizard | T U 65 | **Prepare Formula**, 1E L3/4 self: next different Wizard card this turn costs 1 less, minimum 0; draw 1. Exhaust. | Shared energy sequencing; discount cannot target itself. |
| Prism Robe / Wizard | A R 145 | **Hold a Spark**, 0E L3/4 own generated Shard: retain that Shard this turn; gain 3 block. Exhaust. | Preserves one payload; generated-card selection and metadata required. |
| Convergence Staff / Wizard | W L 295 | **Convergence**, 2E L4 Rany: 12 damage +3 per other Wizard card played this turn, maximum +9. Exhaust. | Needs setup and exact owner count; no party-wide spell inflation. |
| Scar Axe / Barbarian | W C 35 | **Blood Notch**, 1E L1/2 R1/2: pay 2 HP, deal 9 damage; illegal at 2HP or below. | Reliable damage has actual survivability cost; payment bypasses block. |
| Defiant Hide / Barbarian | A U 65 | **Grit**, 1E L1/2 self: 6 block, +5 below half maximum HP. Exhaust. | Enables risky threshold play without healing away its price. |
| Red Cord / Barbarian | T R 125 | First explicit HP payment each turn grants 3 block after payment. Damage from enemies/status is not payment. | Mitigates next threat, cannot refund or prevent cost; payment event required. |
| Gallows Cleaver / Barbarian | W L 285 | **Last Reserve**, 2E L1 R1: 17 damage; if wearer started below quarter HP and survives, heal 4 afterward. Exhaust. | High-risk finisher with finite recovery. |
| Barbed Bow / Ranger | W C 35 | **Pin Quarry**, 1E L2/3/4 Rany: 4 damage and apply Mark 3. | Cross-owner setup trades immediate output. |
| Trail Mantle / Ranger | A U 70 | **Relocate**, 0E Lany self: move one rank in chosen direction, gain 3 block. Exhaust. | One preparation reposition, no infinite free movement. |
| Hunter Lens / Ranger | T R 135 | First own attack against a marked enemy each turn gets +4 damage on its first hit; normal Mark consumption still occurs once. | Focus-fire payoff; damage source/mark snapshot needed. |
| Ironwood Longbow / Ranger | W L 290 | **Drive the Hunt**, 2E L3/4 Rany: 12 damage, push target two ranks and apply 1 Weak. Exhaust. | Disrupts formation; immovable enemies take base hit/Weak. |
| Grave Needle / Necromancer | W C 35 | **Ash Prick**, 1E L3/4 Rany: 3 damage and 2 Poison. | Small durable attrition line; no heal attached. |
| Ossuary Wrap / Necromancer | A U 70 | **Bone Offering**, 1E L3/4 own other hand card: exhaust chosen card; gain 9 block. Exhaust itself. | Sacrifices a party action for defense; chosen-card targeting required. |
| Cinder Urn / Necromancer | T R 140 | First deliberate other-card sacrifice by wearer each turn grants 4 block to lowest-HP living ally; ties use rank then stable ID. | Exhaust payoff separated from normal cleanup/self-exhaust. |
| Black Reliquary / Necromancer | W L 295 | **Grave Echo**, 2E L4 all enemies: 4 damage +2 per unique enemy death this combat, cap +6. Exhaust. | Powerful late encounter, weak opener; unique enemy identity required. |
| Votive Mace / Paladin | W C 35 | **Shielded Blow**, 1E L1/2 R1/2: 4 damage and 4 block to wearer. | Conservative tempo alternative to aggressive weapons. |
| Wardkeeper Plate / Paladin | A U 75 | **Sworn Ward**, 1E L1/2 ally: both gain 4 block, guard ally this round. Exhaust. | Protects a chosen person, not unlimited whole-party taunt. |
| Oath Seal / Paladin | T R 140 | First actual interception each turn stores one Oath, maximum 2; next wearer attack spends all for +3 damage each on first hit. | Protection earns bounded offense; no income from self-guard. |
| Last Light / Paladin | W L 295 | **Radiant Verdict**, 1E L1/2 R1/2: 7 damage; consume up to 7 own block for equal extra damage. Exhaust. | Cashes out protection and exposes wearer to intent. |

Cleric launch ranks deliberately remain 2/3 per DESIGN; planner 1's suggested 3/4 Cleric additions need correction before implementation. Items cannot quietly convert Cleric into a back-row Wizard.

## Six party artifacts

Artifacts add no cards. Each occupies one of two slots, so party-wide effects compete with the existing Bag of Holding and Battle Standard.

| ID / name | Rarity, price | Exact effect and tradeoff |
|---|---|---|
| gear_watch_bell / Watch Bell | U 70 | First combat turn only: party's first movement costs 0 energy. One use, then normal cost. Competes with opening draw. |
| gear_field_stretcher / Field Stretcher | U 75 | At victory heal lowest-HP surviving hero 4, ties rank then ID. No heal after flee/loss; never revives. Less broad than party offense. |
| gear_iron_pennant / Iron Pennant | R 145 | Combat start: rank1 gains 6 block, rank4 gains 3 block. Depends on actual formation; no midcombat reequip retrigger. |
| gear_exile_compass / Exile Compass | R 155 | First voluntary party rank swap each turn gives both involved heroes 2 block, once per turn. Needs swap event, not two move events. |
| gear_ash_lantern / Ash Lantern | L 285 | First deliberate card sacrifice each turn grants party 1 energy; maximum twice per combat. Card must preexist the sacrificing action and not be generated. Bounded enabling power competes with banner damage. |
| gear_last_procession / Last Procession | L 300 | First living ally reduced below quarter HP by an enemy attack each combat grants other living allies 6 block. Applies after the triggering hit; never prevents that death or triggers on HP payment. |

This yields 55 total definitions: 17 existing +32 personal +6 artifacts. Do not ship all at once; functional prerequisites and measured availability matter more than catalog length.

## Existing-item audit and acquisition

Preserve existing IDs for save compatibility. Quarterstaff needs explicit L1/2/3, R1/2 regardless of wearer class. Shadow Cloak's reusable zero-cost 5 damage is an early exploit candidate: test exhaust or one-use-per-turn rather than silently accepting repeated cycling. Holy Symbol's repeatable all-party healing needs a finite combat-use/exhaust experiment before larger sustain roster lands. Boots of Speed is party-scoped today: keep its honest wording until owner-scoped movement exists; never advertise wearer-only behavior backed by party flags. Whetstone strength and dagger damage must be evaluated on multihit/AoE versus single-target actual damage, not description totals. Archmagi's flat modifier must use exact declared attack semantics.

Keep current baseline prices and salvage formula `floor(price * .55)` for controlled comparison. New common 30–35, uncommon 65–75, rare 125–155, legendary 280–300. No paid reroll service and no sell/buy profit loop. A legendary should remain a deliberate savings choice, not be required to clear act one. All prices in the roster are starting values pending full-run income evidence.

Town keeps existing four merchant levels and weights while collecting baselines. Dungeon selection first guarantees one equip-compatible affordable option when such stock exists; the other two remain rarity-weighted, unowned draws. Do not guarantee legendary quality. Class-restricted stock must match at least one living party member. Catalog exhaustion produces an honest empty shelf or upgrades opportunity, never an infinite retry loop. Persist rolled stock on save and log offers, prices, purchases, skips and salvage so availability can be measured rather than inferred.

Exit: victory keeps survivor worn gear and retained expedition acquisitions; map retreat keeps survivors' gear and halves gained gold under DESIGN. Flee retains pre-run gear on survivors, loses run rewards/acquired gear; wipe loses all equipped gear and run acquisitions, bank untouched. Tutorial escape preserves the exceptional gains/heroes. Unworn pre-run bank items never enter loss scope. Each settlement must enumerate origin, wearer, decision and reason exactly once. Existing runtime behavior must be audited against these rules before claiming it matches.

## Implementation waves and acceptance

1. **Identity and metadata foundation**, backlog 4–10, 21, 32–38, 85, 92–94: canonical gear-card cloning, explicit reach/keywords, action activation save contract, death/salvage provenance, honest permanent rarity language. Tests: equip/unequip twice gives zero healing; save every pile and compare exact effect/owner/source; dead owner actions cannot play; salvage removes only that source; two same-class owners never collide; rejected purchase/fit mutates nothing.
2. **Eight common tools plus four bounded armor actions**, backlog 8, 24, 26–29, 41–50, 79–80: first introduce Notched Longsword, Hook Knife, Pilgrim Bell, Frost Wand, Scar Axe, Barbed Bow, Grave Needle, Votive Mace and Warden/Mercy/Defiant/Wardkeeper armors. Tests exercise legal launch/target combinations, movement caps, immovable boss, insufficient HP payment, finite rescue and no resurrection. Browser checks actual comparisons and fit-to-card path.
3. **Event contracts and remaining uncommon/rare content**, backlog 27–28, 34–36, 41–50, 86, 97–99: add source/owner/reason-rich damage, movement, payment, sacrifice and interception events. Unit cases prove caps, zero damage, blocked damage, two heroes, multihit and reload midproc; integration records actual per-item effect contribution. No item activates on merely reading a preview.
4. **Legendary build pivots and artifacts**, backlog 49, 65, 69, 74, 79, 95, 98: introduce after matching engine tests and one viable lower-rarity build per class. No generated-card/sacrifice/energy cycle can fund itself indefinitely. Run adversarial 0-cost/discard/exhaust probes, three-act owner starvation tests and merchant affordability comparisons.
5. **Balance release**, backlog 94, 97–100: identical seeded parties with none/basic/specialized gear; vary classes, ranks, deck size and policy. Record offers versus purchases versus equips versus plays, actual bonus/blocked/healed HP, unused action counts, owner no-play turns, spend and lost permanent value. Separate scripted policy/version from human and exact AI identity. Compare confidence intervals rather than declaring a five-run winner optimal. Retain all raw run records; public demo includes no private archive files.

Acceptance is a meaningful choice: each item must either change legal actions, timing, target selection, formation, resource payment or risk allocation. A different icon plus flat damage does not qualify as a new build. Numeric tuning may retain simple existing basics; the expanded catalog must earn its complexity in logged decisions. The equipment screen should feel like opening an armory chest: figure, physical slots, item silhouette and readable action preview within one screen, with internal paged inventory rather than document scrolling. Art must follow existing source/export rules and use Darkspire assets; this content plan supplies no unreviewed runtime art.

### Income opportunity-cost checkpoint

Actual `js/state.js` victory gold is `10 + floor(random*10) + 2*floor`: 10–19 plus floor bonus, mean 14.5+2f before relic multipliers. At floor 3 this is 16–25, mean 20.5. Thus a 35g common costs about 1.7 such victories; 70g uncommon 3.4; 140g rare 6.8; 290g legendary 14.1. These are fight-equivalents, not forecasts of full-run earnings: rest/event/shop nodes do not all pay combat gold, starting bank is separate, and later acts may alter floors. A common sold for 19g has a 16g net cost, roughly 0.8 floor-3 victories; an uncommon sold for 38g costs 32g net, about 1.6. Keeping that common instead preserves the whole physical tool for future loadouts. Four 35g tools compete directly with one 140g specialist item and the 80g first merchant upgrade plus a 60g existing charm. A 290g weapon is a multi-run saving objective under this baseline, not a routine first-act purchase. Do not inflate income to make every shelf instantly affordable; log unaffordable offers and their later purchase/bank paths before adjusting prices.

Current town rarity weights are L0 65/35/0/0, L1 50/35/15/0, L2 35/40/20/5, L3 25/35/28/12 (C/U/R/L); dungeon 25/35/28/12. Because item eligibility/ownership filters shrink pools, these are selection weights, not guaranteed observed proportions. Catalog extension must test seeded offer frequencies per merchant level and owned-library saturation. Report both requested rarity and final offered rarity to expose fallback bias. Keep these existing values for first comparison; only then consider lowering early dungeon legendary offer frequency if costly unreachable stock crowds out run-saving common gear.
