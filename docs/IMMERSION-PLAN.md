# Darkspire immersion plan

Joel's acceptance rule (2026-09-09): a fullscreen game, with navigation attached to places and people. No document scrolling, generic dashboard tabs or cropped-away actions. Match the compositional logic of Darkest Dungeon's hamlet and Slay the Spire's tactical field using Darkspire's own art.

References: [Red Hook official Darkest Dungeon media](https://www.darkestdungeon.com/darkest-dungeon/media/), [Mega Crit official Slay the Spire press kit](https://www.megacrit.com/press-kits/slay-the-spire/), local ART_DIRECTION.md and ASSET_PIPELINE.md. Reference art is for study, never copied into runtime. The press kit confirms card/deck/encounter identity; exact numerical balance remains the separate reference corpus.

## Screen composition

- Campfire: full-width painted night scene, heroes as selectable figures around the fire; no hero dashboard cards. A compact bottom marching line is always visible. Stagecoach is a corner world destination opening recruit portraits; hamlet destination leads to town. Gear inspection opens against the chosen full-body hero with weapon/armor/trinket slots next to the body; clicking a slot opens the owned-item shelf. Shared artifacts sit as two party seals. Existing reviewed hero sprites and campfire plate supply this composition.
- Town: the painted hamlet fills the main plane. Stagecoach in the lower-left corner opens company recruitment; actual buildings are the hit regions for chapel, tavern, graves, forge and merchant. Roster lives at the right edge with four portrait entries per page. Building names appear as restrained location labels rather than rectangular navigation tiles. The merchant stock uses a bounded stall overlay with gear objects, prices and the party, never a long web page.
- Map: parchment route in the center, selected company's portraits on the left, legend at right, persistent top HUD. Route scales to viewport height and every available destination remains hit-testable. No vertical journey scrolling for current six-floor map.
- Combat: heroes/enemies fill the mid-plane; intent above enemy head, rank at feet; bottom card fan, energy/draw at left and end-turn/discard at right. Inspection is a bounded contextual panel. Combat log collapses into an optional overlay. No extra full-width strip below cards. Supplies/flee belongs in compact corner controls.
- Reward/rest/event: one focal scene and one bounded choice composition. Reward choices are cards; rest choices are camp actions. Card browsing is paginated, not a scrolling inventory. Return path stays visible.
- Summary: casualties and recovered equipment beside the returning party. Outcome, gold and return action remain on-screen; detailed ledger opens as a bounded overlay.

## Implementation order

1. Fixed viewport shell and compact campfire marching bar; verified no document overflow AND click targets stay on-screen at1366?768,1536?864,1920?1080.
2. Hero-centered equipment scene with portrait controls, two embark gear slots and two artifact seals; retain real restrictions/acquisition/loss behavior.
3. Corner stagecoach/hamlet locations and world-aligned town building hit regions; paginate roster/merchant services.
4. Inspect map/combat/shop/reward/rest/summary at each size. Check actual button bounding boxes, screenshot readability and full click flows; `overflow:hidden` alone is not evidence.
5. Independent release review, only then demo publication. Expedition11?17 remains outside this visual checkpoint until its mechanics and fullscreen controls are tested.

## Acceptance and missing art

Every legal core action must be reachable without document scroll. All eight class figures, four rank slots, active intent and available cards must remain distinguishable. Text must be readable at laptop size without zooming. Gear choices must identify wearer, cost, slot, effect and permanence. Mouse and keyboard focus work in overlays; Escape closes back to the same scene. No scrolling by surprise, no clipped close/return controls.

Existing assets suffice for current layout iteration. A bespoke stagecoach silhouette/painted carriage and separate merchant-stall plate would materially strengthen immersion; the current hamlet plate does not provide an independently editable coach. Until approved reviewed artwork exists, use a restrained carriage vector integrated into the corner rather than claim a finished painterly coach. Save vector source and runtime export under the established asset pipeline.
