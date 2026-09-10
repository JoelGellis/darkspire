# Character stacks — specialist plan 1

Status: design proposal grounded in the 2026-09-09 working tree. No proposed card below is claimed shipped. This is one of five coordinated plans: character stacks, equipment, enemies, economy, and adversarial balance review.

## Direction

Keep a shared deck and shared energy pool, with eight character-owned stacks contributing to a four-person expedition. Build identity should come from interactions that change decisions: redirect an attack, reserve a finisher, pay health, arrange a rank transition, consume a mark, or sacrifice a card. More damage with a different name is not a build.

Preserve the permanent-value gold doctrine, rolled veterans, no stress system, four ranks and lean embark. A stack is an owned set of actions, not a separate turn or separate energy pool. Do not silently introduce four independent deckbuilders: that multiplies hand management and dilutes the core positioning puzzle.

## Current inventory and structural audit

The complete generated inventory is [01-current-inventory.md](01-current-inventory.md). It reads all shipped scripts rather than guessing from filenames: Fighter 16, Rogue 15, Cleric 12, Wizard 15, Barbarian 12, Ranger 12, Necromancer 13, Paladin 12; 107 class definitions total. There are also two generated tactical definitions, Shard and Wound. Gear currently has 17 entries, five granting actions: Quarterstaff, Shadow Cloak, Holy Symbol, Ember Staff and Flame Tongue. Most equipment is modifiers, not a complete equipment progression system.

`Meta.CLASS_KITS` defines three fixed core actions plus one of two rolled signature actions per character. `buildStartingDeck` adds **two copies of each**, so four heroes start with 32 cards before item injection. Current signature pairs:

| Class | Core | Rolled signature pair |
|---|---|---|
| Fighter | Strike, Shield Block, Heavy Blow | Rally / Taunt |
| Rogue | Backstab, Evade, Throwing Knife | Shadow Step / Poison Blade |
| Cleric | Smite, Divine Shield, Heal | Bless / Holy Fire |
| Wizard | Magic Missile, Arcane Ward, Fireball | Arcane Intellect / Frost Nova |
| Barbarian | Savage Strike, Tough Skin, Reckless Charge | Blood Rage / Rampage |
| Ranger | Quick Shot, Dodge Roll, Aimed Shot | Snare Trap / Poison Arrow |
| Necromancer | Life Drain, Shadow Bolt, Bone Shield | Hex / Blight |
| Paladin | Holy Strike, Shield of Faith, Lay on Hands | Righteous Blow / Retribution |

Core actions function outside preferred ranks; signature/power attacks often have hard launch gates. New reach defaults distinguish melee, ranged and magic, but item-granted attacks inherit the wearer's class reach unless they declare explicit reach. A Quarterstaff should not become ranged just because a wizard holds it; the equipment planner must specify attack reach per item action.

Current risks to fix before large content multiplication:

1. Repeated healing can reward stalling a harmless final enemy. Holy Symbol's party heal, ordinary Heal and repeated regeneration need encounter-level recovery limits or finite uses; enemy pressure alone is unreliable.
2. `Math.max(1, hp - cost)` on blood-price effects permits repeated free benefits at 1 HP. Actual payment requires sufficient HP, or explicit lethal payment if the user elects it; neither can silently promise health was paid.
3. Class-wide global combos grant Flurry, Bulwark, Tempo and Finisher across unrelated owners. They can overpower class engines and conceal where power comes from. Record their contribution separately; do not balance signature synergies against unlabelled bonus damage/draw.
4. One-shot random stuns plus enemy intent randomness undermine planned sequencing. Prefer deterministic, budgeted disruption with boss resistance rules visible before purchase/play.
5. Reward-pool definition copies historically omitted keyword fields; latest tactical wrapper fixes those fields. Every new card must round-trip through draft, upgrade, save, and combat clone with identical behavior.
6. Core/signature exclusion keeps character identity but limits replacement. A paid transformation cannot remove a veteran's core identity accidentally. Replacements should be expedition modifications unless a permanent training purchase explicitly updates the character.
7. `getRewardPool` derives owner indices from global class order. Callers must map to the actual party order. Do not grant a Ranger card to the hero occupying global Ranger index in a four-person run.

## Shared draw and energy math

These are calculations from Darkspire's current rules, not claims about another game. Baseline is five draws, three energy and ten-card hand capacity. At 32 cards, each owner's eight cards contribute 1.25 cards per ordinary draw on average. The probability of seeing none from a particular owner in five draws is C(24,5)/C(32,5), approximately 21.1%. Seeing all four owners in five cards is only about 28.5%. This makes owner-dependent two-card combinations unreliable without deliberate search, retention or setup persistence.

Two copies of an action appear by the first ten draws with probability 1 - C(30,10)/C(32,10), approximately 53.4%. A full 32-card cycle takes 6.4 ordinary turns before draw effects. Adding four item cards extends that to 7.2 turns and reduces a specific existing two-copy action's ten-draw appearance to about 48.4%. Equipment that only adds mediocre cards can therefore weaken the character despite attractive stats.

Proposal: preserve 32-card starters for this release, instrument owner starvation, and introduce **replacement-based stack editing** before scaling item count. A class stack begins at eight cards; expedition rewards can add cards deliberately, but item actions occupy at most one prepared equipment-action slot per hero. Equipping a second action-granting item offers a choice of which action is prepared; it does not automatically inject both. Existing gear rules would need explicit migration, so this is a proposal for planner 2, not an unannounced change.

Energy budgets: most useful turns should support two or three meaningful actions. A setup costing one energy must retain value through future turns or immediately change threat; a two-energy setup requires a substantially stronger future payoff. Zero-cost cards must consume a real resource, exhaust, be generated with expiry, or have bounded turn triggers. X finishers consume energy captured once before effect execution; generated zero-cost cards cannot refund their own generation cost indefinitely.

No automatic per-owner draw guarantee initially. It would improve consistency but erase the shared-deck consequence of drafting; compare it as a controlled alternative if measured owner starvation remains severe. Retain at most one deliberately prepared payoff per owner in proposed new designs; ordinary hand capacity still provides the hard backstop.

## Sixteen build engines, with concrete additions

Values below are starting hypotheses for simulation. E is energy, L launch ranks, R enemy reach; A means any legal rank. Upgrades should adjust one named lever, not silently add multiple mechanics.

| Class / engine | Existing foundation | Proposed enabling card | Proposed payoff / counterplay |
|---|---|---|---|
| Fighter / counterguard | Intercept, Riposte, Shield Block | **Brace for Impact**, 1E, L1/2, ally: guard target and gain 6 block; the first intercepted hit gives one Counter token, cap 2 | **Measured Reprisal**, 1E, L1/2, R1/2: 5 damage +4 per Counter consumed. Tokens expire after next player turn. Attacks not aimed at the ward give no income. |
| Fighter / commander | Rally, Grappling Hook, Taunt | **Close Ranks**, 1E, LA, ally: swap with ally, both gain 4 block; no extra draw | **Breach Order**, 1E, L1/2, RA: pull target one rank and apply Exposed; next different owner attack gains +5, then clears. Defense traded for party reach. |
| Rogue / venom | Poison Blade, Caltrops, Nerve Strike | **Distill Venom**, 1E, L2/3/4, enemy: consume up to 4 Poison, deal twice consumed as direct damage | **Envenomed Reserve**, 1E, L2/3, self: next two Rogue attacks apply 2 poison; exhaust. Fast kills sacrifice later poison ticks; armor can blunt direct conversion. |
| Rogue / ambush | Shadow Step, Smoke Bomb, Reserve Blade | **Fade Back**, 0E, L1/2, self: retreat one rank; discard a chosen other card; exhaust | **Seam Cutter**, 1E, L1/2/3, R1/2: 6 damage, +5 if this owner changed rank this turn; consume movement bonus once. Forced enemy movement does not grant an opening on the next turn. |
| Cleric / triage | Heal, Divine Shield, Purify | **Last Rites Denied**, 1E, L3/4, ally: 8 block, +4 if direct incoming estimate exceeds current HP; exhaust | **Triage**, 1E, LA, ally: heal 6, +4 below 30% HP; two uses per combat. The threshold uses actual HP, not a forecast recomputed after casting. |
| Cleric / prevention | Bless, Sanctuary, Cleansing Light | **Ward of Mercy**, 1E, L3/4, ally: prevent next poison/bleed application this round; gain 4 block | **Answering Light**, 1E, L3/4, RA: 6 damage; +4 if this Cleric prevented damage to another owner this round. Cap one prevention reward each turn. |
| Wizard / sequencing | Arcane Intellect, Overcharge, Arcane Barrage | **Arcane Script**, 1E, L3/4, self: next different Wizard spell this turn costs one less, min 0; draw 1; exhaust | **Convergence**, 2E, L4, RA: 12 damage, +3 per other Wizard spell played this turn, cap +9. Shared energy and launch gate compete with sequence length. |
| Wizard / prepared shards | Conjure, Arcane Shard, Mirror Image | **Crystal Lattice**, 1E, L3/4, self: next two generated shards gain retain instead of ethereal; exhaust | **Shatter Formation**, 1E, L3/4, RA: consume up to two held Shards; 4 damage per shard to target and one adjacent rank. Consumed shards exhaust once, do not count as played. |
| Barbarian / blood price | Blood Rage, Reckless Charge, Frenzy | **Open the Wound**, 0E, L1/2, self: pay exactly 4 HP to gain one Rage, max3; exhaust; unavailable at =4HP | **Red Harvest**, 1E, L1/2, R1/2: 7 damage +3 per Rage spent. Healing does not erase earned Rage; insufficient payment never grants it. |
| Barbarian / survival threshold | Rampage, Pain Threshold, Bloodlust | **Defiant Breath**, 1E, L1/2, self: 7 block, +5 below half HP; exhaust | **Last Reserve**, 2E, L1, R1: 16 damage; below quarter HP heal 4 after the hit if alive. Finite recovery avoids safe 1HP farming. |
| Ranger / quarry | Mark Prey, Called Shot, Aimed Shot | **Declare Quarry**, 0E, L2/3/4, RA: assign one quarry for this Ranger; next hit marks +3; exhaust | **Patient Pursuit**, 1E, L2/3, RA: 7 damage to quarry; +2 per prior own hit this turn, cap+4. Killing quarry draws one Ranger card at most once per round. Quarry identity is separate from consumable Mark. |
| Ranger / trap line | Snare Trap, Bear Trap, Camouflage | **Tripwire**, 1E, L2/3/4, enemy rank: trap a rank for this round; first enemy moved into it receives 5 damage and 1 Weak | **Drive the Hunt**, 1E, L2/3, RA: 5 damage, push one rank. Existing pull/push enables friendly cooperation; immovable bosses still take base damage. |
| Necromancer / sacrifice | Ash Covenant, Dark Pact, Raise Shade | **Soul Tithe**, 0E, L3/4, own held card: exhaust it, gain one Soul, cap3; exhaust itself; cannot target itself | **Borrowed Host**, 1E, L3/4, RA: spend up to3 Souls; 4 damage each and 2 block each to owner. Payoff exhaustion cannot recursively generate Souls; do not use a generic any-exhaust trigger for Soul gain. |
| Necromancer / decay | Blight, Plague Spread, Corpse Explosion | **Harvest Decay**, 1E, L3/4, RA: consume up to3 poison; heal lowest-HP ally equal to consumed, once per combat | **Grave Echo**, 1E, L4, all enemies: 3 damage, +2 per unique enemy death this combat, cap+6. Reviving the same add cannot farm unique deaths. |
| Paladin / oathkeeper | Shield of Faith, Guardian Stance, Sacred Oath | **Sworn Ward**, 1E, L1/2, ally: 5 block to both; guard target this round; first actual interception grants one Oath, cap3 | **Oath Reckoning**, 2E, L1, R1/2: 10 damage +4 per Oath consumed; clear Oath. Taunting alone earns no Oath; prevents self-protection from impersonating ally protection. |
| Paladin / radiant bulwark | Holy Strike, Consecrate, Holy Avenger | **Preserve the Light**, 1E, L1/2, self: preserve up to6 current block into next turn; exhaust | **Radiant Verdict**, 1E, L1/2, R1/2: 6 damage, consume up to6 block for equal bonus. Real block consumption distinguishes this from a free repeated block-scaling attack. |

Each pair must have useful isolated plays. A build cannot require finding both rare cards to function. At least one enabling card per engine should be common; complex or high-ceiling payoffs can be uncommon/rare. Existing rolled signatures should point at these engines through their current effects; do not reroll existing veterans' identities.

## Cross-owner synergies and ownership boundaries

Fighter pull ? Ranger trap ? Rogue ambush is a positional chain with three energy competing for timing. Ranger Mark ? Barbarian multi-hit uses Mark on the first hit only; it must not multiply on every hit. Wizard shards ? Necromancer exhaust block is a party interaction, but Soul tokens only come from explicit sacrifice, preventing a universal infinite loop. Paladin guard ? Cleric prevention supports fragile backliners while consuming the defenders' opportunities to attack.

A card's owner is a stable hero identity plus run-local index. Equipment planner should expose `sourceItemId`, `sourceHeroId`, explicit reach and one canonical card definition ID. Temporary generation inherits its creating owner's identity; enemy Wounds belong to the party burden rather than pretending the first hero used an action. Owner death, resurrection, item loss, transformation and save migration must resolve by identity before remapping indexes.

Item-granted cards cannot appear in generic class draft pools. Drafted class cards cannot be laundered into permanent training by equipping or salvaging an item. Salvage removes only instances from that item source across all piles; it must not erase a naturally drafted action with the same display name. Multiple equipment copies cannot generate identical instance IDs.

## Required engine contracts before implementation

Replace ad hoc flags with explicit event payloads without rewriting the vanilla architecture. Events needed: `damageResolved` including requested target, intercepted target, source owner, attack/status/relic source, blocked and HP damage; `rankChanged` including voluntary/forced and before/after; `cardExhausted` with reason; `cardDiscarded` with deliberate/cleanup reason; `healthPaid` with actual amount; `enemyDied` with unique spawn identity; `cardGenerated` with source/owner/lifetime. Every trigger has a per-turn or per-combat cap where indicated.

Existing `dealDamage` does not return all of that information. Do not infer actual damage from text labels or nominal `card.value`. Forecast API currently estimates incoming direct attacks and is unsuitable as a universal exact card-preview engine. A threatened-ally card should use an explicitly frozen pre-action forecast condition; exact future lethal proof is not available with reactive relics and retaliation.

Persist tokens, prepared card IDs, guard assignments, turn counters, generated card definitions and enemy identity through combat saves. Load must not call `pickIntent`, reshuffle or award another innate hand. Trigger registration belongs to definitions, while finite charge state belongs to the instance.

## Acceptance and experiment design

- For each engine, an isolated deterministic scenario proves its stated tradeoff and cap, then a full-combat scenario proves its payoff changes the best available action. A helper unit test alone is insufficient.
- Run 500 identical seeds per candidate engine against front guard, rear threat, attrition, swarm, disruptor and single boss fixtures, both with one enabling draft and with an assembled build. Report win rate, turns, damage taken, owner action share, draw starvation, block waste, healing gained and triggered-resource income.
- Compare against same-budget neutral drafts; flag an engine if it increases win rate over 15 percentage points in every encounter family, or fails to improve any intended family by 5 points. These are investigation thresholds, not automatic nerf instructions.
- Four-owner five-card hands should not falsely promise each hero participates every turn. Report inactive-owner streaks; investigate 95th-percentile streaks over three player turns after progression. Track dead-owner draws separately.
- Simulate no-healer parties, all-fragile parties, two frontliners and three ranged heroes. Some parties may be weaker; no legal starting party should be unable to make an ordinary attack solely because of target reach.
- Enumerate zero-energy transitions with a 100-action turn guard. Every generated/discard/exhaust cycle must consume finite cards, charges, health or energy. A guard timeout is a failed safety invariant, not a won battle.
- Save and reload before payment, after guard, between multihit shots where supported, with retained/ethereal cards, and after reward acceptance. No duplicate charges, rerolled victims, resurrected discarded cards or permanent temporary cards.
- Browser checks at desktop fullscreen and compact landscape must reveal owner, launch, reach, cost, payoff stacks, target legality and imminent enemy action without page scrolling. Hover is supplemented by focus/tap inspection; no planner-only terminology leaks into the battlefield.

## Relationship to the 100-item backlog

This plan deepens 41–50, but two engines per class means more content than ten item labels. Do not count all class identities complete merely because one card was added. IDs31–38 provide primitives, not proof of an assembled build. ID38 depends on92 save restoration. IDs4–10 must establish equipment source ownership before item-granted engine cards expand. IDs77/78 must respect permanent character kits. IDs97/98 require actual reward/equipment-aware parties and the visible-state policy boundary.

Current base-kit permanence and freeform stack replacement can conflict: retain immutable starting identity and allow expedition-only modifications unless a dedicated permanent purchase says otherwise. Lean embark and full itemization are compatible if the catalogue grows while equipped/ prepared capacity stays scarce. Separate inventory breadth from equip-slot inflation.

## Reference use

Consulted local `reference/sts.md`, `reference/darkest-dungeon.md`, `reference/INDEX.md`, actual class/card/gear definitions and tests. The local references mix community wiki transcriptions with inferred heuristics and explicitly flag uncertain rank tables; this plan does not promote those to primary authority. All proposed numbers above are Darkspire design hypotheses derived from its current implementation, not quoted external game facts. No new external factual assertion or asset borrowing is required for this proposal.
