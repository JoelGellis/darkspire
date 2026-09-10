# Combat-depth checkpoint — 2026-09-09

This is an implementation evidence checkpoint, not a release or complete 100-item audit.

## Implemented slice

Engine and draftable content now support IDs 21, 22, 24–37 and 40. ID 23 is a labeled **direct-attack estimate**; it covers committed victims, taunt, guard, block consumption across attacks, Weak and Vulnerable. It deliberately does not promise exact outcomes after reactive kills, relic death prevention, poison/bleed or future random effects. ID 38 supports real generated cards, ownership, hand overflow and turn expiry, but complete combat save restoration remains missing. ID 39 has no new curse acquisition/removal implementation and remains planned.

- 21: melee targets ranks 1/2; magic and `enemy_any` reach all; ordinary Ranger attacks reach 2/3/4 with a lone-enemy exception. Explicit `reach` overrides exist for future weapon definitions.
- 22: `pickIntent` commits target IDs, including each multihit shot. Movement does not reroll victims. Taunt redirects; if a committed victim dies, deterministic frontmost living fallback is used.
- 24–30: Grappling Hook pulls; Bone Captain Shield Rush pushes its victim; Intercept guards one ally through the round; Mark adds damage once; Riposte has two retaliation charges and stops dead attackers' remaining shots; Sunder destroys up to 12 block before its hit; enemy deaths and summons compact living ranks.
- 31–37: innate opening draw (up to 10), retained cards, ethereal exhaustion, Ash Covenant exhaust defense, Escape Plan deliberate-discard defense, Improvise discard/draw, Overcharge turn-only discount and Arcane Barrage X cost. These are real class reward definitions, not isolated helper methods.
- 38/40: Conjure makes two temporary ethereal/exhausting Shards. Goblin Poisoner can add an unplayable Wound to combat discard. Neither modifies the expedition deck.

## Files

`js/combat.js`, `data/cards.js`, `data/enemies.js`, `data/heroes-necromancer-paladin.js`, `js/combat-depth-view.js`, `css/combat-depth.css`, `tests/combat-depth.js`.

The adapter places commitments, incoming estimates, guard/riposte/mark and card keywords on existing battlefield/hand elements. It uses production legality to dim unreachable targets and display actual discounted/X costs. Visual fit and readability need browser acceptance in the fullscreen UI work; this checkpoint does not certify the visuals.

## Verified

`C:\Users\joel\tools\node-portable\node.exe tests/combat-depth.js` passes against current index script order. Assertions cover illegal target no-op without energy cost; victim persistence despite movement; pull/death rank permutation; forecast vs actual three-hit guard; bounded retaliation; attacker death interrupts multihit; mark once; armor break; retain; full-hand no-burn; exhaust payoff; ethereal cleanup; discard index shifts; X damage/energy; turn-cost reset outside hand; temporary status deck separation; six innate cards in opening hand; actual enemy push and Wound generation. Changed combat and adapter JS parse checks pass.

## Not yet proven / required follow-up

- Real `State.save/load` round trip for full combat, committed IDs, generated effects and transient modifiers; state owner notified. Definition metadata copying exists, tactical lookup requested.
- Browser fullscreen target/hand/readability verification; UI owner notified that the notes need themed integration, not extra page chrome.
- Multi-seed progressed-party balance; simulation owner notified that target selection must call `validTarget` and energy must call `cardCost`.
- Broad cure/curse system, card-specific exact preview, AI perfect information restrictions and full class engines remain separate work.
- No release, deployment, shared-log edit or commit was performed by this agent. Parent owns consolidated STATE/log/release records.

## Follow-up: draft acquisition and combat persistence

Independent review exposed that `UI.renderReward` discarded keyword metadata and owner mapping. A real click-handler regression first failed with missing `retain`; it now passes after canonical clone, independent launch-array copy, living party class filtering/owner remap and one-shot reward acceptance. Narrow `js/ui.js` edit was explicitly reassigned by parent.

`js/state.js` saves version 2 full run fields and complete combat piles/enemies/statuses/committed targets at settled player decisions. Canonical definitions restore card effects including tactical and gear cards. Roster mapping, custom run state, combo-trigger caps and temporary cost fields persist. In-flight animations cannot replace a checkpoint; loading retains the checkpoint. A browser closure during animation resumes the prior stable player decision, not a half-resolved shot.

Combat randomness uses a saved run-local stream, including class-card effects and combat relic random targeting. Tests prove the next combat random number after load matches uninterrupted play. Initial combat screen transitions in main.js now save the opening fight. This is combat repeatability; full seeded maps/shops/events/rewards (ID91) remain separate.

Real save/load tests match hand IDs, enemy victim arrays and RNG state; restore generated effects, temporary costs, guard identity, combo caps, custom fields and roster indexes; and prove loaded Shards expire next turn. Combat-depth, campfire-smoke, party-equipment and telemetry suites pass. This follow-up supersedes the earlier save blocker, but not outstanding visual acceptance.
