# Party and equipment verification ? 2026-09-09

IDs 1?10 implemented. IDs 1?7 exercised through actual campfire embark, with browser evidence below; IDs 8?10 have engine integration regression coverage and a real merchant UI, with independent merchant/browser review still required.

Commands (portable Node24):
- `C:/Users/joel/tools/node-portable/node.exe tests/party-equipment.js` PASS: kit/mastery/wounds/loadout/artifacts/acquisition/death/salvage/save.
- `C:/Users/joel/tools/node-portable/node.exe tests/campfire-smoke.js` PASS existing selection, ranks, persistence, embark, save/resume, death/refill, cap, wipe, corruption and assets.

The equipment test calls actual campfire embark, checks four rolled kit IDs, canonical upgrade effects/values, wounded+geared HP preview equality, artifact cap, exactly one granted card, idempotent loadout, canonical restored mastery and gear effects, forbidden combat/dead-wearer transfer/salvage, duplicate purchase rejection, salvage removal and exactly-once gold, survivor equipment retention, dead wearer ownership/ledger and no duplicate survivor slot. It transfers HP armor away and back with an injured wearer and asserts no healing exploit.

Browser (Chrome through CUA, isolated in-memory fixture `tests/equipment-fixture.html`): selected wounded Fighter; equipped Oaken Quarterstaff then Leather Jerkin; HP preview42?46, third-item equip disabled; carried Bag of Holding; selected Rogue/Cleric/Wizard; descended via actual button. Map shows46/46 Fighter and deck33; opened deck and observed Staff Strike bound to Fighter and rolled Taunt/Frost Nova cards. Visual deck readout inspected at native desktop width1530. Narrow viewport and merchant browser interaction remain for independent release QA. Fixture provides a labeled merchant shortcut for this purpose, with no normal player-storage access.

Decisions: most recent DESIGN gold doctrine controls: bought equipment is permanent until salvage or wearer loss, so disabled old automatic ordinary-item consumption. Departure still caps two items per hero and two artifacts. Midrun transfer cannot heal or strip dead wearers. New armory UI is explicit in campfire and dungeon shop.

Files: state.js, intro.js, gear.js, campfire-view.js, equipment-view.js; tests/party-equipment.js and isolated equipment fixtures. No commits or deployment by this agent.

## Fullscreen UI checkpoint (same session)

Runtime visual slice is freeze-ready for independent release QA. Tested source includes current css/game-theme.css, js/visual-system.js, js/equipment-view.js and original stagecoach SVG (matching source+export). No dependency/build added. Expedition11?17 module is UNINTEGRATED and UNTESTED; exclude its script include from release.

- 1366?768 campfire: document dimensions equal viewport; all four hero/rank and descend controls visible. Gear preparation changed from long form to bounded portrait scene; per-hero portrait selection and artifact controls fit with no dialog overflow. Also checked1536?864 and1920?1080 (dialog scrollHeight equals clientHeight).
- 1366?768 town: painted scene with actual location labels, carriage in lower-left; all five building hit regions, stagecoach and assemble controls inside viewport. Lowest assemble bottom759.4<768. Screenshot visually inspected. Roster now four/page; old scrolling sidebar replaced by pages.
- 1366?768 shop: document equal viewport, card offers and leave visible (leave bottom636.4). Gear armorer opened; purchased Holy Symbol then salvaged it,35g returned and item disappeared. Updated balance on armorer open and purchase/salvage redraw to avoid stale currency labels. Stock/card services split into bounded pages. Node test remains authority for exact one-purchase cost (browser session had cross-agent handle collision, documented below).
- Map: all route nodes within viewport (top202.6..bottom690.3). Actual available floor1 button entered combat.
- Combat: played Arcane Ward; energy3?2 and Wizard+5 Block observed. Clicked actual End Turn; enemy actions completed and Turn2 appeared. Found and fixed outer-card lower edge clipping by raising hand22px. Final card bottoms?756.05 at768h,?852.05 at864h,?1068.05 at1080h. End-turn control inside viewport at all three sizes. Long intent labels bounded/wrapped to prevent overlap.

Browser screenshot evidence was inspected directly in CUA output, not saved as local PNG artifacts. Final dedicated QA handle equipmentTab=1423971875, localhost8766. Shared `var tab` across agent REPL usage caused earlier observation collisions; unique per-agent variable handles now required. All fixtures isolate localStorage; fixture actor is explicitly scripted equipment-fixture/v1. Do not infer player identity.

Remaining beyond this first slice: independent reward/rest/summary/large inventory fit sweep and mobile-specific composition; bespoke painterly carriage/merchant prop treatment. The current stagecoach is an original vector silhouette, not final painted artwork. Full100-item completion is not claimed.
