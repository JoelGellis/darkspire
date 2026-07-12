window.DS = window.DS || {};

DS.Meta = {
  // Current state (populated by load or newGame)
  gold: 60,
  runCount: 0,
  victories: 0,
  heroRoster: [],
  buildings: {},
  graveyard: [],
  unlocks: [],
  ownedGear: [],   // gear/artifacts bought from the merchant; equipping is Phase 5 (loadout)

  // Building config (not persisted — reference only)
  _buildingConfig: {
    chapel: { maxLevel: 3, costs: [50, 100, 150] },
    tavern: { maxLevel: 2, costs: [60, 120] },
    graveyard: { maxLevel: 3, costs: [40, 80, 120] }
  },

  // ===== SAVE / LOAD =====

  newGame: function() {
    DS.Meta.gold = 60;
    DS.Meta.runCount = 0;
    DS.Meta.heroRoster = [
      { heroClass: 'fighter', alive: true, runsSurvived: 0, upgradedCards: [] },
      { heroClass: 'cleric', alive: true, runsSurvived: 0, upgradedCards: [] }
    ];
    DS.Meta.victories = 0;
    DS.Meta.buildings = {
      chapel: { level: 0 },
      tavern: { level: 0 },
      graveyard: { level: 0 }
    };
    DS.Meta.graveyard = [];
    DS.Meta.unlocks = [];
    DS.Meta.ownedGear = [];
    DS.Meta.save();
  },

  save: function() {
    try {
      var data = {
        gold: DS.Meta.gold,
        runCount: DS.Meta.runCount,
        victories: DS.Meta.victories,
        heroRoster: DS.Meta.heroRoster,
        buildings: DS.Meta.buildings,
        graveyard: DS.Meta.graveyard,
        unlocks: DS.Meta.unlocks,
        ownedGear: DS.Meta.ownedGear
      };
      localStorage.setItem('darkspire_meta', JSON.stringify(data));
    } catch (e) {
      console.warn('Meta save failed:', e);
    }
  },

  load: function() {
    try {
      var raw = localStorage.getItem('darkspire_meta');
      if (!raw) return false;
      var data = JSON.parse(raw);

      // Validate shape — reject if critical fields missing
      if (typeof data.gold !== 'number' || !Array.isArray(data.heroRoster)) return false;

      DS.Meta.gold = data.gold;
      DS.Meta.runCount = data.runCount || 0;
      DS.Meta.victories = data.victories || 0;
      DS.Meta.heroRoster = data.heroRoster;
      DS.Meta.buildings = data.buildings || { chapel: { level: 0 }, tavern: { level: 0 }, graveyard: { level: 0 } };
      DS.Meta.graveyard = data.graveyard || [];
      DS.Meta.unlocks = data.unlocks || [];
      DS.Meta.ownedGear = data.ownedGear || [];   // backfills old saves with no gear

      // Ensure building shape
      if (!DS.Meta.buildings.chapel) DS.Meta.buildings.chapel = { level: 0 };
      if (!DS.Meta.buildings.tavern) DS.Meta.buildings.tavern = { level: 0 };
      if (!DS.Meta.buildings.graveyard) DS.Meta.buildings.graveyard = { level: 0 };

      return true;
    } catch (e) {
      console.warn('Meta load failed:', e);
      return false;
    }
  },

  hasSave: function() {
    return localStorage.getItem('darkspire_meta') !== null;
  },

  deleteSave: function() {
    localStorage.removeItem('darkspire_meta');
  },

  // ===== HERO ROSTER =====

  addHeroToRoster: function(heroClass) {
    var entry = { heroClass: heroClass, alive: true, runsSurvived: 0, upgradedCards: [] };
    DS.Meta.heroRoster.push(entry);
    DS.Meta.save();
    return DS.Meta.heroRoster.length - 1;
  },

  killHero: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero) return;
    DS.Meta.graveyard.push({
      heroClass: hero.heroClass,
      runsSurvived: hero.runsSurvived,
      runNumber: DS.Meta.runCount
    });
    DS.Meta.heroRoster.splice(rosterIndex, 1);
    DS.Meta.save();
  },

  heroSurvivedRun: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero) return;
    hero.runsSurvived++;
    DS.Meta.save();
  },

  upgradeHeroCard: function(rosterIndex, cardBaseId) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero) return;
    if (hero.upgradedCards.indexOf(cardBaseId) === -1) {
      hero.upgradedCards.push(cardBaseId);
    }
    DS.Meta.save();
  },

  getAliveRoster: function() {
    return DS.Meta.heroRoster.filter(function(h) { return h.alive; });
  },

  // ===== GOLD =====

  addGold: function(amount) {
    DS.Meta.gold += amount;
    DS.Meta.save();
  },

  spendGold: function(amount) {
    if (DS.Meta.gold < amount) return false;
    DS.Meta.gold -= amount;
    DS.Meta.save();
    return true;
  },

  getGold: function() {
    return DS.Meta.gold;
  },

  // ===== GEAR (merchant purchases) =====
  // Gear is bought in town with banked gold and stored on the meta save.
  // Equipping/loadout selection is Phase 5 — for now ownership just persists.

  ownsGear: function(gearId) {
    return DS.Meta.ownedGear.indexOf(gearId) !== -1;
  },

  // Buy a gear item: deduct banked gold, record ownership. Returns true on success.
  buyGear: function(gearId, price) {
    if (DS.Meta.ownsGear(gearId)) return false;
    if (!DS.Meta.spendGold(price)) return false;   // spendGold persists the save
    DS.Meta.ownedGear.push(gearId);
    DS.Meta.save();
    return true;
  },

  // ===== BUILDINGS =====

  getChapelBonus: function() {
    return DS.Meta.buildings.chapel.level * 3;
  },

  getCaravanSlots: function() {
    return 4 + DS.Meta.buildings.tavern.level;
  },

  getGraveyardBonus: function() {
    var level = DS.Meta.buildings.graveyard ? DS.Meta.buildings.graveyard.level : 0;
    return level * DS.Meta.graveyard.length;
  },

  getBuildingLevel: function(name) {
    var building = DS.Meta.buildings[name];
    return building ? building.level : 0;
  },

  canUpgradeBuilding: function(name) {
    var config = DS.Meta._buildingConfig[name];
    if (!config) return false;
    var building = DS.Meta.buildings[name];
    if (!building || building.level >= config.maxLevel) return false;
    var cost = config.costs[building.level];
    return DS.Meta.gold >= cost;
  },

  upgradeBuilding: function(name) {
    var config = DS.Meta._buildingConfig[name];
    if (!config) return false;
    var building = DS.Meta.buildings[name];
    if (!building || building.level >= config.maxLevel) return false;

    var cost = config.costs[building.level];
    if (DS.Meta.gold < cost) return false;

    DS.Meta.gold -= cost;
    building.level++;
    DS.Meta.save();
    return true;
  },

  // ===== RUN TRANSITIONS =====

  // Fraction of run GAINS (gold above starting gold) banked on a manual retreat.
  // TODO(Joel): open balance param — DESIGN.md says "a percentage", ~50% is the default guess.
  RETREAT_BANK_RATE: 0.5,

  // Manual retreat (or first-run auto-retreat): bank goldBanked, survivors come
  // home (+1 runsSurvived), dead heroes go to the graveyard. No victory credit.
  applyRetreatOutcome: function(goldBanked, runHeroRosterIndices, aliveFlags) {
    DS.Meta.addGold(goldBanked);

    var kills = [];
    for (var i = 0; i < runHeroRosterIndices.length; i++) {
      var idx = runHeroRosterIndices[i];
      if (idx === -1) continue;
      if (aliveFlags[i]) {
        DS.Meta.heroSurvivedRun(idx);
      } else {
        kills.push(idx);
      }
    }
    kills.sort(function(a, b) { return b - a; });
    kills.forEach(function(idx) {
      DS.Meta.killHero(idx);
    });

    DS.Meta.runCount++;
    DS.Meta.welfareCheck();
    DS.Meta.save();
  },

  applyDefeatPenalty: function(runHeroRosterIndices) {
    // Kill all heroes that were in the run (defeat = total party kill)
    // Sort descending so splice doesn't shift indices
    var sorted = runHeroRosterIndices.slice().sort(function(a, b) { return b - a; });
    sorted.forEach(function(idx) {
      DS.Meta.killHero(idx);
    });

    // Halve gold
    DS.Meta.gold = Math.floor(DS.Meta.gold / 2);

    DS.Meta.welfareCheck();
    DS.Meta.save();
  },

  applyVictoryRewards: function(goldEarned, runHeroRosterIndices, aliveFlags) {
    DS.Meta.addGold(goldEarned);

    // Process heroes from the run — sort descending for safe splicing of dead
    var kills = [];
    for (var i = 0; i < runHeroRosterIndices.length; i++) {
      var idx = runHeroRosterIndices[i];
      if (aliveFlags[i]) {
        DS.Meta.heroSurvivedRun(idx);
      } else {
        kills.push(idx);
      }
    }

    // Kill dead heroes (descending order for safe splice)
    kills.sort(function(a, b) { return b - a; });
    kills.forEach(function(idx) {
      DS.Meta.killHero(idx);
    });

    DS.Meta.runCount++;
    DS.Meta.victories++;
    DS.Meta.save();
  },

  welfareCheck: function() {
    if (DS.Meta.gold < 30 && DS.Meta.heroRoster.length < 4) {
      DS.Meta.gold = 30;
    }
  },

  // ===== UNLOCKS =====

  // Unlock definitions — milestones and what they grant
  _unlockDefs: [
    { id: 'veteran',    name: 'Veteran',        desc: 'Unlocked Barbarian & Ranger hero classes.', victories: 1, classes: ['barbarian', 'ranger'] },
    { id: 'darkarts',   name: 'Dark Arts',       desc: 'Unlocked Necromancer & Paladin hero classes.', victories: 2, classes: ['necromancer', 'paladin'] },
    { id: 'rarerelics', name: 'Rare Artifacts',  desc: 'Rare relics now appear in shops and rewards.', victories: 3 },
    { id: 'champion',   name: 'Champion',        desc: 'Start each run with +10 gold bonus.', victories: 5 }
  ],

  hasUnlock: function(unlockId) {
    return DS.Meta.unlocks.indexOf(unlockId) !== -1;
  },

  // Check and award any newly earned unlocks after a victory
  checkUnlocks: function() {
    var newUnlocks = [];
    DS.Meta._unlockDefs.forEach(function(def) {
      if (DS.Meta.victories >= def.victories && DS.Meta.unlocks.indexOf(def.id) === -1) {
        DS.Meta.unlocks.push(def.id);
        newUnlocks.push(def);
      }
    });
    if (newUnlocks.length > 0) DS.Meta.save();
    return newUnlocks;
  },

  // Get hero classes that are unlocked (always includes base 4)
  getUnlockedClasses: function() {
    var base = ['fighter', 'rogue', 'cleric', 'wizard'];
    DS.Meta._unlockDefs.forEach(function(def) {
      if (def.classes && DS.Meta.hasUnlock(def.id)) {
        def.classes.forEach(function(cls) {
          if (base.indexOf(cls) === -1) base.push(cls);
        });
      }
    });
    return base;
  },

  // Bonus starting gold from champion unlock
  getUnlockGoldBonus: function() {
    return DS.Meta.hasUnlock('champion') ? 10 : 0;
  }
};

// ===== GEAR CATALOGUE (PLACEHOLDER) =====
// The town merchant sells GEAR / artifacts only (no cards, no card-removal) — that
// service lives on-run. This is a small PLACEHOLDER set so the merchant flow is
// playable now; the real catalogue + effects land with Phase 5 (loadout/equipment).
//
// TODO(Phase 5): give each item a real effect (passive / triggered / deck-injecting),
//   wire ownership into the run-start loadout, and add salvage/take-home.
// TODO(balance): prices are rough placeholders. Replace from the reference-data DB
//   (D&D flavor · Darkest Dungeon tactics · Slay the Spire numbers) once it exists.
DS.Gear = {
  catalog: [
    // --- Common ---
    { id: 'gear_iron_dagger',   name: 'Iron Dagger',     icon: '🗡️', rarity: 'common',   price: 30,  desc: 'A plain but reliable blade. (Effect TBD — Phase 5)' },
    { id: 'gear_oak_buckler',   name: 'Oak Buckler',     icon: '🛡️', rarity: 'common',   price: 35,  desc: 'A light wooden shield. (Effect TBD — Phase 5)' },
    { id: 'gear_leather_jerkin',name: 'Leather Jerkin',  icon: '🦺',       rarity: 'common',   price: 30,  desc: 'Basic hide armor. (Effect TBD — Phase 5)' },
    // --- Uncommon ---
    { id: 'gear_whetstone',     name: 'Whetstone Charm', icon: '⚙️',       rarity: 'uncommon', price: 60,  desc: 'Keeps an edge keen. (Effect TBD — Phase 5)' },
    { id: 'gear_shadow_cloak',  name: 'Shadow Cloak',    icon: '🧥',       rarity: 'uncommon', price: 65,  desc: 'Woven from dusk. (Effect TBD — Phase 5)' },
    { id: 'gear_vigor_ring',    name: 'Ring of Vigor',   icon: '💍',       rarity: 'uncommon', price: 70,  desc: 'Pulses with vitality. (Effect TBD — Phase 5)' },
    // --- Rare ---
    { id: 'gear_dragonscale',   name: 'Dragonscale Plate', icon: '🐲',     rarity: 'rare',     price: 130, desc: 'Forged from a wyrm\'s hide. (Effect TBD — Phase 5)' },
    { id: 'gear_ember_staff',   name: 'Staff of Embers',   icon: '🔥',     rarity: 'rare',     price: 140, desc: 'Smolders with old fire. (Effect TBD — Phase 5)' }
  ],

  getById: function(gearId) {
    for (var i = 0; i < DS.Gear.catalog.length; i++) {
      if (DS.Gear.catalog[i].id === gearId) return DS.Gear.catalog[i];
    }
    return null;
  }
};
