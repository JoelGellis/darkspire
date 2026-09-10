window.DS = window.DS || {};

// ============================================================================
// PHASE 5 — GEAR / EQUIPMENT DATA LAYER + ECONOMY LOGIC
// ============================================================================
// Replaces the Phase-3 placeholder DS.Gear that lived in meta.js.
// This file is DATA + LOGIC only — the loadout UI (merged with party select)
// is built elsewhere and consumes the API documented below.
//
// Sourcing (see reference/INDEX.md):
//   Flavor  — D&D 5e SRD item/weapon names (reference/dnd-5e.md §2, §5).
//   Tactics — Darkest Dungeon rank-gating; injected cards carry prefPos
//             (reference/darkest-dungeon.md §1).
//   Numbers — Slay the Spire yardsticks (reference/sts.md):
//             1 energy ≈ 6 dmg / 5 block (§1); shop price ladder — common
//             card 45-55g vs rare 135-165g (~1:3), rare relic 285-315g (§3).
//             Darkspire's economy runs leaner (fights pay 10-20g +2/floor,
//             town buildings 40-150g), so the ladder is scaled down:
//             common ~25-35g, uncommon ~55-75g, rare ~120-160g,
//             legendary ~280-300g (legendary ≈ StS rare-relic sticker).
//
// DATA MODEL
//   Meta (persists across runs):
//     DS.Meta.ownedGear                    — array of owned gear ids. Items
//                                            belong to the PLAYER, not the hero
//                                            — the transferable layer, unlike
//                                            cards/levels which are hero-bound.
//     DS.Meta.heroRoster[i].gear           — { weapon, armor, trinket, trinket2 }
//                                            slot map of ids (saved loadout).
//                                            Gear swaps freely between heroes
//                                            outside combat (equip reassigns);
//                                            unequipped gear sits safe in the
//                                            bank — only EQUIPPED gear dies
//                                            with its hero (Phase 4 rule).
//     DS.Meta.merchantLevel                — town merchant upgrade tier (0-3)
//     DS.Meta.lostGear                     — ledger of gear lost to death/wipes
//                                            ({itemId, heroName, cause, runNumber});
//                                            v1: lost stays lost — the ledger
//                                            enables a future buyback softener
//   Run (lives on DS.State.run):
//     run.heroes[i].gear                   — same slot map, stamped at run start
//     run.artifacts                        — party-wide artifact ids (max 2)
//     run.gearAcquired                     — ids bought DURING this run
//
// LIFECYCLE
//   Town: buyInTown → ownedGear. equip/unequip → roster slot maps.
//   Run start: UI calls DS.Gear.applyLoadout(run, rosterIndices, artifactIds).
//   Mid-run: buyOnRun / salvage at the merchant.
//   Run end: summary.js calls resolveRunEnd(run, outcome, rosterIndices):
//     - dead heroes lose equipped gear (DS.Meta.killHero strips it)
//     - non-take-home gear that was USED this run is consumed (the burn cost)
//     - rare/legendary (take-home) gear persists and pre-equips for next run
//
// COMBAT HOOK API (engine-facing; live today via the relic-hook wrappers at
// the bottom of this file — no combat.js edits needed). Three distinct
// surfaces per the equipment model (stats / abilities / cards):
//   DS.Gear.getModifier(hero, key)  → number  (one stat; includes artifacts)
//   DS.Gear.getStatMods(hero)       → {key: total} merged stat-mod object
//   DS.Gear.getGrantedCards(hero)   → card defs injected by equipped gear
//   DS.Gear.getGrantedFlags(hero)   → ability-style flags (freeMove, ...)
//   DS.Gear.getPartyModifier(key)   → number  (artifacts only)
//   Mod keys:
//     startBlock     — Block granted at combat start
//     strength       — Strength granted at combat start
//     damageBonus    — bonus damage on single-target attack cards
//     maxHp          — bonus max HP for the run (applied at loadout/purchase)
//     endCombatHeal  — HP healed after each victorious combat
//     firstTurnDraw  — (party) extra cards drawn on combat start
//   Flag keys (surface through DS.Combat.hasRelicFlag / sumRelicFlag):
//     freeMove       — move actions cost 0 energy
//     energyBonus    — +N max energy (reserved; no item uses it yet)
// ============================================================================

DS.Gear = {

  // ===== TUNING CONSTANTS =====

  // Salvage return rate. DESIGN.md: ~50-60% so cheap gear has a burn cost.
  // TODO(Joel): open balance param — 0.55 is the midpoint guess.
  SALVAGE_RATE: 0.55,

  // ---- Merchant doctrine (Joel, 2026-08): gold ALWAYS buys permanent things.
  // The merchant sells GEAR only — never temp buffs/rentals. Two faces of the
  // same merchant:
  //   TOWN  = safe + gradual. Stock quality scales with a DD-hamlet-style
  //           upgrade track (DS.Meta.merchantLevel), staying below the in-run
  //           ceiling until the top tier.
  //   IN-RUN = high volatility, high rarity ceiling. Gamble-y rolls with
  //           rare/legendary chances above the town's current tier — the
  //           reason a stacked party still wants to spend run gold.

  // Town stock rarity weights, indexed by DS.Meta.merchantLevel (0-3).
  // TODO(Joel): open balance params (weights AND tier count).
  TOWN_RARITY_WEIGHTS: [
    { common: 65, uncommon: 35, rare: 0,  legendary: 0 },   // L0 — village peddler
    { common: 50, uncommon: 35, rare: 15, legendary: 0 },   // L1
    { common: 35, uncommon: 40, rare: 20, legendary: 5 },   // L2
    { common: 25, uncommon: 35, rare: 28, legendary: 12 }   // L3 — matches the run ceiling
  ],

  // In-run stock weights — hot rolls, above town until town hits L3.
  // TODO(Joel): open balance param.
  RUN_RARITY_WEIGHTS: { common: 25, uncommon: 35, rare: 28, legendary: 12 },

  // Merchant upgrade track: cost to go from level N → N+1 (banked gold).
  // Calibrated against town building costs (40-150g in meta.js).
  // TODO(Joel): open balance params.
  MERCHANT_UPGRADE_COSTS: [80, 160, 240],
  MERCHANT_MAX_LEVEL: 3,

  // Items shown at the town merchant, by merchant level (re-rolled each run).
  TOWN_STOCK_SIZE_BY_LEVEL: [4, 5, 6, 7],

  // Items offered per in-run shop visit.
  RUN_STOCK_SIZE: 3,

  // "Lean partial-equip" rule (DESIGN.md): max items equipped per hero AT RUN
  // START. Mid-run you can fill all 4 slots. TODO(Joel): open param (1 or 2?).
  MAX_EQUIP_AT_START: 2,

  // Party-wide artifacts carried per run (DESIGN.md says 1-2).
  MAX_PARTY_ARTIFACTS: 2,

  // If true, non-take-home gear used on a run is consumed at run end. Per the
  // gold-permanence doctrine it AUTO-SALVAGES into banked gold at the reduced
  // RUN_END_SALVAGE_RATE (spent gold always converts back to permanent value)
  // — but salvaging manually at a shop before run end (full SALVAGE_RATE, paid
  // in spendable run gold) stays strictly better.
  // TODO(Joel): open params — both the consume rule and the reduced rate.
  CONSUME_ON_RUN_END: false,
  RUN_END_SALVAGE_RATE: 0.3,

  // Rarities that survive the run and become loadout options ("take-home").
  TAKE_HOME_RARITIES: ['rare', 'legendary'],

  // Per-hero inventory slot scheme: weapon / armor / two trinkets.
  // TODO(Joel): open param — slot count & names are a design knob.
  EQUIP_SLOTS: ['weapon', 'armor', 'trinket', 'trinket2'],

  // ===== CATALOG =====
  // Item shape:
  //   id/name/icon/rarity/slot/price/desc — display + economy
  //   slot: 'weapon' | 'armor' | 'trinket' | 'artifact' (artifact = party-wide)
  //   classReq: null (any hero) or array of hero cls strings
  //   mods:  passive numeric modifiers (see key list above)
  //   flags: relic-style flags (freeMove, energyBonus)
  //   grantsCard: card def injected into the wearer's starting deck
  // The 8 pre-Phase-5 ids are kept verbatim so existing ownedGear saves stay valid.
  catalog: [

    // ------------------------------------------------------------ COMMON
    // Commons are deliberately at-or-below the StS basic rate (Strike = 6
    // dmg/energy, Defend = 5 block/energy — sts.md §1): temporary, burnable kit.
    {
      id: 'gear_iron_dagger', name: 'Iron Dagger', icon: '🗡️',
      rarity: 'common', slot: 'weapon', price: 30, classReq: null,
      desc: 'Attack cards deal +1 damage.',
      mods: { damageBonus: 1 }
    },
    {
      id: 'gear_oak_buckler', name: 'Oak Buckler', icon: '🛡️',
      rarity: 'common', slot: 'armor', price: 30, classReq: null,
      desc: 'Start each combat with 3 Block.',
      mods: { startBlock: 3 }
    },
    {
      id: 'gear_leather_jerkin', name: 'Leather Jerkin', icon: '🦺',
      rarity: 'common', slot: 'armor', price: 35, classReq: null,
      desc: '+4 max HP for the run.',
      mods: { maxHp: 4 }
    },
    {
      // D&D quarterstaff 1d6 (dnd-5e.md §2); card at the Strike rate (sts.md §1)
      id: 'gear_quarterstaff', name: 'Oaken Quarterstaff', icon: '🪄',
      rarity: 'common', slot: 'weapon', price: 25, classReq: null,
      desc: 'Adds "Staff Strike" to the wearer\'s deck (1 energy: deal 6).',
      grantsCard: {
        baseId: 'gearcard_gear_quarterstaff', name: 'Staff Strike',
        cost: 1, type: 'attack', target: 'enemy', prefPos: [1, 2, 3],
        desc: 'Deal 6 damage.', value: 6,
        effect: function(state, hero, target, card) {
          DS.Combat.dealDamage(target, card.value);
        }
      }
    },

    // ------------------------------------------------------------ UNCOMMON
    {
      id: 'gear_whetstone', name: 'Whetstone Charm', icon: '⚙️',
      rarity: 'uncommon', slot: 'trinket', price: 60, classReq: null,
      desc: 'Start each combat with 1 Strength.',
      mods: { strength: 1 }
    },
    {
      id: 'gear_shadow_cloak', name: 'Shadow Cloak', icon: '🧥',
      rarity: 'uncommon', slot: 'armor', price: 65,
      classReq: ['rogue', 'ranger'],
      desc: 'Adds "Ambush" to the wearer\'s deck (0 energy: deal 5).',
      grantsCard: {
        baseId: 'gearcard_gear_shadow_cloak', name: 'Ambush',
        cost: 0, type: 'attack', target: 'enemy', prefPos: [1, 2],
        desc: 'Deal 5 damage.', value: 5,
        effect: function(state, hero, target, card) {
          DS.Combat.dealDamage(target, card.value);
        }
      }
    },
    {
      id: 'gear_vigor_ring', name: 'Ring of Vigor', icon: '💍',
      rarity: 'uncommon', slot: 'trinket', price: 70, classReq: null,
      desc: '+6 max HP; heal 2 HP after each combat.',
      mods: { maxHp: 6, endCombatHeal: 2 }
    },
    {
      // SRD Cloak of Protection, uncommon (+1 AC/saves — dnd-5e.md §5)
      id: 'gear_cloak_protection', name: 'Cloak of Protection', icon: '🧣',
      rarity: 'uncommon', slot: 'armor', price: 60, classReq: null,
      desc: 'Start each combat with 2 Block; +3 max HP.',
      mods: { startBlock: 2, maxHp: 3 }
    },
    {
      // Cure Wounds 1d8 avg ~4.5 (dnd-5e.md §2) → 4 to all is above rate, priced for it
      id: 'gear_holy_symbol', name: 'Holy Symbol', icon: '✨',
      rarity: 'uncommon', slot: 'trinket', price: 65,
      classReq: ['cleric', 'paladin'],
      desc: 'Adds "Blessed Light" to the wearer\'s deck (1 energy: heal all allies 4).',
      grantsCard: {
        baseId: 'gearcard_gear_holy_symbol', name: 'Blessed Light',
        cost: 1, type: 'heal', target: 'all_allies', prefPos: [2, 3, 4],
        desc: 'Heal ALL allies 4 HP.', value: 4,
        effect: function(state, hero, target, card) {
          DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
            DS.Combat.healTarget(h, card.value);
          });
        }
      }
    },
    {
      // SRD Bag of Holding, uncommon (dnd-5e.md §5); effect = Torch relic parity
      id: 'gear_bag_holding', name: 'Bag of Holding', icon: '🎒',
      rarity: 'uncommon', slot: 'artifact', price: 70, classReq: null,
      desc: 'Party artifact: draw 1 extra card at the start of each combat.',
      mods: { firstTurnDraw: 1 }
    },

    // ------------------------------------------------------------ RARE (take-home)
    {
      id: 'gear_dragonscale', name: 'Dragonscale Plate', icon: '🐲',
      rarity: 'rare', slot: 'armor', price: 140, classReq: null,
      desc: 'Start each combat with 4 Block; +5 max HP. Survives the run.',
      mods: { startBlock: 4, maxHp: 5 }
    },
    {
      // Fireball flavor (dnd-5e.md §2c). 8-to-all at 2 energy beats Cleave
      // (6-to-all at 2) — rarity buys efficiency, like StS Bludgeon (sts.md §2a).
      id: 'gear_ember_staff', name: 'Staff of Embers', icon: '🔥',
      rarity: 'rare', slot: 'weapon', price: 140,
      classReq: ['wizard', 'necromancer'],
      desc: 'Adds "Ember Burst" to the wearer\'s deck (2 energy: deal 8 to ALL). Survives the run.',
      grantsCard: {
        baseId: 'gearcard_gear_ember_staff', name: 'Ember Burst',
        cost: 2, type: 'attack', target: 'all_enemies', prefPos: [3, 4],
        desc: 'Deal 8 damage to ALL enemies.', value: 8,
        effect: function(state, hero, target, card) {
          DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
            DS.Combat.dealDamage(e, card.value);
          });
        }
      }
    },
    {
      // SRD Amulet of Health, rare (dnd-5e.md §5)
      id: 'gear_amulet_health', name: 'Amulet of Health', icon: '📿',
      rarity: 'rare', slot: 'trinket', price: 150, classReq: null,
      desc: '+10 max HP for the run. Survives the run.',
      mods: { maxHp: 10 }
    },
    {
      // SRD Boots of Speed, rare (dnd-5e.md §5). NOTE: the engine's freeMove
      // flag is party-scoped (moveHeroAction has no per-hero flag check), so
      // one pair of boots frees the whole party's moves — worded accordingly.
      id: 'gear_boots_speed', name: 'Boots of Speed', icon: '👢',
      rarity: 'rare', slot: 'trinket', price: 130, classReq: null,
      desc: 'The party\'s move actions cost 0 energy. Survives the run.',
      flags: { freeMove: true }
    },
    {
      id: 'gear_war_banner', name: 'Battle Standard', icon: '🚩',
      rarity: 'rare', slot: 'artifact', price: 160, classReq: null,
      desc: 'Party artifact: ALL heroes start each combat with 1 Strength. Survives the run.',
      mods: { strength: 1 }
    },

    // ------------------------------------------------------------ LEGENDARY (take-home)
    // Priced at the StS rare-relic sticker (285-315g — sts.md §3): a multi-run
    // savings goal, the "go all-in" pole of the DESIGN.md tension.
    {
      // SRD Flame Tongue sword (+2d6 fire — dnd-5e.md §5). Card ≈ Heavy Blade
      // 14 dmg / 2 energy (sts.md §2a) + rarity premium.
      id: 'gear_flame_tongue', name: 'Flame Tongue', icon: '⚔️',
      rarity: 'legendary', slot: 'weapon', price: 280,
      classReq: ['fighter', 'barbarian', 'paladin'],
      desc: '+1 Strength each combat; adds "Flame Tongue" to the wearer\'s deck (2 energy: deal 16). Survives the run.',
      mods: { strength: 1 },
      grantsCard: {
        baseId: 'gearcard_gear_flame_tongue', name: 'Flame Tongue',
        cost: 2, type: 'attack', target: 'enemy', prefPos: [1, 2],
        desc: 'Deal 16 damage.', value: 16,
        effect: function(state, hero, target, card) {
          DS.Combat.dealDamage(target, card.value);
        }
      }
    },
    {
      // SRD Robe of the Archmagi, legendary (dnd-5e.md §5)
      id: 'gear_robe_archmagi', name: 'Robe of the Archmagi', icon: '🧙',
      rarity: 'legendary', slot: 'armor', price: 300,
      classReq: ['wizard', 'necromancer'],
      desc: 'Attack cards deal +2 damage; start each combat with 3 Block. Survives the run.',
      mods: { damageBonus: 2, startBlock: 3 }
    }
  ],

  // ===== LOOKUPS =====

  getById: function(gearId) {
    for (var i = 0; i < DS.Gear.catalog.length; i++) {
      if (DS.Gear.catalog[i].id === gearId) return DS.Gear.catalog[i];
    }
    return null;
  },

  isTakeHome: function(itemOrId) {
    var item = typeof itemOrId === 'string' ? DS.Gear.getById(itemOrId) : itemOrId;
    return !!item && DS.Gear.TAKE_HOME_RARITIES.indexOf(item.rarity) !== -1;
  },

  salvageValue: function(itemOrId) {
    var item = typeof itemOrId === 'string' ? DS.Gear.getById(itemOrId) : itemOrId;
    if (!item) return 0;
    return Math.floor(item.price * DS.Gear.SALVAGE_RATE);
  },

  // Can this hero class wear this item?
  classAllowed: function(item, cls) {
    if (!item || !item.classReq) return true;
    return item.classReq.indexOf(cls) !== -1;
  },

  _emptySlots: function() {
    return { weapon: null, armor: null, trinket: null, trinket2: null };
  },

  // Which hero slots can hold this item? (trinkets fit either trinket slot)
  slotsForItem: function(item) {
    if (!item || item.slot === 'artifact') return [];
    if (item.slot === 'trinket') return ['trinket', 'trinket2'];
    return [item.slot];
  },

  // Gear ids equipped on a hero-like object ({ gear: {slot: id} })
  _equippedIds: function(heroLike) {
    var ids = [];
    if (!heroLike || !heroLike.gear) return ids;
    DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
      if (heroLike.gear[slot]) ids.push(heroLike.gear[slot]);
    });
    return ids;
  },

  // ===== COMBAT HOOK API =====
  // hero = a RUN hero object (run.heroes[i]); tolerates missing .gear.

  getEquipped: function(hero) {
    return DS.Gear._equippedIds(hero).map(DS.Gear.getById).filter(function(x) { return !!x; });
  },

  // Sum a mod key over the hero's equipped items + the party's artifacts.
  getModifier: function(hero, key) {
    var total = 0;
    DS.Gear.getEquipped(hero).forEach(function(item) {
      if (item.mods && typeof item.mods[key] === 'number') total += item.mods[key];
    });
    total += DS.Gear.getPartyModifier(key);
    return total;
  },

  // Merged stat-mod object for a hero: { startBlock: 3, maxHp: 4, ... }.
  // (Distinct surface from granted cards/flags — stats only.)
  getStatMods: function(hero) {
    var merged = {};
    var addMods = function(item) {
      if (!item || !item.mods) return;
      for (var k in item.mods) {
        if (typeof item.mods[k] === 'number') merged[k] = (merged[k] || 0) + item.mods[k];
      }
    };
    DS.Gear.getEquipped(hero).forEach(addMods);
    var run = DS.State && DS.State.run;
    ((run && run.artifacts) || []).forEach(function(id) { addMods(DS.Gear.getById(id)); });
    return merged;
  },

  // Cards granted by a hero's equipped gear (deck-shaping surface).
  getGrantedCards: function(hero) {
    var cards = [];
    DS.Gear.getEquipped(hero).forEach(function(item) {
      if (item.grantsCard) cards.push(item.grantsCard);
    });
    return cards;
  },

  // Ability-style flags granted by a hero's equipped gear + party artifacts.
  getGrantedFlags: function(hero) {
    var merged = {};
    var addFlags = function(item) {
      if (!item || !item.flags) return;
      for (var k in item.flags) {
        if (item.flags[k]) merged[k] = item.flags[k];
      }
    };
    DS.Gear.getEquipped(hero).forEach(addFlags);
    var run = DS.State && DS.State.run;
    ((run && run.artifacts) || []).forEach(function(id) { addFlags(DS.Gear.getById(id)); });
    return merged;
  },

  // Sum a mod key over party artifacts only (party-scoped keys like firstTurnDraw).
  getPartyModifier: function(key) {
    var run = DS.State && DS.State.run;
    if (!run || !run.artifacts) return 0;
    var total = 0;
    run.artifacts.forEach(function(id) {
      var item = DS.Gear.getById(id);
      if (item && item.mods && typeof item.mods[key] === 'number') total += item.mods[key];
    });
    return total;
  },

  // Any equipped/artifact item carrying a truthy flag? (freeMove etc.)
  _anyFlag: function(flagName) {
    var run = DS.State && DS.State.run;
    if (!run) return false;
    var all = (run.artifacts || []).slice();
    (run.heroes || []).forEach(function(h) {
      all = all.concat(DS.Gear._equippedIds(h));
    });
    for (var i = 0; i < all.length; i++) {
      var item = DS.Gear.getById(all[i]);
      if (item && item.flags && item.flags[flagName]) return true;
    }
    return false;
  },

  _sumFlag: function(flagName) {
    var run = DS.State && DS.State.run;
    if (!run) return 0;
    var all = (run.artifacts || []).slice();
    (run.heroes || []).forEach(function(h) {
      all = all.concat(DS.Gear._equippedIds(h));
    });
    var total = 0;
    all.forEach(function(id) {
      var item = DS.Gear.getById(id);
      if (item && item.flags && typeof item.flags[flagName] === 'number') total += item.flags[flagName];
    });
    return total;
  },

  // ===== META-SIDE LOADOUT (town armory) =====

  // Where (if anywhere) is this gear id currently equipped on the roster?
  findRosterHolder: function(gearId) {
    var roster = (DS.Meta && DS.Meta.heroRoster) || [];
    for (var i = 0; i < roster.length; i++) {
      if (DS.Gear._equippedIds(roster[i]).indexOf(gearId) !== -1) return i;
    }
    return -1;
  },

  // Equip an OWNED item onto a roster hero (the saved loadout). Gear is the
  // transferable layer: if another hero holds the item, it is REASSIGNED
  // (free swap between characters outside combat). Enforces: ownership, slot
  // type, class restriction, a free slot, and the MAX_EQUIP_AT_START cap.
  equip: function(rosterIndex, gearId) {
    var entry = DS.Meta.heroRoster[rosterIndex];
    var item = DS.Gear.getById(gearId);
    if (!entry || !item) return { ok: false, reason: 'unknown' };
    if (!DS.Meta.ownsGear(gearId)) return { ok: false, reason: 'not_owned' };
    if (item.slot === 'artifact') return { ok: false, reason: 'artifact' };  // chosen at run start
    if (!DS.Gear.classAllowed(item, entry.heroClass)) return { ok: false, reason: 'class' };
    if (!entry.gear) entry.gear = DS.Gear._emptySlots();
    var candidates = DS.Gear.slotsForItem(item);
    var freeSlot = null;
    for (var s = 0; s < candidates.length; s++) {
      if (!entry.gear[candidates[s]]) { freeSlot = candidates[s]; break; }
    }
    if (!freeSlot) return { ok: false, reason: 'slot_full' };
    if (DS.Gear._equippedIds(entry).length >= DS.Gear.MAX_EQUIP_AT_START) {
      return { ok: false, reason: 'loadout_cap' };
    }
    // Free swap: pull the item off its current holder, if any
    var holder = DS.Gear.findRosterHolder(gearId);
    if (holder !== -1 && holder !== rosterIndex) DS.Gear.unequip(holder, gearId);
    if (holder === rosterIndex) return { ok: false, reason: 'already_equipped' };
    entry.gear[freeSlot] = gearId;
    DS.Meta.save();
    return { ok: true, reason: null };
  },

  unequip: function(rosterIndex, gearId) {
    var entry = DS.Meta.heroRoster[rosterIndex];
    if (!entry || !entry.gear) return false;
    var done = false;
    DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
      if (entry.gear[slot] === gearId) { entry.gear[slot] = null; done = true; }
    });
    if (done) DS.Meta.save();
    return done;
  },

  // Owned gear not equipped on any roster hero (the armory shelf).
  getOwnedUnequipped: function() {
    var owned = (DS.Meta && DS.Meta.ownedGear) || [];
    return owned.filter(function(id) {
      return DS.Gear.findRosterHolder(id) === -1;
    }).map(DS.Gear.getById).filter(function(x) { return !!x; });
  },

  // Owned artifacts (candidates for the run-start artifact picks).
  getOwnedArtifacts: function() {
    var owned = (DS.Meta && DS.Meta.ownedGear) || [];
    return owned.map(DS.Gear.getById).filter(function(item) {
      return !!item && item.slot === 'artifact';
    });
  },

  // Called by DS.Meta.killHero: dead heroes lose their equipped gear
  // (Phase 4 permadeath — DESIGN.md "their equipped gear is lost too").
  // Returns the list of lost gear ids.
  onHeroDeathMeta: function(rosterEntry) {
    var lost = DS.Gear._equippedIds(rosterEntry);
    lost.forEach(function(id) {
      var idx = DS.Meta.ownedGear.indexOf(id);
      if (idx !== -1) DS.Meta.ownedGear.splice(idx, 1);
    });
    if (rosterEntry) rosterEntry.gear = DS.Gear._emptySlots();
    return lost;
  },

  // Save backfill / migration: drop gear ids that no longer exist in the
  // catalog (mirrors the Phase-3 ownedGear backfill pattern in meta.js).
  migrateOwned: function() {
    if (!DS.Meta) return;
    DS.Meta.ownedGear = (DS.Meta.ownedGear || []).filter(function(id) {
      return !!DS.Gear.getById(id);
    });
    (DS.Meta.heroRoster || []).forEach(function(entry) {
      if (!entry.gear) { entry.gear = DS.Gear._emptySlots(); return; }
      DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
        if (entry.gear[slot] && !DS.Gear.getById(entry.gear[slot])) entry.gear[slot] = null;
      });
    });
  },

  // ===== RUN-SIDE LIFECYCLE =====

  // Stamp the saved loadout onto a fresh run. The loadout/party-select UI
  // calls this right after DS.State.newRun(party) + map generation.
  //   run           — DS.State.run
  //   rosterIndices — run hero i → DS.Meta.heroRoster index (same mapping the
  //                   summary screen uses); -1 / undefined = no roster entry
  //   artifactIds   — owned artifact ids chosen for this run (≤ MAX_PARTY_ARTIFACTS)
  applyLoadout: function(run, rosterIndices, artifactIds) {
    if (!run || run._loadoutApplied) return;
    run._loadoutApplied = true;
    var equipped = {};
    run.gearAcquired = [];
    run.artifacts = [];
    (artifactIds || []).forEach(function(id) {
      var item = DS.Gear.getById(id);
      if (!item || item.slot !== 'artifact') return;
      if (!DS.Meta.ownsGear(id)) return;
      if (run.artifacts.length >= DS.Gear.MAX_PARTY_ARTIFACTS) return;
      if (run.artifacts.indexOf(id) === -1) run.artifacts.push(id);
    });

    run.heroes.forEach(function(h, i) {
      var rosterIdx = (rosterIndices && rosterIndices[i] !== undefined) ? rosterIndices[i] : -1;
      var entry = rosterIdx !== -1 ? DS.Meta.heroRoster[rosterIdx] : null;
      h.gear = DS.Gear._emptySlots();
      if (entry && entry.gear) {
        DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
          var id = entry.gear[slot];
          var item = DS.Gear.getById(id);
          if (id && item && !equipped[id] && DS.Meta.ownsGear(id) && DS.Gear.classAllowed(item, h.cls) && DS.Gear.slotsForItem(item).indexOf(slot) !== -1 && DS.Gear._equippedIds(h).length < DS.Gear.MAX_EQUIP_AT_START) { h.gear[slot] = id; equipped[id] = true; }
        });
      }
      // Passive maxHp mods apply for the whole run
      var hpBonus = DS.Gear.getModifier(h, 'maxHp') - DS.Gear.getPartyModifier('maxHp');
      if (hpBonus > 0) { h.maxHp += hpBonus; h.hp += hpBonus; }
      // Deck-shaping: inject the wearer's gear cards into the starting deck
      DS.Gear.getEquipped(h).forEach(function(item) {
        if (item.grantsCard) run.deck.push(DS.Gear._makeGearCard(item, h, i));
      });
    });
  },

  // Build a deck-card instance from a gear item's grantsCard def.
  _makeGearCard: function(item, hero, heroRunIdx) {
    var def = item.grantsCard;
    return {
      id: def.baseId + '_' + heroRunIdx,
      baseId: def.baseId,
      name: def.name,
      cost: def.cost,
      type: def.type,
      target: def.target,
      prefPos: def.prefPos.slice(),
      desc: def.desc,
      value: def.value,
      effect: def.effect,
      heroIdx: heroRunIdx,
      heroCls: hero.cls,
      heroName: hero.name,
      upgraded: false,
      fromGear: item.id
    };
  },

  // Rebuild a serialized gear card (baseId 'gearcard_<gearId>') on run load.
  _rehydrateGearCard: function(saved) {
    if (!saved || !saved.baseId || saved.baseId.indexOf('gearcard_') !== 0) return null;
    var gearId = saved.baseId.substring('gearcard_'.length);
    var item = DS.Gear.getById(gearId);
    if (!item || !item.grantsCard) return null;
    var def = item.grantsCard;
    var heroDef = null;
    for (var h = 0; h < DS.Heroes.length; h++) {
      if (DS.Heroes[h].cls === saved.heroCls) { heroDef = DS.Heroes[h]; break; }
    }
    return {
      id: saved.id,
      baseId: def.baseId,
      name: def.name,
      cost: def.cost,
      type: def.type,
      target: def.target,
      prefPos: def.prefPos.slice(),
      desc: def.desc,
      value: def.value,
      effect: def.effect,
      heroIdx: saved.heroIdx,
      heroCls: saved.heroCls,
      heroName: heroDef ? heroDef.name : saved.heroCls,
      upgraded: false,
      fromGear: item.id
    };
  },

  // ===== MERCHANT =====

  // Weighted random stock draw from the catalog. A rarity with weight 0 is
  // LOCKED OUT of the roll (that's how low merchant levels cap quality).
  // Excludes owned gear, gear already acquired this run, and excludeIds.
  rollMerchantStock: function(count, weights, excludeIds) {
    weights = weights || DS.Gear.RUN_RARITY_WEIGHTS;
    var exclude = {};
    (excludeIds || []).forEach(function(id) { exclude[id] = true; });
    ((DS.Meta && DS.Meta.ownedGear) || []).forEach(function(id) { exclude[id] = true; });
    var run = DS.State && DS.State.run;
    if (run && run.gearAcquired) {
      run.gearAcquired.forEach(function(id) { exclude[id] = true; });
    }

    var pool = DS.Gear.catalog.filter(function(item) {
      return !exclude[item.id] && (weights[item.rarity] || 0) > 0;
    });
    var stock = [];
    while (stock.length < count && pool.length > 0) {
      var totalWeight = 0;
      pool.forEach(function(item) {
        totalWeight += weights[item.rarity] || 0;
      });
      var roll = Math.random() * totalWeight;
      var picked = pool[pool.length - 1];
      for (var i = 0; i < pool.length; i++) {
        roll -= weights[pool[i].rarity] || 0;
        if (roll <= 0) { picked = pool[i]; break; }
      }
      stock.push(picked);
      pool = pool.filter(function(item) { return item.id !== picked.id; });
    }
    return stock;
  },

  // ---- Merchant upgrade track (DD-hamlet-style) ----

  getMerchantLevel: function() {
    return (DS.Meta && typeof DS.Meta.merchantLevel === 'number') ? DS.Meta.merchantLevel : 0;
  },

  // Gold cost of the NEXT merchant upgrade, or null at max level.
  getMerchantUpgradeCost: function() {
    var lvl = DS.Gear.getMerchantLevel();
    if (lvl >= DS.Gear.MERCHANT_MAX_LEVEL) return null;
    return DS.Gear.MERCHANT_UPGRADE_COSTS[lvl];
  },

  // Spend banked gold to level the town merchant (better stock, more of it).
  upgradeMerchant: function() {
    var cost = DS.Gear.getMerchantUpgradeCost();
    if (cost === null) return { ok: false, reason: 'max_level' };
    if (!DS.Meta.spendGold(cost)) return { ok: false, reason: 'gold' };
    DS.Meta.merchantLevel = DS.Gear.getMerchantLevel() + 1;
    DS.Meta.save();
    DS.Gear._townStockCache = null;   // fresh, better stock immediately
    return { ok: true, reason: null };
  },

  // Town merchant stock — same merchant as on runs; the town stall is the
  // SAFE face: quality gated by merchant level, below the in-run ceiling
  // until L3. Cached per (runCount, merchantLevel) so browsing is stable
  // between visits within a session.
  _townStockCache: null,
  getTownStock: function() {
    var runCount = (DS.Meta && DS.Meta.runCount) || 0;
    var lvl = DS.Gear.getMerchantLevel();
    var cache = DS.Gear._townStockCache;
    if (cache && cache.runCount === runCount && cache.level === lvl) {
      return cache.ids.map(DS.Gear.getById).filter(function(x) { return !!x; });
    }
    var weights = DS.Gear.TOWN_RARITY_WEIGHTS[Math.min(lvl, DS.Gear.TOWN_RARITY_WEIGHTS.length - 1)];
    var size = DS.Gear.TOWN_STOCK_SIZE_BY_LEVEL[Math.min(lvl, DS.Gear.TOWN_STOCK_SIZE_BY_LEVEL.length - 1)];
    var stock = DS.Gear.rollMerchantStock(size, weights);
    DS.Gear._townStockCache = {
      runCount: runCount,
      level: lvl,
      ids: stock.map(function(item) { return item.id; })
    };
    return stock;
  },

  // In-run merchant stock — the VOLATILE face: fresh gamble-y roll per shop
  // visit, rarity ceiling above the town's current tier. The run-shop UI
  // should roll this once per shop node and offer alongside cards/removal.
  getRunStock: function(count) {
    return DS.Gear.rollMerchantStock(count || DS.Gear.RUN_STOCK_SIZE, DS.Gear.RUN_RARITY_WEIGHTS);
  },

  // Town purchase: banked gold → armory. (Equipping is a separate step.)
  buyInTown: function(gearId) {
    var item = DS.Gear.getById(gearId);
    if (!item) return false;
    return DS.Meta.buyGear(gearId, item.price);   // deducts banked gold, records ownership
  },

  // Mid-run purchase: run gold → equipped immediately (DESIGN.md: "you finish
  // equipping mid-run, at the shop"). Artifacts go to the party pool instead.
  // heroRunIdx is ignored for artifacts.
  buyOnRun: function(gearId, heroRunIdx) {
    var run = DS.State && DS.State.run;
    var item = DS.Gear.getById(gearId);
    if (!run || !item) return { ok: false, reason: 'unknown' };
    if (DS.State.screen === 'combat') return { ok: false, reason: 'combat' };
    if (run.gold < item.price) return { ok: false, reason: 'gold' };
    run.gearAcquired = run.gearAcquired || [];
    run.artifacts = run.artifacts || [];
    if (DS.Meta.ownsGear(gearId) || run.gearAcquired.indexOf(gearId) !== -1) return { ok: false, reason: 'duplicate' };

    if (item.slot === 'artifact') {
      if (run.artifacts.length >= DS.Gear.MAX_PARTY_ARTIFACTS) return { ok: false, reason: 'artifact_cap' };
      run.gold -= item.price;
      run.artifacts.push(gearId);
      run.gearAcquired.push(gearId);
      return { ok: true, reason: null };
    }

    var hero = run.heroes[heroRunIdx];
    if (!hero || hero.hp <= 0) return { ok: false, reason: 'no_hero' };
    if (!DS.Gear.classAllowed(item, hero.cls)) return { ok: false, reason: 'class' };
    hero.gear = hero.gear || DS.Gear._emptySlots();
    var candidates = DS.Gear.slotsForItem(item);
    var freeSlot = null;
    for (var s = 0; s < candidates.length; s++) {
      if (!hero.gear[candidates[s]]) { freeSlot = candidates[s]; break; }
    }
    if (!freeSlot) return { ok: false, reason: 'slot_full' };

    run.gold -= item.price;
    hero.gear[freeSlot] = gearId;
    run.gearAcquired.push(gearId);
    if (item.mods && item.mods.maxHp) {
      hero.maxHp += item.mods.maxHp;
      hero.hp += item.mods.maxHp;
    }
    if (item.grantsCard) {
      run.deck.push(DS.Gear._makeGearCard(item, hero, heroRunIdx));
    }
    return { ok: true, reason: null };
  },

  // Mid-run gear swap (outside combat): move an equipped item to another
  // living hero. Gear is the transferable layer — cards/levels stay bound.
  // The UI must only offer this between fights.
  reassignOnRun: function(gearId, toHeroIdx) {
    var run = DS.State && DS.State.run;
    var item = DS.Gear.getById(gearId);
    if (DS.State.screen === 'combat') return { ok: false, reason: 'combat' };
    if (!run || !item || item.slot === 'artifact') return { ok: false, reason: 'unknown' };
    var to = run.heroes[toHeroIdx];
    if (!to || to.hp <= 0) return { ok: false, reason: 'no_hero' };
    if (!DS.Gear.classAllowed(item, to.cls)) return { ok: false, reason: 'class' };
    to.gear = to.gear || DS.Gear._emptySlots();
    var candidates = DS.Gear.slotsForItem(item);
    var freeSlot = null;
    for (var s = 0; s < candidates.length; s++) {
      if (!to.gear[candidates[s]]) { freeSlot = candidates[s]; break; }
    }
    if (!freeSlot) return { ok: false, reason: 'slot_full' };

    // Find and strip the current wearer
    var from = null;
    var fromIdx = -1;
    run.heroes.forEach(function(h, i) {
      if (h.gear && DS.Gear._equippedIds(h).indexOf(gearId) !== -1) { from = h; fromIdx = i; }
    });
    if (!from) return { ok: false, reason: 'not_equipped' };
    if (from.hp <= 0) return { ok: false, reason: 'dead_wearer' };
    if (fromIdx === toHeroIdx) return { ok: false, reason: 'same_hero' };
    DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
      if (from.gear[slot] === gearId) from.gear[slot] = null;
    });
    // Move passive maxHp with the item
    if (item.mods && item.mods.maxHp) {
      from.maxHp = Math.max(1, from.maxHp - item.mods.maxHp);
      from.hp = Math.max(1, Math.min(from.hp, from.maxHp));
      to.maxHp += item.mods.maxHp;
      // Transfer changes capacity, never heals: repeated swaps cannot manufacture HP.
    }
    to.gear[freeSlot] = gearId;
    // Injected cards follow the new wearer
    if (item.grantsCard) {
      run.deck = run.deck.filter(function(c) { return c.baseId !== item.grantsCard.baseId; });
      run.deck.push(DS.Gear._makeGearCard(item, to, toHeroIdx));
    }
    return { ok: true, reason: null };
  },

  // ===== SALVAGE =====
  // Sell gear back for SALVAGE_RATE of its price. Works both mid-run (credits
  // run gold, strips it from whoever wears it + removes injected cards) and in
  // town (credits banked gold). Returns gold credited, or -1 on failure.
  salvage: function(gearId) {
    var item = DS.Gear.getById(gearId);
    if (!item || DS.State.screen === 'combat') return -1;
    var value = DS.Gear.salvageValue(item);
    var run = DS.State && DS.State.run;

    if (run) {
      if (run.heroes.some(function(h) { return h.hp <= 0 && DS.Gear._equippedIds(h).indexOf(gearId) !== -1; })) return -1;
      var found = false;
      // Strip from any run hero's slots (reverse maxHp mods)
      run.heroes.forEach(function(h) {
        if (!h.gear) return;
        DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
          if (h.gear[slot] === gearId) {
            h.gear[slot] = null;
            found = true;
            if (item.mods && item.mods.maxHp) {
              h.maxHp = Math.max(1, h.maxHp - item.mods.maxHp);
              h.hp = Math.max(1, Math.min(h.hp, h.maxHp));
            }
          }
        });
      });
      // Strip from party artifacts
      if (run.artifacts) {
        var ai = run.artifacts.indexOf(gearId);
        if (ai !== -1) { run.artifacts.splice(ai, 1); found = true; }
      }
      if (!found) return -1;
      // Remove injected cards
      if (item.grantsCard) {
        run.deck = run.deck.filter(function(c) {
          return c.baseId !== item.grantsCard.baseId;
        });
      }
      if (run.gearAcquired) {
        var gi = run.gearAcquired.indexOf(gearId);
        if (gi !== -1) run.gearAcquired.splice(gi, 1);
      }
      // A town-owned item salvaged mid-run is sold for good
      var oi = DS.Meta.ownedGear.indexOf(gearId);
      if (oi !== -1) {
        DS.Meta.ownedGear.splice(oi, 1);
        var holder = DS.Gear.findRosterHolder(gearId);
        if (holder !== -1) DS.Gear.unequip(holder, gearId);
        DS.Meta.save();
      }
      run.gold += value;
      return value;
    }

    // Town salvage: must be owned
    if (!DS.Meta.ownsGear(gearId)) return -1;
    var idx = DS.Meta.ownedGear.indexOf(gearId);
    DS.Meta.ownedGear.splice(idx, 1);
    var rosterHolder = DS.Gear.findRosterHolder(gearId);
    if (rosterHolder !== -1) DS.Gear.unequip(rosterHolder, gearId);
    DS.Meta.addGold(value);   // persists the save
    return value;
  },

  // ===== RUN-END RESOLUTION (take-home / consumption) =====
  // Called by summary.js BEFORE Meta.apply* (so roster entries still exist;
  // killHero afterwards strips dead heroes' equipped gear).
  //   outcome: 'victory' | 'retreat' | 'autoRetreat' | 'defeat'
  // Rules (DESIGN.md, Loadout & Equipment Economy):
  //   - autoRetreat (first-run tutorial): keep ALL gains — everything persists.
  //   - defeat: run-acquired gear + carried artifacts are lost with the party.
  //   - victory/retreat: take-home (rare/legendary) gear on SURVIVORS persists
  //     (run-acquired take-home joins ownedGear + pre-equips the roster slot);
  //     non-take-home gear that was used this run is CONSUMED — auto-salvaged
  //     into banked gold at RUN_END_SALVAGE_RATE (the burn cost is the spread
  //     between purchase price and the scrap return).
  // Returns { kept: [ids], consumed: [ids], lost: [ids], goldFromScrap: N }
  // and stores it on DS.State._gearRunReport for the summary/loadout UI.
  resolveRunEnd: function(run, outcome, rosterIndices) {
    var report = { kept: [], consumed: [], lost: [], goldFromScrap: 0 };
    if (!run) return report;
    if (run.gearSettlement) return run.gearSettlement;
    run.gearSettlement = report;
    run.gearAcquired = run.gearAcquired || [];
    run.artifacts = run.artifacts || [];

    var isAcquired = {};
    run.gearAcquired.forEach(function(id) { isAcquired[id] = true; });

    // Sync roster gear slots to RUN truth first: gear may have been bought,
    // salvaged, or reassigned between heroes mid-run, and Meta.killHero
    // (called after us) strips a dead hero's gear FROM THE ROSTER ENTRY.
    // Without this sync, an item moved off a now-dead hero would be wrongly
    // destroyed (or a dead hero's new pickup wrongly spared).
    run.heroes.forEach(function(h, i) {
      var rosterIdx = (rosterIndices && rosterIndices[i] !== undefined) ? rosterIndices[i] : -1;
      if (rosterIdx === -1 || !h.gear) return;
      var entry = DS.Meta.heroRoster[rosterIdx];
      if (!entry) return;
      entry.gear = DS.Gear._emptySlots();
      DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
        entry.gear[slot] = h.gear[slot] || null;
      });
    });

    var persistItem = function(id, rosterIdx) {
      // Take-home: ensure ownership; pre-equip the survivor's roster slot if free
      if (isAcquired[id] && DS.Meta.ownedGear.indexOf(id) === -1) {
        DS.Meta.ownedGear.push(id);
      }
      var item = DS.Gear.getById(id);
      if (item && item.slot !== 'artifact' && rosterIdx !== -1 && rosterIdx !== undefined) {
        var entry = DS.Meta.heroRoster[rosterIdx];
        if (entry && DS.Gear._equippedIds(entry).indexOf(id) === -1) {
          if (!entry.gear) entry.gear = DS.Gear._emptySlots();
          var candidates = DS.Gear.slotsForItem(item);
          for (var s = 0; s < candidates.length; s++) {
            if (!entry.gear[candidates[s]]) { entry.gear[candidates[s]] = id; break; }
          }
        }
      }
      report.kept.push(id);
    };

    // Consumed gear AUTO-SALVAGES into banked gold at the reduced run-end
    // rate (gold-permanence doctrine: spent gold always converts back to
    // permanent value; manual salvage before run end pays better).
    var consumeItem = function(id, rosterIdx) {
      var oi = DS.Meta.ownedGear.indexOf(id);
      if (oi !== -1) DS.Meta.ownedGear.splice(oi, 1);
      if (rosterIdx !== -1 && rosterIdx !== undefined) {
        var entry = DS.Meta.heroRoster[rosterIdx];
        if (entry && entry.gear) {
          DS.Gear.EQUIP_SLOTS.forEach(function(slot) {
            if (entry.gear[slot] === id) entry.gear[slot] = null;
          });
        }
      }
      var item = DS.Gear.getById(id);
      var scrap = item ? Math.floor(item.price * DS.Gear.RUN_END_SALVAGE_RATE) : 0;
      if (scrap > 0) {
        DS.Meta.gold += scrap;
        report.goldFromScrap += scrap;
      }
      report.consumed.push(id);
    };

    if (outcome === 'defeat') {
      // Party wipe: equipped gear of the dead is stripped (and ledgered) by
      // killHero; here we make sure run-acquired gear and carried artifacts
      // die with the run — recorded in the lost-gear ledger too.
      run.artifacts.forEach(function(id) {
        if (!isAcquired[id]) {
          var oi = DS.Meta.ownedGear.indexOf(id);
          if (oi !== -1) DS.Meta.ownedGear.splice(oi, 1);
        }
        if (DS.Meta.recordLostGear) DS.Meta.recordLostGear(id, null, 'defeat');
        report.lost.push(id);
      });
      run.heroes.forEach(function(h) { DS.Gear._equippedIds(h).forEach(function(id) { if (report.lost.indexOf(id) === -1) report.lost.push(id); }); });
      run.gearAcquired.forEach(function(id) {
        if (report.lost.indexOf(id) === -1) report.lost.push(id);
      });
      DS.Meta.save();
      DS.State._gearRunReport = report;
      return report;
    }

    // Per-hero equipped gear
    run.heroes.forEach(function(h, i) {
      var rosterIdx = (rosterIndices && rosterIndices[i] !== undefined) ? rosterIndices[i] : -1;
      var alive = outcome === 'autoRetreat' ? true : h.hp > 0;
      DS.Gear._equippedIds(h).forEach(function(id) {
        if (!alive) {
          // Dead heroes lose their gear — Meta.killHero strips ownership;
          // run-acquired gear on the dead simply never persists.
          report.lost.push(id);
          return;
        }
        if (outcome === 'autoRetreat' || DS.Gear.isTakeHome(id) || !DS.Gear.CONSUME_ON_RUN_END) {
          persistItem(id, rosterIdx);
        } else {
          consumeItem(id, rosterIdx);
        }
      });
    });

    // Party artifacts (survive as long as the party wasn't wiped)
    run.artifacts.forEach(function(id) {
      if (outcome === 'autoRetreat' || DS.Gear.isTakeHome(id) || !DS.Gear.CONSUME_ON_RUN_END) {
        persistItem(id, -1);
      } else {
        consumeItem(id, -1);
      }
    });

    DS.Meta.save();
    DS.State._gearRunReport = report;
    return report;
  }
};

// ============================================================================
// ENGINE GLUE — non-invasive wrappers (same pattern summary.js uses for
// DS.UI.render). Keeps combat.js / state.js untouched while making passive
// gear effects live through the existing relic-hook pipeline.
// ============================================================================
(function() {

  // --- Gear behaves as an invisible "relic" through the hook pipeline ---
  var gearHooks = {
    onCombatStart: function(state) {
      if (!state || !state.run || !state.run.heroes) return;
      state.run.heroes.forEach(function(h) {
        if (!h || h.hp <= 0) return;
        var sb = DS.Gear.getModifier(h, 'startBlock');
        if (sb > 0) h.block = (h.block || 0) + sb;
        var st = DS.Gear.getModifier(h, 'strength');
        if (st > 0) h.strength = (h.strength || 0) + st;
      });
      // Party artifacts: extra opening draw (Bag of Holding)
      var extraDraw = DS.Gear.getPartyModifier('firstTurnDraw');
      for (var d = 0; d < extraDraw; d++) {
        if (DS.Combat && DS.Combat.drawCard) DS.Combat.drawCard();
      }
    },
    onCardPlayed: function(state, card) {
      if (!state || !state.run || !card || card.type !== 'attack') return;
      var hero = state.run.heroes[card.heroIdx];
      if (!hero) return;
      var bonus = DS.Gear.getModifier(hero, 'damageBonus');
      if (bonus > 0) return { bonusDamage: bonus };
    },
    onCombatEnd: function(state) {
      if (!state || !state.run || !state.run.heroes) return;
      state.run.heroes.forEach(function(h) {
        if (!h || h.hp <= 0) return;
        var heal = DS.Gear.getModifier(h, 'endCombatHeal');
        if (heal > 0 && h.maxHp) h.hp = Math.min(h.hp + heal, h.maxHp);
      });
    }
  };

  if (DS.Combat) {
    var origFireHook = DS.Combat.fireRelicHook;
    DS.Combat.fireRelicHook = function(hookName) {
      var results = origFireHook.apply(DS.Combat, arguments) || [];
      if (typeof gearHooks[hookName] === 'function') {
        var args = Array.prototype.slice.call(arguments, 1);
        var r = gearHooks[hookName].apply(null, [DS.State].concat(args));
        if (r) results.push(r);
      }
      return results;
    };

    // Gear flags ride the relic-flag checks (freeMove → free move actions)
    var origHasFlag = DS.Combat.hasRelicFlag;
    DS.Combat.hasRelicFlag = function(flagName) {
      if (origHasFlag.call(DS.Combat, flagName)) return true;
      return DS.Gear._anyFlag(flagName);
    };
    var origSumFlag = DS.Combat.sumRelicFlag;
    DS.Combat.sumRelicFlag = function(flagName) {
      return origSumFlag.call(DS.Combat, flagName) + DS.Gear._sumFlag(flagName);
    };
  }

  if (DS.State) {
    // --- Persist run-side gear state (hero.gear rides inside run.heroes) ---
    var origSave = DS.State.save;
    DS.State.save = function() {
      origSave.call(DS.State);
      try {
        if (!DS.State.run) return;
        var raw = localStorage.getItem('darkspire_save');
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data.run) return;
        data.run.gearAcquired = DS.State.run.gearAcquired || [];
        data.run.artifacts = DS.State.run.artifacts || [];
        data.run.gearShops = DS.State.run.gearShops || {};
        data.run.gearSettlement = DS.State.run.gearSettlement || null;
        localStorage.setItem('darkspire_save', JSON.stringify(data));
      } catch (e) { /* non-fatal */ }
    };

    var origLoad = DS.State.load;
    DS.State.load = function() {
      var raw = null;
      try { raw = localStorage.getItem('darkspire_save'); } catch (e) {}
      var ok = origLoad.call(DS.State);
      if (ok && raw && DS.State.run) {
        try {
          var data = JSON.parse(raw);
          DS.State.run.gearAcquired = (data.run && data.run.gearAcquired) || [];
          DS.State.run.artifacts = (data.run && data.run.artifacts) || [];
          DS.State.run.gearShops = data.run.gearShops || {};
          DS.State.run.gearSettlement = data.run.gearSettlement || null;
        } catch (e) {
          DS.State.run.gearAcquired = [];
          DS.State.run.artifacts = [];
        }
      }
      return ok;
    };

    // --- Rehydrate gear-injected deck cards (baseId 'gearcard_<gearId>') ---
    var origRehydrate = DS.State._rehydrateCard;
    DS.State._rehydrateCard = function(saved) {
      if (saved && saved.baseId && saved.baseId.indexOf('gearcard_') === 0) {
        return DS.Gear._rehydrateGearCard(saved);
      }
      return origRehydrate.call(DS.State, saved);
    };
  }
})();
