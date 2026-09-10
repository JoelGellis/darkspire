# Progression-selected subclasses

Recruits start as base classes. Starting kits still vary, but never select or label a subclass. The first skill investment explicitly chooses one of three fixed paths. The UI explains that this closes the other paths before the player spends.

Each path uses five points across levels 2–6: learn a hallmark, learn a permanently rolled thematic utility, master the hallmark, master the utility, then learn a capstone. Mastery uses existing card upgrades. Full investment adds three cards, not five. The whole path is visible before investment. No new combat status or trigger system was added.

| Class | Three subclasses |
|---|---|
| Fighter | Bulwark, Warlord, Reaver |
| Rogue | Assassin, Duelist, Venomist |
| Cleric | Lifekeeper, Warden, Inquisitor |
| Wizard | Evoker, Arcanist, Frostweaver |
| Barbarian | Berserker, Ravager, Bloodreaver |
| Ranger | Deadeye, Trapper, Volley Archer |
| Necromancer | Plaguebringer, Soulbinder, Bonecaller |
| Paladin | Guardian, Avenger, Hospitaller |

Exact themed actions and utility pools are in `data/skills.js`. Every subclass has a different hallmark within its class. Masteries must change actual behavior; the no-op Martyrdom upgrade is not offered as a mastery.

## Migration

Progression/tree schema 3 preserves compatible learned old effects in `hero.legacySkills`. Old spent points are refunded once so existing heroes can choose a subclass themselves. Kits, level, XP, mastery, gear, wounds, roster membership and campaign progress remain. A notice explains retained training and the refund. Reloading a v3 save neither rerolls utility choices nor refunds points again. Subclasses are never inferred from kit variants. Active-run snapshots retain their effects until the next expedition through the existing persistence layer.

Four-person expeditions and separate roster capacity remain unchanged. Larger future subclass pools are deferred; each class always offers the same three identities.

## Reference boundary

The local corpus had no Last Spell entry. Its [official hero-specific perk-tree announcement](https://store.steampowered.com/news/app/1105670/view/3142950121387743033) supports varied trees per hero; its [official feature description](https://lastspell.com/) describes a class-less system. Darkspire uses the requested fixed classes and subclasses with stable thematic rolls as an adaptation.

## Verification

`tests/subclasses.js` covers all 24 paths, 72 actual combat technique plays, meaningful mastery changes, explicit choice and gates, legacy effects and one-time refunds, exact refresh persistence, and four-person party isolation. `tests/progression.js` retains stat, kit, cap, roster expansion and surplus-roster migration coverage.

The isolated `tests/progression-fixture.html` passed in connected Chrome: all eight hero switches, guided Deadeye selection, point spending and persistence. Desktop and 390px single-column layouts inspected; a manual Lifekeeper choice and Escape returned to campfire showing the chosen identity and four ranks. Existing user saves were untouched.

Publication is integration-lead-owned. Local source contains fixes after the earlier 1820 release recorded elsewhere; that earlier hash must not be represented as containing this final work.
