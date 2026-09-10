# Enemy ecosystems — specialist plan 3

Status: executable content proposal, not shipped or balance-certified. Grounded in `DESIGN.md`, `data/enemies.js`, `js/state.js`, `js/combat.js`, current state/backlog and specialist plans 1–2 on September 9. All numbers are original Darkspire hypotheses. No reference-game statistic is asserted. Preserve eight classes, Cleric launch ranks 2/3, four enemies, shared energy, permanent equipment and no stress.

## Current implementation audit

The current catalog has 11 normal groups, five elite groups and four bosses. Its useful identities include skeleton formation, goblin poison, cult healing, slime death poison, fungi, wraith back attacks, wolves, tomb guards, cursed champions, Bone Knight/Mage, Executioner, Twin Shades, Lich, Golem, Spider Queen and Vampire Lord. Keep their IDs/recognizable silhouettes where possible; the proposal below deepens those roles rather than adding numerous interchangeable names.

Several descriptions overpromise: Twin Shades have identical random pools, not mirroring logic; Golem block does not intrinsically reward multihit; Vampire Blood Drain is ordinary damage, not lifesteal; Shadow Caster's “Weaken All” selects one random hero. `buff` permanently increases every living enemy's `dmgBuff`, including the caster, without a ceiling. `summon` ignores template/count and revives every dead non-boss at 75% HP. Repeated revival reuses identity. There is no authored phase controller or enemy launch/reach enforcement. `State.startCombat` copies only a fixed definition field list, so adding phase/guard fields to catalog entries alone does nothing.

Reusable primitives: direct attacks, committed front/back/random victims, per-hit committed random targets, party AoE, damage+Poison, pure Poison, Weak/Vulnerable, self-block, all-allies healing, player guard/riposte, enemy push via intent, rank closing, Wound generation, seeded combat RNG, combat snapshot persistence. Enemy allied guard, selective healing, finite buffs, rank zones, interruptible channels, conditional phase selection, actual spawn lifecycle and finite summon budgets require hooks. Do not market an existing primitive's name as its missing behavior.

## Numerical baseline and scaling decision

Current heroes include Fighter52, Rogue38, Cleric34 and Wizard26 base HP; equipment/town/veteran modifiers add to these. Shared energy is3; base hand5; four starter stacks contribute32 cards. Typical basic attacks cost1 for roughly5–7 damage. Three basic plays therefore buy roughly15–21 nominal single-target damage while leaving no energy for defense, before AoE, modifiers, draw and constraints. Enemy rear hits must respect the Wizard's26HP rather than balancing against pooled party health.

Live scaling is HP `round(base*(1+.1*floor))`, damage `base+floor(floor*.5)` **per hit and per AoE victim**. Thus a base3×4 barrage becomes5×4 at floor4, and base4 party AoE becomes24 total damage instead of16. This is a large hidden multiplier. Current victory income is10–19+2*floor gold (mean14.5+2f), so a35g common costs about1.7 floor3 wins, a140g rare6.8. Encounters must remain beatable with common/partial gear; a legendary cannot be a mandatory antidote.

For this three-act catalog, table values are **final ascension0 encounter values**, already expressing act difficulty. Add an explicit `scalingProfile: authored_act_v1` that bypasses both generic floor scaling and any `scaleEncounter` wrapper. Legacy encounters retain legacy scaling until converted. Never apply both. This is an intentional bounded replacement for new content, requiring a test that act3's listed4×3 is exactly12 before statuses. Do not inflate every later actor's HP/damage and also compound floor. Later difficulty comes primarily from joint threats and timing.

## Execution contract

Every enemy gets stable definition ID and unique spawn ID. All cycles start at step1 and advance once per completed enemy round; stunned actors skip action but advance the cycle. Explicitly interrupted channels advance to their listed failed recovery. No random initial step. Random target choice uses combat RNG when intent is revealed; it is saved immediately. Enemy policy can inspect current ranks, visible HP/status and its own counters, never player draw order, future RNG or queued player actions.

Notation: A damage; B self-block (expires on existing normal block timing); P Poison; W Weak turns; V Vulnerable turns; F frontmost living hero; R rearmost; Rand random living; Z2/3 rank-zone strike; All each living hero. `A3x2 Rand` commits each hit separately. Unless stated, attacks are identity-locked: moving the hero does not cancel them, and guard can intercept. On target death, fizzle that hit; do not secretly reacquire a fragile victim. This fizzle rule differs from any existing fallback and needs deliberate migration/tests. Zone strikes are visibly **rank-locked**, resolve occupants at attack time, and miss empty slots. UI must distinguish name portrait from illuminated rank tiles.

All ordinary melee attacks launch from enemy ranks1/2 and reach hero1/2; bolt/bow/vial/curse reaches1–4 and launches1–4. Entries marked long melee reach1–4 deliberately. If forced outside launch ranks, the actor instead uses visible **Recover formation: move one toward front, no damage**; refresh intent preview immediately after displacement. This is deterministic counterplay, not a reroll. F selects frontmost reachable target; R rearmost reachable. Pull/push never refresh a victim secretly. Bosses listed anchored cannot be displaced; they still take damage/status. No immunity to poison or entire class engines.

All heal/buff targets chosen at reveal by most missing absolute HP then lowest rank then spawn ID; visible rings show recipients. Enemy guards intercept first single-target attack on named ally during next player turn, do not intercept AoE/status-only, and expire after that player turn. Guard charges cannot stack. Combat log records original and actual recipient. All caps are instance counters, persisted. No new summon acts until the next enemy round. Four living enemy cap, twelve total spawns per combat safety ceiling, and boss-specific budgets below. Spawned enemies provide no separate gold/card/XP rewards; unique-death player effects remain capped as proposed in plans1–2.

## Act I — The Broken Garrison

Lessons: bypass a protector, recognize a channel, decide when to kill an add. No opening Weak+Vulnerable stack or damage+rear execution combination. Reuse skeleton/cult/goblin/slime art with readable equipment silhouettes.

| ID / actor | HP | Ordered repeating cycle | Tactical job |
|---|---:|---|---|
| garrison_shield / Shield Remnant |24|B6 + guard named rear ally; A6 F; A8 F|Protects support for one turn; push it behind rank2, AoE, or spend first hit removing guard.|
| garrison_archer / Bone Archer |14|bow A5 R; bow A3x2 Rand; B3|Rear pressure is survivable and fully named.|
| garrison_cantor / Grave Cantor |18|Channel2: Prepare; Release heal6 to one ally other than self; bolt A5 Rand|Channel broken by >=8 actual HP damage during preceding player turn OR moving caster out of ranks3/4. Failed release becomes B3. Count channel damage visibly.|
| garrison_knife / Goblin Cutpurse |16|A5 F; long-melee A4 R; B4|Cheap flexible threat; long dagger icon explicitly shows reach4.|
| garrison_vial / Vial Bearer |14|vial A3+P1 Rand; vial P2 Rand; B3|Attrition priority; never paired with Cantor in act1.|
| garrison_brood / Slime Brood |28|summon one Droplet if budget remains; A3 All; B5|Two total summons, at most two Droplets alive; blocked summon becomes B3.|
| garrison_drop / Droplet |8|A3 F; A2 F|On death mark named random hero for P1 at next enemy round; killing Brood cancels pending marks. Telegraph prevents hidden death tax.|

Normal groups, front-to-back: **Shield Patrol** [Shield, Archer], total38HP; **Chant Detail** [Shield, Knife, Cantor],58HP (late only); **Grave Volley** [Knife, Archer, Archer],44HP (archers start at steps1/3 respectively, authored offset visible); **Vial Ambush** [Knife, Vial],30HP; **Brood Nest** [Brood, Droplet],36HP plus at most16 spawnedHP. Brood stays rank1; newborns append at back. First two combats choose Patrol or Ambush and do not repeat.

Elites: **The Executioner**,70HP, anchored. Cycle: Measure (commit R portrait, B6); Judgment long-melee A12 to measured identity; A7 F; B4. At <=35HP add+2 to Judgment only beginning the next reveal; no current-intent change. A vulnerable wounded rear hero can be guarded or strengthened; movement alone does not evade an identity-marked execution. **Ragebound Knight**,76HP. Cycle: Windup B5; Cleave A11 F; Overreach A3 F and self V1 for next player turn. Under50%HP windup also shows next Cleave+3, ceiling14. No indefinite damage stacking. Neither elite has adds in act1.

Boss **The Lich / Bone Regent**,96HP plus two Guards12HP each (A4 F/B3 alternating, offsets1/2). Front-to-back [Guard, Guard, Lich]; Lich launches all ranks, anchored. Phase1 cycle: bolt A7 R; Raise one Guard12HP (two total raises across fight); A3 All; B8. Phase2 at<=48HP replaces future cycle with Soul Claim (visibly mark one living Guard); Consume marked Guard next round, heal boss8 and gain a single +3 bonus on next bolt; bolt A10 R; A4 All. Killing marked Guard denies both gains. No Guard available: Soul Claim becomes B4 and Consume becomes bolt A5 F. At<=24HP enter finale at next reveal: **Last Bell** B0 with countdown; next round A6 All; then alternate A8 F/A4 All. No resurrection in finale. Kill-order dilemma: killing adds denies healing but repeated raises cost time; reaching boss through rank gates requires actual ranged/pull/AoE tools. Party without ranged can remove guards rather than being hard-locked.

## Act II — The Rootbound Ossuary

Lessons: choose between healing prevention and present damage; leave dangerous ranks; manage finite poison. Baseline normals contain at most one control/support actor and three enemies.

| ID / actor | HP | Ordered repeating cycle | Tactical job |
|---|---:|---|---|
| root_mauler / Fungal Mauler |34|A9 F; B7; A6 F + push1|Front displacement exposes different hero actions; no full party scramble.|
| root_mender / Spore Mender |21|heal7 one other ally, maximum3 heals; spores P2 Rand; bolt A5 Rand|After three heals first step becomes bolt A6 Rand; no endless sustain.|
| root_sprayer / Spore Sprayer |23|P2 Rand; A3 All; B4|AoE poison source prioritization; no all-party poison.|
| root_stalker / Web Stalker |27|Mark Z3/4; next round A7 to each marked rank; A6 F|Marked zones are fixed and allow rank swaps; labels show14 maximum total.|
| root_shell / Hollow Carapace |32|B10; A10 F; B4 + guard Mender if present|Block timing rewards poison/single large hit; not falsely called multihit counter.|
| root_larva / Husk Larva |10|A3 F; A2+P1 F|No death effect, no rewards; brood fodder.|

Groups: **Nursery** [Mauler, Mender],55HP; **Spore Crossfire** [Mauler, Sprayer],57HP; **Web Lane** [Stalker, Larva, Sprayer],60HP; **Hollow Hospice** [Shell, Larva, Mender],63HP late-only; **Root Guard** [Shell, Stalker],59HP. Stalker zone Mark is its non-damaging setup round and persists through its next attack; killed/stunned Stalker does not execute it.

Elite **Formation Hunter**,98HP anchored: Mark Z1/2; A10 each marked rank; Mark Z3/4; A10 each marked rank; A8 F. Moving and blocking are alternatives, not mandatory use of one class. Killing/stunning denies strike. Below49HP marks exactly two nonadjacent zones1/3 then2/4 in alternating cycles, with same damage and full setup. **Plague Choir** [Mauler34, Cantor22, Sprayer23]: Cantor channels one ritual through two complete player turns; at reveal show2→1→0. Interrupt by12 cumulative actual HP damage or moving Cantor outside ranks2/3. Completion grants other enemies +2 damage for next two enemy rounds only, once per fight; failure/finished cantor uses A6 bolt/B4 cycle. Choir never appears before a route with recovery access.

Boss **Spider Queen / Widow of Roots**,132HP, anchored, with Larva10HP at ranks1/2 and Queen3. Phase1: A7+P2 F; Lay two Larvae (four total across fight, four living cap); Mark Z2/3; A7 each marked rank. At<=66HP phase2: Cocoon B12; Consume oldest living Larva (heal8, cap2 consumes fight); A3x3 Rand; A4 All. Killing larva denies heal, but leaving one occupies a slot and prevents second spawn. At<=33HP finale: visible **Venom Crown** B0; next round A4 All+P1 each; then A9 F/A3 All alternating. Poison applied only on Crown once, never every AoE. Larvae stop spawning in phase2. No damage immunity while cocooned. Existing poison builds keep working; recovery items lessen poison without becoming required.

## Act III — The Ashen Court

Lessons: coordinate owner burst with defense windows; face precise multi-hit threats; prepare a finite finale. Normal pools have no summon and no unbounded buff.

| ID / actor | HP | Ordered repeating cycle | Tactical job |
|---|---:|---|---|
| ash_sentinel / Cinder Sentinel |40|B9 + guard named ally; A11 F; A8 F|Protector costs meaningful damage to remove; guard one charge only.|
| ash_standard / Ash Standard |26|grant named ally+3 next attack only; bolt A7 R; B5|Bonus expires after next enemy round and never compounds.|
| ash_duelist / Hollow Duelist |32|A4x3 F; B8; long-melee A8 R|Multihit challenges block but does not multiply additive floor scaling.|
| ash_hexer / Mourning Hexer |25|W1 Rand; bolt A6 R + one Wound into discard; bolt A7 Rand|Maximum two Wounds per fight; no unbounded deck flood.|
| ash_wraith / Mirror Wraith |30|B8 and one riposte4 for next player turn; bolt A8 R; A3 All|Attack timing, poison and block answer finite retaliation; AoE hits still trigger one retaliation only.|
| ash_hound / Cinder Hound |24|A7 F; long-melee A5 R; B4|Efficient pressure that stops support-heavy groups becoming harmless.|

Groups: **Court Escort** [Sentinel, Standard],66HP; **Duel Invitation** [Duelist, Hexer],57HP; **Mirror Hunt** [Hound, Wraith],54HP; **Banner Procession** [Hound, Sentinel, Standard],90HP late-only; **Cursed Audience** [Duelist, Hound, Hexer],81HP late-only. No Wraith+Standard pairing in baseline: buffed retaliation is poorly legible and unnecessary.

Elites: **Twin Shades**,62HP each. Shared visible beat cycles: round1 left A10 F/right B8; round2 left B8/right bolt A10 R; round3 both A4 All; repeat. Killing one removes its action permanently and surviving twin enters B4 → A12 F → bolt A10 R cycle at next reveal, no immediate revenge. **Iron Bailiff**,125HP anchored: B16; A14 F; Vent B0 and self V1; A5 All. While not venting has two separate shell pips per cycle: first two direct attack cards hitting it each remove one pip, no extra reduction; removing both cancels next B16 (not current block). Thus multihit on one card removes one pip, and multiple owners can cooperate; pip feature is a new explicit hook, not ordinary block. No immunity while shell remains.

Final boss **Vampire Lord / The Last Regent**,176HP anchored and solo initially. Phase1 cycle: long-melee A12 F, heals half actual HP damage rounded down (max6); Summon two Bats10HP each (A3 Rand/B3 alternation), budget four total; bolt A10 R; A4 All. Phase2 at<=106HP: mark oldest Bat; Consume marked next round grants B12 (no heal); A4x3 Rand; A5 All. If none present, mark/consume collapse into separately telegraphed B4 then A8 F turns; no free skip or hidden attack. At<=44HP finale starts next reveal with **The Last Feast**: one nonattacking round, shows countdown1, cancels unexecuted consumption and summoning. Following round A7 All; then A12 F/A5 All alternation. Bats remain and must still be handled, but no new ones arrive. Boss death ends combat and dismisses summons without bonus kill rewards. Finale gives retained cards, finite defenses and potions a use, with no unavoidable surprise upon crossing HP threshold.

## Phase, channel and UI invariants

Crossing one or several thresholds during a player action queues the deepest phase for **next intent reveal**. The already shown enemy action resolves unless it has been explicitly interrupted by a stated mechanic. Show “Finale next round” immediately beside current intent. Never trigger an immediate extra attack, cleanse poison or clear player block at threshold. Persist phase, pending phase, cycle index, targets/zones, heal/summon budgets, marked add IDs, channel accumulated damage and temporary buffs. Save/reload during phase crossings must produce byte-equivalent authoritative events apart from session identity/timestamps.

Death and damage hooks are ordered once: resolve hit/block/HP → death → channel damage tally for surviving caster → phase pending → item reactions → next hit. A killed caster cannot complete a ritual later in the same queue. Marked add missing at consumption fizzles its reward. Summon picks lowest vacant position then closes ranks once; unique ID increments even after prior summon death. A player cannot farm repeated death triggers by resurrecting the same spawn; successful genuinely new spawns remain distinct and player payoff caps still apply.

Battlefield telegraph shows exact attack total, target portrait or lit rank zone, channel/cycle clock, guard tether and bounded charges. Hover/focus inspection has current and next cycle action, source rank gate, reach and phase rule. Use physical icons around figures, no spreadsheet of rectangular tabs. Fullscreen desktop must fit four heroes/four enemies, hand, targets and tooltip without document scrolling. Long descriptions live in an inspection overlay, not a growing combat page.

## Counters across the eight stacks and item roster

| Class | Useful encounters and real decisions | Item support; never mandatory |
|---|---|---|
| Fighter | Push Shield out of launch, pull Cantor forward to interrupt, guard measured Executioner victim; timing guard versus own attack is the cost. | Notched Longsword exposes support; Warden Harness gives finite rescue; Reprisal Nail earns counterdamage only on interception. |
| Rogue | Poison Shell during block, ambush exposed Standard, save zero-cost retreat/discard for rank-zone attack. Identity-locked Judgment still follows Rogue. | Hook Knife/Seam Ripper convert voluntary movement into offense; Viper Sheath applies bounded poison. |
| Cleric (2/3) | Protect marked victim, remove poison before Crown, maintain midline after Mauler push. Cannot assume a rank4 cleric can cast new gated skills. | Pilgrim Bell prevention, Mercy Vestment rescue, Dawn Censer finite party cleanse. |
| Wizard (3/4) | Reach Cantor/Standard, AoE finite adds, hold Shards for rage recovery or final bell. Setup consumes shared energy. | Frost Wand reduces shown attack; Convergence Staff needs owner sequence before burst. |
| Barbarian (1/2) | Burst channel through real HP damage, exploit rage/vent exposure; low-HP build must defend against telegraphed front strike rather than pay HP recklessly. | Scar Axe actual payment, Defiant Hide low-HP block, Gallows Cleaver finite finish. |
| Ranger (2/3/4) | Focus back support, mark exposed boss, push Stalker to prepare own line; traps reward actual movement but anchored boss remains damageable. | Barbed Bow mark; Trail Mantle escapes rank zones; Ironwood displacement interrupts a caster. |
| Necromancer (3/4) | Poison through block, spend sacrificial card for defense during finale, use bounded add deaths to increase later AoE. No endless revival payoff. | Grave Needle attrition; Ossuary Wrap finite defense; Black Reliquary counts capped unique deaths. |
| Paladin (1/2) | Guard rear targets and earn Oath, retain block for telegraphed burst, choose whether spending block on Verdict leaves wearer exposed. | Wardkeeper Plate interception, Oath Seal bounded payoff, Last Light risk trade. |

No encounter requires a particular cleanse/guard item. Reach-capable ordinary class cards, damage focus, block or killing adds must offer at least two distinct responses. Test all70 four-distinct-class parties, plus duplicate-class legal cases. Do not claim all parties equally strong; reject encounters with legal-action impossibility or routine unavoidable full-health death before a teachable response.

## Map pools and backlog 51–70 delivery

| Backlog | Exact delivery and completion evidence |
|---|---|
|51|Shield Patrol with enemy guard implementation; browser guard tether and AoE/push counter tests.|
|52|Executioner Measure→Judgment; named wounded rear target stays committed through movement/save, guard rescue test.|
|53|Plague Choir two-turn interruptible ritual; damage and displacement interrupt independently verified.|
|54|Brood Nest finite new summons; blocked cap produces B3 and never fifth actor.|
|55|Nursery three-charge selective healer; focus/reach denial and no infinite heal loop.|
|56|Ragebound Knight vulnerable recovery; delaying burst beats spending it into windup in paired fixture.|
|57|Formation Hunter rank zones; actual rank movement changes struck occupant, portrait-target attacks do not.|
|58|All three act bosses threshold/pending cycle implementation; crossing two thresholds and save restoration.|
|59|Lich/Queen/Regent consumption target and finite spawn economy; add kill denies exact benefit.|
|60|All boss finales one full nonattacking tell; preserved limited defenses can mitigate them.|
|61|Three acts carry HP/deck/equipment/identity; no free restore/reset at transition.|
|62|The three separate pools above, including two elites and one boss per act. Alternate bosses are later content, not filler required to claim this catalog.|
|63|Act1 two early safe choices and one late elite fork; act2 poison/recovery branches; act3 two distinct preparation routes converging at camp. Route planner owns exact graph.|
|64|Reveal selected act boss and major mechanic at act entrance, before first node choice; no boss reroll after reload.|
|65|Elite victory guarantees one compatible permanent gear choice from three unowned common/uncommon-or-better options plus normal gold; duplicate-saturated pool gives exact salvage alternative. Economy planner owns final rarity weights.|
|66|No identical group within last three fights; no same dominant support mechanic twice consecutively; deterministic finite filtered selection with least-recent fallback, never reroll forever.|
|67|One optional elite→treasure branch per act that bypasses rest; show encounter tier and reward type before committing; treasure permanent gear/salvage, not gold-bought rental.|
|68|Final camp offers mutually exclusive ordinary rest or finite earned boss ward (6 block each at first boss turn), free choice, no gold; do not introduce stress chores.|
|69|Transition choose earned blessing: +1 opening energy but opening draw4; +2 draw first turn but -1 opening energy; or heal each survivor8 but no blessing. Exact other-effect timing owned by progression implementer; no paid temporary effect.|
|70|First three ascensions: normal enemies HP+10%; then elite direct single-hit+1 (multi/AoE total budget+1 distributed deterministically); then boss first-phase block+3. Cumulative, visible, no hidden target intelligence. Record modifiers separately; unlock only after full expedition victory.|

## Implementation order and acceptance

1. Build authored scaling and explicit enemy instance fields; regression old encounters unchanged. Add cycle/target/zone contracts, saved counters and render previews before content. Implement guard, finite ally heal/buff and channel primitives. Convert Patrol/Executioner/Choir and one representative fullscreen fixture.
2. Add real finite summon lifecycle, phase queue and consumption. Convert Brood and Lich; test save at each transition and summon cap. Then add ActII and ActIII definitions using those same hooks, without bespoke alternate combat engines.
3. Integrate seeded act pools/history, reward offer persistence and actual full route driver. Commit raw source data locally to private archives; publish only game runtime. Every tester identifies human name, AI exact model/version/effort or scripted policy/version, with unknown metadata explicitly labeled.
4. Measure same-seed paired runs across current neutral and proposed class/item builds. Minimum initial smoke: all70 parties × five normals per act ×10 seeds; then500 seeds per elite/boss per representative engine, no-gear/common/specialist loadouts. Run bounded background batches with max turns60, max actions100 per turn, and report guard exhaustion as failure, never victory. Ordinary nodes target median3–6 turns, elites5–9, bosses7–12; investigate95th percentile>15. These are hypothesis thresholds, not evidence of achieved tuning.
5. Initial investigation bands: first two normal nodes <5% full-health party wipes under tactician; no full-health Wizard killed by first enemy round absent explicit player HP payment; normal party HP loss median5–18%; elites12–30%; boss20–45%. Report confidence intervals and individual hero loss, not pooled HP alone. High-risk parties may diverge; retain all failed runs and explain outliers rather than deleting them. Beginner/scripted bad-play losses remain valid, attributed evidence rather than balance proof.
6. Log encounter/act/seed/build hash, visible observations given policy, all offered/legal actions, chosen action, intent reveal/revision reason, predicted versus actual damage, guard redirects, blocked/HP damage, poison ticks, damage by source/item/owner, phase boundaries, summon/death/consume IDs, lost turns from launch gates, gold/gear outcomes and boss HP when first hero died. Diagnostic full state may include hidden RNG, but policy observation never does. Archive schema distinguishes both.
7. Human acceptance is separate: can Joel understand the threatening move without opening a long tooltip; does a saved card produce a satisfying payoff; does changing formation feel worth its energy; does a boss change rhythm visibly? Automated win rate alone proves none of these. A 15–20 minute first-act test follows verified live deployment, with recording identity confirmed and export/collection route explained accurately.

The plan is complete as a bounded proposal: 19 normal/support definitions (including two summon types), six elite encounters, three multi-phase bosses, fifteen authored normal groups and explicit required hooks. Implementation, balance evidence, art review and live demo verification remain outstanding.
