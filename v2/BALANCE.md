# Itemization and economy balance

## What is implemented

Gold is the only currency. The 44-item catalog contains universal equipment,
eight class sets with a weapon, armor and trinket each, and seven party relics.
Equipment grants actual attack power, maximum HP, opening Block, or an additional
owned-class card. There are no descriptive-only proc effects. The three legendary
relics combine existing party auras; duplicate aura types never stack.

| Item family | Cost | Purpose |
| --- | ---: | --- |
| Common blade / mail / charm | 18 / 16 / 12 | Affordable damage, lasting HP capacity, or immediate protection |
| Unbroken Bell | 30 | Trade most initial gold for party-wide opening protection |
| Roadworn brigandine / Duelist's token | 32 / 34 | Mixed defensive or offensive stats |
| Original class-specific items | 36–42 | Change the starting deck with a class action |
| Eight class weapons | 44 | +2 power and another class attack |
| Eight class trinkets | 54 | +4 maximum HP and a class support action |
| Eight class armors | 58 | Class-shaped HP / opening Block tradeoffs |
| Ironheart / Rune-etched edge / Dusk plate | 58 / 62 / 65 | Universal rare alternatives |
| Lantern / Coin / Reliquary | 60 / 55 / 70 | Opening draw, victory gold, or post-battle recovery |
| Oathbreaker | 80 | Strong universal pure damage |
| Three combined legendary relics | 120–130 | Two nonstacking auras in the single camp relic slot |

Class armor mixes: Fighter 8 HP / 7 Block; Rogue 6 / 8; Wizard 12 / 2;
Cleric 8 / 6; Barbarian 16 / 1; Ranger 8 / 6; Necromancer 12 / 2;
Paladin 10 / 5. These are maximum HP additions, not free healing when repeatedly
equipping. Names and card identity differ by class; expanded gear uses reviewed
prop-art families and does not claim 44 unique paintings.

## Merchant and ownership rules

Camp offers every item unlocked at merchant level 0–3, including equipment for
future recruits. Each item definition can be bought once per stock cycle. Camp
stock refreshes on the next expedition or merchant upgrade; loading a save cannot
reroll it. Merchant restoration costs 80 / 160 / 240 gold. Town investment competes
with healing, recruitment and permanent gear purchases.

Run shops offer seven items: the three cheap gap-fillers, rotating alternatives,
at least one relic and at least one rare-or-better item. Class-restricted run stock
and loot only target a living active class. Camp can equip three slots for planning,
but embark enforces one item per hero and one party relic. Equipment found or
purchased later can fill all slots; distinct relics can be added during the run.

Salvage returns floor(cost / 2). Buying and reselling always loses gold. Ordinary
victories drop one equipment item at 75% common / 25% uncommon. Elites drop one
relic, with rarity probabilities 45% / 40% / 13% / 2%. Bosses drop one rare (90%)
or legendary (10%) item. Probability is assigned to a rarity band first and shared
within that band's compatible items; expanding the class catalog cannot silently
change rarity rates. These distributions are regression-tested across 1,000
evenly spaced rolls.

Camp stash is safe. Victory and map retreat preserve carried loot and surviving
gear. Fleeing loses found gear and run gold; surviving purchased equipment remains.
Dead heroes lose their equipped gear. A wipe also loses the carried pack/relics.
Every settlement records item losses, and cannot be applied twice.

## Measurement

Run `npm run simulate:balance` to refresh `reports/economy-balance.json`. It runs
576 expeditions: 8 seeds, 3 repeated runs, 3 compositions covering all 8 classes,
2 difficulties, and 4 spending policies. Every node and camp return passes a save
roundtrip. Each cohort starts with 40 gold and a deliberately equal-budget party
fixture, so the report compares combat compositions without charging one cohort
for recruiting all four heroes. Actual gameplay still charges roster recruitment.

The policies save money, buy common survival items, invest in rare stock/gear, or
restore the estate. All equip finds and salvage duplicate spare copies. The report
records wins, hero deaths, earned gold, purchase/treatment spending, salvage,
permanent investment, lost unbanked gold, lost item retail value, final bank and retained item value.
Each campaign also asserts gold conservation: initial gold plus combat earnings
and salvage, less purchases, estate investment and losses, equals the final bank.
Retail value is not spendable cash; salvage realizes only half. The visible-state
combat policy is bounded and does not know future draws. It does not train skills
or make tactical retreats, so its loss rates are not forecasts of human play.

Initial September 19 results: all Pilgrim cohorts won 24/24 expeditions per policy.
Cheap equipment reduced founder-party deaths from five to one. Veteran results:

| Party | Save | Common gear | Rare investment | Estate |
| --- | ---: | ---: | ---: | ---: |
| Fighter / Rogue / Cleric / Wizard | 3/24 | 14/24 | 8/24 | 5/24 |
| Paladin / Barbarian / Ranger / Necromancer | 10/24 | 14/24 | 17/24 | 10/24 |
| Barbarian / Paladin / Cleric / Ranger | 17/24 | 17/24 | 19/24 | 17/24 |

These establish a real survival/spending tradeoff on Veteran, while exposing a
large composition gap. They do not establish finished balance. The test also
found a melee stalemate behind dead front ranks; engine regression work now
closes living enemy formation gaps after deaths.

## Next tuning passes and acceptance criteria

1. **Validate policies before changing prices.** Add skill selection, healing
   tonics and informed retreats to separate weak policy decisions from class
   weaknesses. Run mirrored seeds with fixed routes/loadouts and report first-run
   results separately from inherited rare gear. Keep the present baseline for
   comparison.
2. **Close composition gaps on Veteran.** Investigate founder losses by encounter,
   rank-lock downtime, incoming damage, healing and defensive-card draw rates.
   Target less than a 20-point victory-rate spread between plausible formations
   under the same policy. Adjust a specific card or encounter cause before adding
   blanket starting HP or reducing every enemy's damage.
3. **Preserve affordable survival.** Keep initial 40 gold enough for two or three
   basics or the starter relic. Buying basics should reduce deaths before a
   player can afford rare stock. Track deaths and equipment loss as well as wins;
   a won expedition with three permanently dead veterans is expensive.
4. **Check rare purchases over time.** Run 10-run cohorts after short-run behavior
   stabilizes. Compare survival, replacement costs, bank, merchant upgrades and
   realized salvage. Rare investment should trail basic coverage initially, then
   produce a distinct retained-loadout advantage without becoming mandatory.
5. **Control the gold supply.** Report combat income and salvage separately.
   Coin's +8 gold per victory must compete with survival/draw relics. Avoid
   increasing loot quality to fix class difficulty; it increases salvage income
   for every class. Test duplicate drops and losses, not only perfect clears.
6. **Test estate break-even.** Compare Chapel, Smith, Guild and Watchtower with
   an equal gold budget. Include retreat-heavy and redraw-using policies. Do not
   infer Guild's value from a policy that never spends its redraws.
7. **Human play before final difficulty claims.** Observe first-time choices,
   forgotten rank gates, item comparisons, recovery from death, and willingness
   to retreat. Pilgrim can remain forgiving; Veteran needs understandable causes
   of loss and several viable equipment strategies.

Production gates remain deterministic behavior, valid saves, no impossible
inventory ownership, no currency duplication, bounded battles, and legible
merchant/armory controls. Difficulty and price targets above are proposed tuning
criteria, not claims that they have already been met.
