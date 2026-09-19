# Returning class card paintings

Generated with the built-in image-generation tool on September 19, 2026. Source and exact reviewed export: `cards/returning-classes-atlas.png` and `public/assets/exported/cards/returning-classes-atlas.png`. The original generated file is retained under the local Codex generated-images directory.

Prompt: A production Darkspire card-art atlas of mature gothic oil paintings, expressive silhouettes and candlelit shadows; exactly four columns and nine rows, no text or UI. Columns: axe-bearing barbarian, green hooded ranger, violet bone-staff necromancer, golden armored paladin. Rows: basic strike; defensive action; signature attack/heal; area attack; howl/poison/enfeeble/piercing blade; crushing strike/focus/ossuary/bastion; iron skin/piercing arrow/forbidden rite/cleansing; charge/snare/soul rend/rebuke; last stand/trail ward/grave bloom/pilgrim vow. Every cell is an independent scene with its own central focal point.

Reviewed the full 836 x 1881 output visually. All 36 action scenes are present in the intended four-column order. Row heights vary; `card-art.ts` uses reviewed row boundaries rather than assuming uniform ninths. Class positions in the code's class-major array map to the atlas's row-major arrangement. Paintings illustrate class actions, not exact persistent hero portraits.

The four additional class combat figures reuse the existing reviewed parent class sprite exports. Their action texture currently reuses the idle figure; this is explicit reuse, not a claim of four new poses. New equipment variants also reuse reviewed prop families, with unique names, stats and text. Existing asset tests validate cell bounds, distinct card cells, exact source/export copies, and valid textures for every class and encounter.
