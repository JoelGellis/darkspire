# Darkspire Product

Darkspire is a browser-based dark-fantasy roguelike deckbuilder: Slay the Spire's run structure and readability combined with Darkest Dungeon-inspired party tactics, persistence, and atmosphere.

The player recruits a four-hero party, manages rank-based combat, descends through a branching dungeon, and decides when to spend or bank permanent value. The live feature specification is `../DESIGN.md`; session-level implementation context is `../PIN.md`.

## Product boundaries

- Browser game; vanilla JavaScript, HTML, and CSS.
- No required build step or backend.
- Tactical decisions and legibility matter more than visual asset volume.
- A small number of strong, reusable visual motifs beats a large collection of inconsistent AI outputs.
