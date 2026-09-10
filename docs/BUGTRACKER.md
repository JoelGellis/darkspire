# Darkspire bug tracker

Use this file for observed behavior that needs a reproducible fix. Keep entries short and attach the floor, encounter, card/item, expected result, actual result, and any useful combat log text.

## Open

### BUG-001 — Damage or multi-hit result looks wrong

- **Reported:** 2026-09-10
- **Area:** Combat damage resolution
- **Report:** Some attacks have produced unexpected damage results during play.
- **Reproduce:** Add the exact card, energy, target HP/block, and combat log when it happens.
- **Status:** Open; Arcane Barrage received a regression test and shop cards now preserve its X-cost metadata.
- **Current lead:** This was initially traced to hidden floor scaling and enemy buffs. Floor scaling is now removed; if a 9 still becomes 12, capture the enemy buff/status row and combat log in the report.

## Fixed

### BUG-002 — Arcane Barrage used only one damage packet

- **Reported:** 2026-09-10
- **Cause:** Shop-created card copies dropped `xCost`, so the card stopped behaving as an X-cost card after purchase.
- **Fix:** Preserve `xCost`, reach, and preferred-position metadata when cards enter the deck from the shop; added a three-energy regression test.
