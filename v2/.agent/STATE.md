# 2026-09-19 - Production published and verified

Darkspire II 0.2.0 is live at https://joelgellis.github.io/darkspire/v2/. Source/art checkpoint `02cbe6d` pushed. Pages run `35425224652` completed successfully, including clean Linux install, all tests, strict TypeScript, build and original V1 release checks. Live V2 manifest matches locally reviewed build `5d8b4b0ad13eb924`; V1 root remains `e9ee051fe2a5ca4d`. Live town screenshot and armory/catalog interaction verified in Chrome with no warnings/errors. Public campaign remains at its starting town; local QA campaigns are separate. Shared knowledge log append saved. Balance limitations below still apply; this release is not a declaration of perfection.

# 2026-09-19 - Darkspire II 0.2 production candidate

User authorized sustained production work and explicitly expanded scope to more than four classes, a persistent recruitable roster, death/replacement, richer town services, skills and itemization. Work is V2 only. Release frozen and locally verified; public publication is pending the Pages workflow and live verification below.

## Current implemented scope

Eight classes (Fighter, Rogue, Cleric, Wizard, Barbarian, Ranger, Necromancer, Paladin), 72 card definitions with explicit upgrades, 44 equipment/relic definitions, 24 subclasses and 96 skill nodes. The town now exposes seven buildings plus Campfire, Stagecoach and Armory landmarks (ten services). All class identities have reviewed runtime portraits/actor textures and all cards have mapped art. Expanded items share reviewed prop-art families; do not claim unique paintings for all 44 items.

Four living active heroes are required to embark; camp can have 0-4 active and up to eight living heroes total, at most one per class. Stagecoach recruits unowned classes for 35 banked gold; recruitment is free while total active+reserve living roster is under four. Reserves keep XP/path/skills, return gear safely to stash when benched, and clear wounds after sitting out a run; Infirmary supports reserves. Actual deaths remain in Graveyard and are removed on returning to camp. No automatic replacement; fresh recruits have level 1/no skills. Engine starter decks and economy previews derive from the active classes. No duplicate-class support and no stress system.

Progression uses additive Unit.skills and level-derived points (one each at levels 2-6, max5). Each path has foundation 1 point at level 2, one exclusive specialty 2 points at level 4, mastery 2 points at level 6. Choices persist, cannot reset, and die with the hero. Existing path indexes/innate bonuses migrate unchanged. Every skill modifies live resolved cards or battle/turn Block; effectiveCard is shared by rules/previews/UI. Prerequisites, exclusivity, costs, class/path identity and reserve/graveyard skills are validated. All 96 nodes have direct real-play behavioral coverage, including secondary effects.

Seven-stage seeded expeditions now include 11 encounters / 3 bosses, explicit Pilgrim and Veteran choices (+25%HP/+2attack/+25%combat gold on Veteran), rest preparation/deck thinning and shrine variants. Old 5-stage campaigns retain their route until the next embark. Enemy rank gaps close after complete direct/cleave/poison resolution, fixing unreachable rear survivors. Combat import validation and the final audit are complete.

Item catalog has universal choices, eight class sets and seven relics, including combined nonstacking auras. Rarity-band loot weighting remains stable as catalog grows; class-specific loot/run stock matches living active classes. One starting item/hero plus one relic still enforced. BALANCE.md and reports/economy-balance.json document the 576-expedition spending/difficulty/composition matrix, conservation checks and caveats. Pilgrim is forgiving; Veteran composition gaps remain. Bot does not train skills or make tactical retreats; it does not prove human balance.

Persistence retains one previous valid checkpoint and one bounded recovery slot, preserves corrupt bytes, validates imports before replacing live state, handles unavailable/quota storage and detects stale-tab writes. Help exposes export/import/restore flows. Shared-origin cross-tab storage is best-effort, not atomic. No cloud save service. V1 saves untouched.

## Verification and release handoff

`npm run check` is the validation gate (behavior/asset tests, strict TypeScript, production build). All 102 tests pass, strict TypeScript passes and the production build passes. The four simulation cohorts complete 848 expeditions (32 standard + 144 economy + 96 discovery + 576 balance). Newly covered flows include all 72 upgraded cards, all 96 actual skill effects, eight-class real expeditions, genuine recruitment/death, reserve ownership/treatment, corrupted saves and formation actor rebuilds. Browser QA completed a seven-stage expedition, including recruit/reserve/reorder, real upgraded cards, gear, shrine choices, merchant purchase, boss victory, banked gold, estate upgrades and skill training. Mid-expedition reload preserved state. Packaged production town and Stagecoach visually checked at 1366x768; recruitment and previous-checkpoint restoration verified through UI. No browser warnings/errors. The browser automation tool denied fixture uploads, so imported/empty-roster/corrupt-save edge cases are automated-test coverage, not claimed browser coverage.

Package version 0.2.0. `npm run release` assembles deterministic hashed ZIP/folder, manifest and loopback launcher at port 5190. RELEASE.md explains packaging and optional manual Pages publication under /v2/, retaining V1 root. Source masters, source maps, personal saves, QA fixtures and dependencies are excluded. README.md/README.html replaced stale append-only scope with the current coherent player/developer guide. Local frozen artifact: `.release/darkspire-ii-0.2.0-5d8b4b0ad13eb924`, 49 files. ZIP SHA-256: `9d1f705b51f404303207a10e7b2043fd1ee9a7dde019004e93c294e3e02c7f76`. Original V1 release checks pass (12 suites), retaining runtime hash `e9ee051fe2a5ca4d`. Source/publication checkpoint follows separately after remote verification.

Preserve the user's existing origins (5174 and previously used 5176/5183/5186). Final play/browse address must come from root's verified release, not an old entry below.

--- Historical checkpoints follow ---

# 2026-09-18 follow-up - Explicit card mastery

Continued at user's "keep it up" request. All 36 definitions have explicit upgrade descriptions in src/card-upgrades.ts; many replace flat +3 with cheaper costs, stronger secondary effects, broader ranks/reach or optional movement. Engine legality, target lists, values/effects/previews and runtime card UI resolve the same definition. Serial format remains upgrade:0/1; old upgraded saves use current definitions (intentional content/balance update). Overrides do not receive a hidden +3.

Rest selection shows the resulting card and change note. Guild codex has base/upgraded toggle. Backstep+/Smoke Screen+/Breakthrough+/Shadow Lunge+ expose movement toggle in targeting; base movements remain mandatory. E.play defaults to movement for existing callers; journal records the choice. Preview labels optional movement. New targetBlock effect supports Absolution+. Town restoration previews show exact current -> next benefits.

57 tests and strict types/build pass. Standard 32 expeditions, economy 144 and new discovery/upgrade/estate cohort 96 completed (272 total). Discovery cohort takes actual rewards, upgrades at rest, invests earned gold in town, and roundtrips saves each node: 96/96 obtain discoveries, 94/96 reach upgrades, 94 victories/2 defeats. Standard simulator skips rewards: do not mistake its success for new-card integration coverage. Combat policy now uses resolved costs/effects and values draw/disruption. No claim of finished difficulty.

Browser retry still returned no apps/browsers. No browser interaction or visual QA. Preview remains http://127.0.0.1:5186; user may be playing that origin, do not automate it. Production bundle rebuilt. Source uncommitted; no public publication. Cloud backup remains pending: automatic approval review rejected a combined documentation/Drive-copy command with "blocked by policy" and no specific reason. Local documentation saved separately. Prior backup attempt also hit Drive API quota.

--- Previous state follows ---

# 2026-09-18 - Class discoveries and The Last Light town

User asked for more class cards beyond starter-kit choices and a full DD-style town with item/upgrading buildings. Implemented in V2 only. 36 cards total: original 12 plus 24 discoveries (six/class), survivor-only discovery reward pool, two-copy reward cap, fresh Guild redraws. Effects: drawing, self/party protection, targeted disruption of committed intents, advancing, higher poison, piercing and cleansing. All discoveries rest-upgrade +3 primary value. New atlas with 24 distinct paintings, reviewed row crops; prompts and acceptance limits in assets/source/ART-REVIEW-2026-09-18.md.

Camp now opens to the spatial painted town, with PARTY / TOWN navigation. Seven buildings: Blacksmith (+1 starting Block/level), Guild (+1 reward redraw/run/level, class codex and subclass access), Chapel (+1 victory healing/level), Infirmary (15 -> 12/9/6 treatment), Wayfarer (existing merchant/stash/salvage and stock tier upgrades), Watchtower (50 -> 55/60/65% retreat banking), Graveyard (persistent fallen records). Five new tracks plus merchant, capped at level 3; see town.ts/README for prices. Town upgrades are banked-gold permanent estate progression. Starter deck and lean embark restrictions unchanged. No cards bought in town. Added schema-1 town migration/validation; no V1 save access. New text events display actual disruption text. Expanded hand fan/1-9 shortcuts for draw cards.

Validation: 50 tests pass; all 24 discoveries played/upgraded/save-roundtripped; currency/caps/phase restrictions/redraw persistence/migration/effect checks. Strict types and production build pass. 32/32 standard seeded expeditions won; 144 economy expeditions completed with 47/48 wins in each policy. Difficulty remains easy for the current scripted player, not tuned in this change. Tests check behavior, not fun.

Browser QA BLOCKER: cua.getBrowser reported no browser; cua.getState returned empty apps/browsers. Do not claim visual/browser interaction verification. Runtime root, JS/CSS/fonts and new atlas/town background verified via HTTP. Final preview http://127.0.0.1:5186 (hidden Vite preview process, PID 25020 at launch). No existing game origins were automated. Inspect town layout, new-card crops, expanded hand and all building/codex UI next when browser becomes available. README.html regenerated. Source remains uncommitted inside existing untracked V2 directory; no public deployment. Cloud backup refresh attempted, then stopped after Google Drive returned HTTP 403 RATE_LIMIT_EXCEEDED (shared API per-minute quota). Source/art are saved locally; retry the existing rclone copy when quota clears. Do not claim this checkpoint is cloud-backed.

--- Previous state follows ---

# 2026-09-17 - Active visual improvement goal

User asks sustained autonomous V2 improvement toward surpassing visual inspirations. Goal remains active; do not claim that broad bar is achieved. This checkpoint adds twelve distinct card action paintings, thirteen item/relic paintings, parchment map with SVG emblems and route history, larger tactical type and six-card hand spacing. Runtime consumes reviewed exported atlases through CSS; typed maps keep each definition assigned a unique cell. Original generation prompts and accepted source/export locations are in assets/source/ART-REVIEW-2026-09-17.md. Phaser idle tweens stop on scene teardown.

Validation: 40 tests pass, strict types and production build pass, 32/32 bounded seeded expeditions complete. Native Chrome inspected production camp, merchant, parchment route and six-card hand at 1536x686. Played Backstab (22->10 HP, energy3->2) and Shield (7 Block, zero energy). No browser console errors. Final build cleans temporary dist QA fixture entrypoints. .qa holds disposable fixture script/saves only.

Active dev 5183, production review 5184. Port 5183's campaign advanced without agent input while doing art work, so further QA moved to 5184; preserve 5183 as potentially user-used alongside 5174/5176. Source changes are still uncommitted within the pre-existing untracked v2 directory; do not claim a git checkpoint. Existing v1 publication untouched. Refresh rclone backup at each substantive checkpoint, excluding .qa/node_modules/dist/test reports.

Next visual work: distinct rest/shrine stage backgrounds, enemy action poses and richer event-driven battle motion; persistent path/content depth remains after presentation. Fix map labels over high-detail margins via scrims (implemented, check final production screenshot). Full 13-item armory reviewed; equipped Lantern and Oathbreaker, Shield confirmed in Exhaust. Sticky inventory tabs/close added after long-stash QA, verified visible at bottom. Four pixels of horizontal sticky-margin overflow clipped only after DOM bounds confirmed no content exceeded the panel. Cloud backup verification follows. No viewport override used because potentially live user tabs share the browser.

--- Previous state follows ---

# Darkspire II - 2026-09-13

## Current working milestone

Joel authorized continued rebuild work, then prioritized the whole persistent item economy. His latest rule supersedes earlier two-artifact/four-total-item proposals: start with ONE item per HERO and ONE party relic. During a run, fill weapon/armor/trinket slots and collect additional distinct relics. Junk buys survival; save for rare permanent gear; scrap surplus back in town.

- TypeScript/Phaser/Vite project isolated from original 1.0. Deterministic four-hero combat, five-node branching expedition, gear, XP, passive subclasses, wounds, death, tonics, rewards, retreat and saves.
- 13-item catalog: 9 character items, 4 party relics. Equipment can grant cards; relic auras affect starting Block/draw and victory healing/gold.
- Inventory UI via ITEMS or EQUIP: Loadout, Camp Stash / Run Pack, Merchant. Three slots per hero. Camp stash safe from wipes. No combat equipment changes.
- Basic gear 12-18 gold; camp relic 30. Run stock guarantees cheap items, a relic and a rare item. Camp merchant upgrades 80/160/240 gold. Stock persists; no free reload rerolls. Salvage 50% at merchants.
- One item drop per victory; elite relics, boss rare/legendary. Victory/retreat stores pack. Flee removes found loot but retains bought/previously-owned gear with survivors. Wipe loses carried items and artifacts. Dead heroes lose gear; graveyard and journal retain loss records.
- Additive item migration inside schema 1; legacy hero gear converted into owned item instances. Unique instance/slot/class validation. Existing save key unchanged and separate from 1.0.
- Defenses: Hold Fast 1/12 self; Backstep 0/5 self+retreat; Shield 0/7 self/Exhaust; Pale Ward 1/7 any ally. Exhaust is explicit. Camp deck preview includes item cards. Exhaust pile inspectable.
- Reviewed cathedral background, four action poses, Bellkeeper RGBA boss. Projectiles, lunges, Block absorption feedback, impact-timed HUD, reduced motion. Local fonts/procedural audio.

## Verification

Latest follow-up: equipment buttons show replacement item, net stat change and gained/lost card; merchants have expandable party comparisons. Camp/Items show named loadout warnings before embark. Same-panel inventory actions preserve scroll position/focus. 38 tests and build pass; Chrome 5182 verified comparisons and Aldric's two-item warning, visually checked no horizontal overflow. Added `npm run simulate:economy`: 16 seeds x 3 consecutive runs x 3 purchase policies = 144 expeditions with save validation after every node. Each policy won 46/48. Save policy final mean bank 440.625; basics 265.125; rare 254.4375. This demonstrates persistence, not finished balance: current encounters do not force a clear survival tradeoff, and policies are deliberately simple. Combat policy extracted into scripts/combat-policy.ts; old simulator behavior preserved.

36 tests pass including item migration, equipment cards, loadout limits, merchant stock, inventory conservation, flee/wipe/stash, relic effects, duplicate settlement and next-run relic limit. Strict TypeScript and production build pass. 32 seeded expeditions completed after economy integration (simulator does not buy/evaluate item builds yet).

Isolated Chrome on port 5180: bought Unbroken Bell for 30 from initial bank 40, equipped through stash, verified 3 starting Block on all four heroes. Completed first fight, found Mercy Beads, equipped on cleric, verified 17-card deck/two Mending Light cards. Retreated, bank 20, relic and beads survived. Unequipped/salvaged relic for 15, bank 35. Inventory layout visually reviewed in bounded scrolling panel.

Earlier browser checks completed a full boss expedition and verified camp equipment transfers; current economy tests replace the old one-slot shop implementation. 1.0 untouched apart from historical handoff append.

## Working environment and remaining work

- User's active origin is 127.0.0.1:5174. DO NOT automate gameplay there. Earlier QA 5176 advanced unexpectedly too; preserve it. Current isolated economy QA is 5180, keeper QA - persistent economy. Other temporary test servers may exist on 5177.
- Source/art backed up with rclone to gdrive:Projects/Darkspire II; refresh on substantive checkpoints. Exclude node_modules/dist/.qa/test reports. No public deployment over 1.0.
- README.html is the Windows-readable guide; regenerate after README changes.
- Item UI uses native symbols, not bespoke paintings. Full skill trees/classes/acts, composed music, enemy action poses, deeper merchant/drop balance, durable launcher and richer item art remain.
- Legacy buyGear/swapGear/salvage functions and gear field remain for old tests; runtime UI uses economy.ts. Consider consolidating this compatibility layer after migration coverage, without breaking old saves.
- Preserve unrelated parent .qa-profile-* folders and shared log edits. No source commit yet.
