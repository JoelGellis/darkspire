# DARKSPIRE — Game Design Document

## Concept
Darkest Dungeon meets Slay the Spire. Four-hero party, positional deckbuilding combat,
branching dungeon map, roguelike progression. Browser-based, vanilla JS, single HTML file.

---

## What EXISTS (v0.1 — built 2026-03-31)

### Core Loop (working)
- Title screen → New Run → Map → Node encounters → Reward → Map → ... → Boss → Game Over
- 7-floor branching map (canvas-rendered, animated, StS-style)
- Card-based combat with energy system (3/turn, draw 5)
- Position system (heroes at pos 1-4, cards require specific positions)
- Turn structure: play cards → end turn → enemy actions → poison ticks → new turn

### Heroes (4, fixed party)
| Hero    | HP | Pos | Role                        |
|---------|----|-----|-----------------------------|
| Fighter | 52 | 1   | Tank — block, melee damage   |
| Rogue   | 38 | 2   | DPS — multi-hit, poison      |
| Cleric  | 34 | 3   | Support — heals, shields     |
| Wizard  | 26 | 4   | AoE — spells, card draw      |

### Cards (32 total: 4 per hero × 2 tiers)
- **Starter cards** (16): 4 per hero, 2 copies each = 32-card starting deck
- **Reward cards** (16): 4 per hero, offered post-combat (3 random picks)
- Card types: attack, block, heal, draw, utility
- Position-gated: each card lists valid positions (prefPos)
- Upgrade system: +3 value, append "+" to name

### Enemies
- **Normal** (4 pools): Skeleton Patrol, Goblin Ambush, Dark Cult, Slime Nest
- **Elite** (2 pools): Bone Knight + Mage, Bandit King + Thugs
- **Boss** (1): The Lich (80 HP, summons Skeleton Guards)
- Intent system: attack, attack_multi, attack_all, attack_poison, poison, defend, buff, heal_allies, summon
- Targeting: front, back, random, all

### Relics (12 total)
- **Common** (5): Iron Shield, Healing Herb, Sharpening Stone, Torch, Lucky Coin
- **Uncommon** (5): Berserker's Ring, Mage's Codex, Guardian Angel, Position Boots, Vampiric Blade
- **Rare** (3): Crown of Thorns, Philosopher's Stone, Time Crystal, Soul Jar, Dragon's Heart
- Hook system: onCombatStart, onTurnStart, onCardPlayed, onDamageTaken, onEnemyKill, onCombatEnd
- Flag system: energyBonus, enemyDamageBonus, goldMultiplier, ignorePosition, persistentBlock, etc.

### Events (8)
Mysterious Shrine, Wandering Merchant, Training Grounds, Trapped Chest,
The Beggar (delayed relic payoff), Ancient Library, Blood Altar, The Forge

### Map
- 7 floors: Start → 5 mid floors (2-4 nodes each) → Boss
- Node types: combat, elite, rest, event, shop
- Canvas rendering with animated glows, visited path tracking
- Crossing-reduction algorithm for clean paths

### Other Systems
- Gold: earned from combat (10-20 + floor bonus), spent at merchants/shops
- Rest sites: exist as node type (heal implementation in UI)
- Shop: exists as node type (implementation in UI)
- Save/Load: stubbed out in state.js (not functional)
- Stats tracking: floorsCleared, enemiesSlain, cardsCollected

### Tech Stack
- Vanilla JS, no framework, no build step
- Single `index.html` loads CSS + 10 JS files
- Canvas for map, DOM for everything else
- ~180KB total code

---

## What's MISSING — The Roadmap

### Phase 1: Polish the Core (make it feel good)

**1A. Combat Feel**
- [x] Card exhaust mechanic — DONE (card passed to effect, _exhaust routes to exhaustPile)
- [x] Block decay — DONE (hero block resets each turn, enemy block persists)
- [x] Stun visual indicator on enemies — DONE (lightning bolt badge)
- [x] Dead hero visual — DONE (greyscale + skull overlay)
- [ ] Card hover preview (enlarged card with full description)
- [x] Damage number animations — DONE (floating text with color coding)
- [x] Screen shake on big hits — DONE (10+ actual damage triggers shake)
- [ ] Sound effects (howler.js or Web Audio API — hit, block, heal, card play, death)

**1B. UI/UX**
- [ ] Tooltip system (hover relics, cards, enemies for info)
- [x] Enemy intent icons — DONE (sword, shield, arrow, skull, heart, poison icons)
- [ ] Turn order clarity (whose turn it is, visual indicator)
- [x] Card highlighting — DONE (playable cards breathe-glow, unplayable dimmed/labelled)
- [ ] Position indicators on the battlefield
- [ ] Responsive layout (currently assumes ~500px+ width)
- [ ] Mobile touch support

**1C. Rest Site Implementation**
- [x] Heal option — DONE (restore 30% max HP to all heroes)
- [x] Upgrade option — DONE (pick a card to upgrade, +50% value, rebinds effect)
- [x] Remove option — DONE (pick a card to remove from deck)

**1D. Shop Implementation**
- [x] Display 3 random cards for purchase — DONE (50-75 gold each)
- [x] Display 1 relic for purchase — DONE (100-150 gold based on rarity)
- [x] Card removal service — DONE (75 gold)
- [x] Heal potion — DONE (30 gold, heal all 15 HP)

### Phase 2: Depth (make it interesting)

**2A. More Content**
- [ ] 2-3 more boss encounters (variety per run)
- [ ] 4+ more normal encounter pools
- [ ] 2+ more elite encounter pools
- [ ] 8+ more cards per hero (total ~12 per hero)
- [ ] 6+ more relics
- [ ] 4+ more events
- [x] Enemy scaling by floor — DONE (+10% HP, +0.5 dmg per floor in state.js)

**2B. Status Effects System**
- [ ] Formalize status effects: Poison (exists), Stun (exists), Bleed, Weak, Vulnerable, Strength
- [x] Status effect icons on hero/enemy portraits — DONE (block/poison/stun/buff badges)
- [ ] Status effect tooltips
- [ ] Duration tracking (some effects last N turns)

**2C. Card Upgrades Rework**
- [ ] Each card should have a defined upgraded version (not just +3 value)
- [x] Upgrade preview at rest sites / forges — DONE (shows before/after in train screen)
- [ ] Visual indicator for upgraded cards (gold border or star)

**2D. Deck Management**
- [x] Deck viewer — DONE (modal overlay, accessible from map + combat)
- [x] Draw pile / discard pile / exhaust pile viewer during combat — DONE (clickable pile labels)
- [x] Card removal at shops and events — DONE
- [x] Duplicate prevention — DONE (reward pool filters owned cards, only offers reward-tier cards)

**2E. Scoring / Meta**
- [ ] Run summary screen (enemies killed, gold earned, relics found, cards collected)
- [ ] High score tracking (localStorage)
- [ ] Seed-based runs (share a seed, get same map/encounters)
- [ ] Unlock system (beat the game to unlock new cards/relics)

### Phase 3: Art & Identity (make it look/sound right)

**3A. Visual**
- [ ] Pixel art or hand-drawn sprites for heroes (replace emoji/text)
- [ ] Enemy sprites
- [ ] Card art (small illustrations per card)
- [ ] Map node art (replace geometric shapes)
- [ ] Background art per floor theme
- [ ] Particle effects (combat, spells, fire at rest sites)
- [ ] Consistent dark fantasy color palette (DD-inspired)

**3B. Audio**
- [ ] Background music (ambient dungeon, combat, boss)
- [ ] Sound effects (card play, hit, block, heal, death, gold)
- [ ] UI sounds (button hover, click, screen transition)

**3C. Narrative**
- [ ] Floor themes (Crypt → Caves → Ruins → Sanctum → Throne)
- [ ] Event writing polish (more flavor text, consequences)
- [ ] Boss intro text / lore
- [ ] Hero backstories (optional, shown on title screen or between runs)

### Phase 4: Advanced Systems (if we get here)

**4A. Town / Meta-progression (the DD half)**
- [ ] Town screen between runs
- [ ] Persistent upgrades: Blacksmith (card upgrades carry over), Chapel (starting HP bonus), etc.
- [ ] Hero recruitment from a wagon (pick 4 from pool of 6-8)
- [ ] Hero permadeath across runs (DD-style)
- [ ] Gold carries over between runs (spent in town)

**4B. Advanced Combat**
- [ ] Combo system (playing certain cards in sequence triggers bonus effects)
- [ ] Equipment slots (weapon, armor, trinket per hero — permanent upgrades, not cards)
- [ ] Multi-target card selection (pick which enemy to hit for single-target spells)
- [ ] Exhaust pile viewer
- [ ] Ethereal cards (exhaust if not played this turn)
- [ ] Innate cards (always in opening hand)
- [ ] Curses (bad cards added to deck by events/enemies)

**4C. Multiple Acts**
- [ ] Act 1: Crypt (floors 1-7, current content)
- [ ] Act 2: Mines (new enemies, new boss, harder)
- [ ] Act 3: Sanctum (final boss, endgame)
- [ ] Each act has its own encounter pools, events, shop inventory

---

## Architecture Notes

### Current File Structure
```
darkspire/
  index.html              # Entry point, loads everything
  css/style.css            # All styles (~49KB)
  js/
    main.js                # Game flow controller (startRun, selectNode, combat outcomes)
    state.js               # Run state, combat state, save/load stubs
    combat.js              # Combat engine (card play, damage, turn cycle, relic hooks)
    ui.js                  # All screen renderers (DOM-based)
    map.js                 # Map generation + canvas rendering
  data/
    heroes.js              # Hero definitions (4)
    cards.js               # Card definitions + deck builder + reward pool
    enemies.js             # Enemy encounter pools + picker
    relics.js              # Relic definitions + hook system
    events.js              # Event definitions + picker + beggar debt system
  assets/                  # Empty (for future art)
```

### Design Principles
1. **No build step.** Open index.html in a browser. Done.
2. **Vanilla JS.** No React, no framework. DOM manipulation + canvas.
3. **Data-driven.** Heroes, cards, enemies, relics, events are all plain objects in data/ files.
4. **Hook system for relics.** Relics declare hooks (onCombatStart, onCardPlayed, etc.) that the combat engine calls at the right time. New relics = new objects, no engine changes needed.
5. **Position matters.** The 4-position system is the key differentiator from StS. Cards are gated by position. Moving/swapping heroes is a tactical choice.

### Known Bugs / Tech Debt
- [ ] Save/Load is stubbed but non-functional (functions with refs can't serialize)
- [x] Some cards call `DS.Combat.log()` instead of `DS.Combat.logMsg()` — FIXED (logMsg with class param)
- [x] Exhaust mechanic — FIXED (card passed as 4th arg to effect, combat engine handles _exhaust flag)
- [x] Time Crystal relic — IMPLEMENTED (skips enemy actions on turn 1)
- [x] Soul Jar relic — IMPLEMENTED (dead hero cards playable at 50%)
- [x] Dragon's Heart relic — IMPLEMENTED (persistent block, decays 1/turn)
- [x] Rest site / Shop — FULLY IMPLEMENTED (heal/train/purge at rest, cards/relics/potion/remove at shop)
- [x] Card reward pool duplicates — FIXED (filters out cards already owned 2+, only offers reward-tier cards)
- [x] Resurrect card was unplayable (dead heroes rejected as targets) — FIXED
- [x] Taunt card was non-functional (flag set but never read) — FIXED
- [x] Shop healing potion button was unclickable (no onclick handler) — FIXED
- [x] Double enemy scaling (combat.js + state.js both scaling) — FIXED (removed duplicate in combat.js)
- [ ] No deck size limit

---

## Priority Order (what to build next)

1. **Fix bugs** — logMsg typos, exhaust mechanic, rest/shop functionality
2. **Combat polish** — block decay, card hover, intent icons, exhaust
3. **Rest + Shop** — full implementations with real choices
4. **More content** — bosses, enemies, cards, events
5. **Scoring + saves** — run summary, high scores, working save/load
6. **Art pass** — replace emoji with pixel art or SVG
7. **Audio** — ambient + effects
8. **Town meta** — if the game is fun enough to warrant persistence
