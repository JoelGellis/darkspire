# Darkspire II - The Hollow Cathedral

**Version 0.2.0.** A persistent-party tactical deckbuilder built with TypeScript and Phaser. Assemble four heroes, choose a seeded expedition, build their equipment and cards along the road, and bring the survivors home. Darkspire II has its own application and saves; Darkspire 1.0 remains separate.

The current release includes eight classes, 72 card definitions with explicit upgrades, 44 equipment/relic definitions, 24 subclasses with 96 skill nodes, and seven-stage expeditions drawn from 11 encounters including three bosses. The Last Light provides seven buildings and three camp landmarks with working services. This is one expanded cathedral campaign, not every planned act or the complete original game's content.

## Play

Use Node.js 24 or newer. Run `npm ci`, then `npm run dev`, and open [the local game](http://127.0.0.1:5174/). `npm run build` creates `dist`; `npm run preview` serves the production build.

For a portable production package, run `npm run release`. Extract the generated ZIP and open `PLAY.cmd` on Windows, or run `node serve.mjs` on Mac/Linux. The launcher serves the game at `http://127.0.0.1:5190/`; keep the server window open. It will not take over an occupied port. See [release and hosting instructions](RELEASE.md) ([readable HTML](RELEASE.html)). A local build or release package does not publish the game.

1. Enter a keeper name and open **PARTY** or **CAMPFIRE**.
2. Use the **STAGECOACH** to recruit or change the active party. Arrange ranks at camp.
3. Open **ITEMS** or **ARMORY** to equip one item per hero and one party relic before descending.
4. Choose Pilgrim or Veteran difficulty and a route seed, then descend.
5. Select a card, then a highlighted target. Use **E** to end the turn, **1-9** to select hand cards, and **Escape** to cancel targeting or close a panel.

Rank I is closest to the enemy. Card rank and reach restrictions matter; changing position costs one energy during combat and is free at camp. Upgraded movement cards can offer **MOVEMENT** choices to stay or move before targeting. Enemy intentions show their committed target and damage. Living enemies close formation gaps after a death, so a rear survivor cannot become permanently unreachable to melee attacks.

Block expires at the next player turn; Poison bypasses it. Healing cannot revive the fallen. Exhausted cards remain out of the draw cycle for that battle. Earned tonics heal 12 HP for no energy and reset at the next expedition. Card previews use the same resolved upgrades, equipment and skills as actual combat.

## Heroes, recruitment and death

| Class | Main role |
| --- | --- |
| Fighter | Front-line attacks and strong self-defense |
| Rogue | Close-range strikes, Poison and retreating defense |
| Cleric | Targeted healing, ally protection and mid-rank spells |
| Wizard | Long-range magic, sweeping attacks and exhaust-based defense |
| Barbarian | Heavy melee attacks, advancing strikes and strong self-defense |
| Ranger | Long-range arrows, attack disruption and traps |
| Necromancer | Poison, weakening spells and bone wards |
| Paladin | Front-line protection, cleansing heals and holy attacks |

The initial party is Fighter, Rogue, Cleric and Wizard. The Stagecoach offers every class not already represented in your living roster. Four heroes are active; up to four more may wait in reserve. Each class has at most one living hero across the active party and reserves. Duplicate-class parties are not supported.

Recruiting an additional hero costs **35 banked gold**. Recruitment is **free while your entire living roster has fewer than four heroes**. A reserve counts toward that total: bring that veteran back into the party before buying another recruit. New heroes join an open active slot, otherwise they enter reserve. Exactly four living heroes are required to embark.

A hero's levels, subclass and learned skills persist across expeditions. Sending a hero to reserve preserves that training and moves all worn equipment safely into the camp stash. Sitting out an expedition clears the reserve hero's wound; the Infirmary can also treat reserves. Healthy heroes embark at full HP; wounded heroes start at 80% until treated.

**Death is permanent.** Returning to camp removes dead heroes from the active party and records them in the Graveyard. Their equipped items are lost. There is no automatic replacement or resurrection. Recruits start at level 1 with no inherited subclass or training. Free replacement recruitment makes it possible to rebuild even after a penniless party wipe.

## Subclasses, skills and card mastery

Each class has three subclasses and each subclass has four skill nodes. Open **SKILLS** on a hero or visit the Guild to inspect all choices, including locked ones. Existing saves keep their selected subclass and receive unspent skill points for levels already earned.

| Milestone | Choice | Cost |
| --- | --- | --- |
| Level 2 | Choose a subclass and learn its foundation | 1 skill point for the foundation |
| Level 4 | Choose one of two mutually exclusive specialties | 2 skill points |
| Level 6 | Learn the subclass mastery after a specialty | 2 skill points |

Heroes earn one point per level from level 2 through 6, for five points total. Prerequisites, point costs and the reason a skill is unavailable appear on the tree. Training is available between expeditions and cannot be reset. A specialty closes its alternative permanently. Existing innate path bonuses remain visible alongside the new class-specific skills.

Skills affect actual card damage, shields, Poison, healing, cleansing, committed enemy attacks, piercing, drawing or battle/turn preparation. Many depend on a particular card, position, energy cost or Exhaust. Their printed card text and targeting previews resolve those conditions at play time. Reserve heroes can train too.

Each class starts with four cards drawn from three core definitions and can discover six additional actions. The active classes determine the starter deck and reward pool. Rewards exclude fallen classes and avoid adding a third copy of the same definition. Guild restoration grants limited reward redraws each expedition.

All 72 card definitions have explicit rest upgrades. Upgrades can alter energy cost, rank/reach, movement choice, Poison, disruption, drawing or secondary protection as well as primary values. The Guild archive switches between base and upgraded definitions; rest choices state exactly what changes. Card discoveries and rest upgrades last for the expedition; hero skills persist.

## The Last Light: ten services

The town has **seven buildings and three camp landmarks**. Restoration uses banked gold, persists between expeditions and stops at level 3. The Graveyard and landmarks are services without restoration tracks.

| Building or landmark | Service | Restoration prices |
| --- | --- | --- |
| Blacksmith | Equipment access; +1 starting Block per hero per level | 45 / 90 / 135 |
| Adventurers' Guild | All class cards, subclasses and skills; +1 reward redraw per run per level | 40 / 80 / 120 |
| Candle Chapel | +1 HP restored per surviving hero after each victory per level | 50 / 100 / 150 |
| Infirmary | Treat active and reserve wounds; price falls from 15 to 12 / 9 / 6 gold | 30 / 60 / 90 |
| The Wayfarer | Permanent items, relics, stash and salvage; unlock higher stock tiers | 80 / 160 / 240 |
| Watchtower | Map retreat banks 50%, then 55 / 60 / 65% of expedition gold | 35 / 70 / 105 |
| Graveyard | Fallen heroes, their training and equipped-item loss counts | None |
| Campfire / Party | Arrange four active heroes, configure and start an expedition | None |
| Stagecoach / Recruit | Recruit, reserve and reactivate heroes | Recruitment rules above |
| Armory / Equipment | Inspect comparisons and manage the party loadout | None |

## Equipment, gold and settlement

The 44-item catalog includes universal equipment, eight class sets and seven party relics. Weapons, armor and trinkets grant real stats or class cards; relics apply party auras. Some legendary relics combine two existing auras. Duplicate aura types do not stack.

Embark with **one item per hero and one party relic**. During a run, fill each hero's weapon, armor and trinket slots and carry additional distinct relics. Extra equipment brought home must be stored or salvaged before the next lean loadout. Item comparisons show the replacement, net stat changes and cards added or removed. Equipping HP gear increases capacity without repeatedly healing the hero.

Gold is the only currency. Camp purchases use banked gold; expedition shops use run gold. Common gear costs 12-18 gold. Run merchants have seven limited offers including affordable basics, a relic and rare stock; class-specific offers fit living active heroes. Merchant stock survives reloads. Salvage returns half the purchase price, rounded down.

Every victory drops an item. Ordinary loot is weighted toward common/uncommon equipment; elites award relics; bosses award rare or legendary gear. Drop rates, prices and the measured economy tradeoffs are documented in [balance notes](BALANCE.md).

| Outcome | Gold and items |
| --- | --- |
| Victory | Bank all run gold; keep surviving equipment and loose loot |
| Map retreat | Bank 50-65% of run gold; keep surviving equipment and loose loot |
| Flee combat | Lose run gold and found loot; surviving previously owned/purchased gear remains; survivors are wounded |
| Party wipe | Lose run gold, carried items and relics; the camp stash remains safe |

Dead heroes lose their own equipment under every outcome. Settlement records losses once and cannot be repeated for extra gold or items.

## Expeditions

New expeditions have **seven stages**, seeded route choices, **11 encounters** and **three possible bosses**. Route preparation is separate from combat randomness; the same seed and loadout reproduce the route and draws. Choose the seed before descending. Existing five-stage saves retain their original route through that expedition, then move to the new format.

**Pilgrim** uses standard enemy strength. **Veteran** adds 25% enemy HP and 2 attack, and awards 25% more combat gold. Difficulty is selected at camp and cannot be changed midway. Enemy groups include tactics such as wounded-target pressure and timed attack escalation; the map and combat interface explain them.

Rest stops offer healing, a card upgrade, deck thinning or preparation for the next battle. Shrine choices include an HP-for-damage trade, healing, opening protection, opening draw and earned tonics. Choices are single-use and their costs are checked before applying an effect. Equipment and town investment persist; expedition blessings and preparation do not.

## Saving and recovery

Progress saves in the browser under a V2-only key. No account or server receives campaign saves. Browser origin and profile matter: a local preview, the portable launcher and a public site each have separate storage. Use **Help -> export/import** to move a campaign.

Autosave validates state and keeps one previous valid checkpoint. If the active save is unreadable, its bytes are preserved; a valid prior checkpoint may load with saving paused until explicitly restored. Help can export live state, stored bytes, the previous checkpoint and recovery bytes separately.

Explicit restore, import or fresh-start actions preserve the replaced campaign in one recovery slot. This is a bounded recovery copy, not an unlimited archive. Invalid imports or storage failures do not replace the current campaign. A stale tab refuses to overwrite a campaign changed by another tab; because browser storage has no atomic cross-tab transaction, keep one active game tab per origin. See [save recovery details](RELEASE.md#save-recovery).

## Validation, release and limits

Run `npm run check` for behavior/asset tests, strict TypeScript and the production build. Tests include real resolution of every skill node and card upgrade, class recruitment and death, item ownership, settlement, save migration/recovery, enemy targeting and route completion. No separate lint task is configured.

The simulation commands exercise bounded expeditions and save roundtrips:

- `npm run simulate` - baseline expeditions.
- `npm run simulate:discoveries` - discovery rewards, upgrades and town investment.
- `npm run simulate:economy` - repeated campaigns with several spending policies.
- `npm run simulate:balance` - a 576-expedition matrix across compositions, difficulties and spending policies, written to `reports/economy-balance.json`.

These checks establish behavior and expose balance problems; they do not establish perfect difficulty or fun. Current balance evidence shows forgiving Pilgrim runs and a substantial composition gap on Veteran. The balance policy does not yet train skills or make tactical retreats. Read [the measurements and next tuning criteria](BALANCE.md) before changing global difficulty or prices.

The interface targets desktop/laptop landscape. This release is not a fully adapted mobile UI. Card actions have distinct painted panels, but expanded equipment intentionally reuses reviewed prop-art families and some actor animation uses shared pose treatments; 44 items does not mean 44 unique paintings. Procedural sound and existing actor motion remain; composed music, a full skeletal animation system and additional acts are future work. No stress system is included.

Publication is a separate release step after final production browser QA. The existing V1 root remains separate; the V2 deployment path and packaging checks are described in [RELEASE.md](RELEASE.md). This documentation does not assert that a public deployment has occurred.

## Source map

- `src/engine.ts`: deterministic combat, campaign transitions, save validation and journal.
- `src/content.ts`, `src/class-expansion.ts`, `src/card-upgrades.ts`: eight-class card, encounter and mastery definitions.
- `src/progression.ts`, `src/roster.ts`: permanent training, recruitment and active/reserve ownership.
- `src/items.ts`, `src/economy.ts`, `src/town.ts`: items, merchants, loot, settlement and town restoration.
- `src/expedition.ts`: seeded routes, difficulty and expedition choices.
- `src/persistence.ts`: validated local saves and bounded recovery.
- `src/main.ts`, the `*-ui.ts` modules, styles and `src/stage.ts`: interface and Phaser presentation.
- `assets/source/`: source masters and art review records; `public/assets/exported/`: reviewed runtime art.
- `scripts/release.mjs`, `scripts/serve-release.mjs`: checked production package and local launcher.
