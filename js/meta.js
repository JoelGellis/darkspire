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
  ownedGear: [],      // gear/artifact ids the PLAYER owns (see data/gear.js)
  merchantLevel: 0,   // town merchant upgrade tier (0-3) — gates stock quality
  PARTY_SIZE: 4,
  BASE_ROSTER_CAP: 4,
  lostGear: [],       // ledger of gear lost to death/wipes: {itemId, heroName, cause, runNumber}
  tutorialPerks: { freeBlacksmith: true, merchantDiscount: 0.20 },
                      // v1: lost stays lost — the ledger enables a future
                      // "rebuy lost gear from the merchant" softener

  // Building config (not persisted — reference only)
  _buildingConfig: {
    chapel: { maxLevel: 3, costs: [50, 100, 150] },
    tavern: { maxLevel: 5, costs: [60, 120, 180, 240, 300] },
    graveyard: { maxLevel: 3, costs: [40, 80, 120] }
  },

  // ===== CHARACTER SYSTEM: CLASS KITS =====
  // Every recruit ROLLS their base kit: 3 CORE cards (always the same) +
  // 1 SIGNATURE card rolled from the class's signature pool. The starting
  // deck carries 2 copies of each kit card (8 cards), same size as before.
  // Kit cards are the character's identity — they are NEVER offered in
  // rewards or shops (see DS.Cards.isBaseKitCard / getRewardPool).
  // `positions` is informational (for campfire/roster UI), derived from the
  // class's card prefPos ranges — it does not gate anything itself.
  CLASS_KITS: {
    fighter: {
      flavor: 'An iron wall with a sword arm. Holds the line so others can work.',
      positions: [1, 2],
      core: ['fighter_strike', 'fighter_shield_block', 'fighter_heavy_blow'],
      signatures: [
        { id: 'fighter_rally', variant: 'Warlord' },
        { id: 'fighter_taunt', variant: 'Bulwark' }
      ]
    },
    rogue: {
      flavor: 'Strikes from the seams of the fight, then is somewhere else.',
      positions: [2, 3],
      core: ['rogue_backstab', 'rogue_evade', 'rogue_shadow_step'],
      signatures: [
        { id: 'rogue_throwing_knife', variant: 'Knife Dancer' },
        { id: 'rogue_poison_blade', variant: 'Venomblade' }
      ]
    },
    cleric: {
      flavor: 'Mends flesh and turns wrath aside. The party lives while the cleric stands.',
      positions: [3, 4],
      core: ['cleric_smite', 'cleric_divine_shield', 'cleric_heal'],
      signatures: [
        { id: 'cleric_bless', variant: 'Shepherd' },
        { id: 'cleric_holy_fire', variant: 'Zealot' }
      ]
    },
    wizard: {
      flavor: 'Fragile, brilliant, catastrophic. Keep the enemy far away and the spells flowing.',
      positions: [4],
      core: ['wizard_magic_missile', 'wizard_arcane_ward', 'wizard_fireball'],
      signatures: [
        { id: 'wizard_arcane_intellect', variant: 'Scholar' },
        { id: 'wizard_frost_nova', variant: 'Frostcaller' }
      ]
    },
    barbarian: {
      flavor: 'Pain is fuel. The lower the blood runs, the harder the axe falls.',
      positions: [1],
      core: ['barbarian_savage_strike', 'barbarian_tough_skin', 'barbarian_reckless_charge'],
      signatures: [
        { id: 'barbarian_blood_rage', variant: 'Berserker' },
        { id: 'barbarian_rampage', variant: 'Ravager' }
      ]
    },
    ranger: {
      flavor: 'Reads the field like a trail. Every shot is placed, every trap is waiting.',
      positions: [2, 3],
      core: ['ranger_quick_shot', 'ranger_dodge_roll', 'ranger_aimed_shot'],
      signatures: [
        { id: 'ranger_snare_trap', variant: 'Trapper' },
        { id: 'ranger_poison_arrow', variant: 'Venom Archer' }
      ]
    },
    necromancer: {
      flavor: 'Borrows life from the dying and lends it to the living. At interest.',
      positions: [3, 4],
      core: ['necromancer_life_drain', 'necromancer_shadow_bolt', 'necromancer_bone_shield'],
      signatures: [
        { id: 'necromancer_hex', variant: 'Cursebinder' },
        { id: 'necromancer_blight', variant: 'Plaguebringer' }
      ]
    },
    paladin: {
      flavor: 'Faith with a shield rim. Stands where the hurt is and gives it back.',
      positions: [1, 2],
      core: ['paladin_holy_strike', 'paladin_shield_of_faith', 'paladin_lay_on_hands'],
      signatures: [
        { id: 'paladin_righteous_blow', variant: 'Crusader' },
        { id: 'paladin_retribution', variant: 'Sentinel' }
      ]
    }
  },

  // Roll a base kit for a class: core cards + one rolled signature.
  // Returns an array of card baseIds (deck builder makes 2 copies of each).
  rollKit: function(heroClass) {
    var spec = DS.Meta.CLASS_KITS[heroClass];
    if (!spec) {
      // Unknown class: fall back to the classic 4 starters
      var cards = DS.Cards[heroClass] || [];
      return cards.slice(0, 4).map(function(c) { return c.id; });
    }
    var sig = spec.signatures[Math.floor(Math.random() * spec.signatures.length)];
    return spec.core.concat([sig.id]);
  },

  rollSkillTree: function(heroClass) {
    return DS.Skills ? DS.Skills.generate(heroClass) : { version: 1, branches: [] };
  },

  // Generate a fresh level-1 recruit with a rolled kit. Does NOT push to the
  // roster or save — callers (campfire, caravan) decide what to do with it.
  // Arg forms: undefined -> any unlocked class; string -> that class;
  // array -> any unlocked class NOT in the list (the campfire's exclude form).
  rollRecruit: function(heroClass) {
    var cls = heroClass;
    if (!cls || Object.prototype.toString.call(cls) === '[object Array]') {
      var exclude = cls || [];
      var pool = DS.Meta.getUnlockedClasses().filter(function(c) {
        return exclude.indexOf(c) === -1;
      });
      // Recruits fill roster capacity; party size remains four.
      if (!pool.length) pool = DS.Meta.getUnlockedClasses();
      if (!pool.length) return null;
      cls = pool[Math.floor(Math.random() * pool.length)];
    }
    return {
      heroClass: cls,
      alive: true,
      runsSurvived: 0,
      level: 1,
      xp: 0,
      injury: null,
      kit: DS.Meta.rollKit(cls),
      skillTree: DS.Meta.rollSkillTree(cls),
      progressionVersion: 2,
      skillPoints: 0,
      maxHpBonus: 0,
      power: 0,
      blockBonus: 0,
      skillCards: [],
      subclass: null,
      upgradedCards: [],
      gear: DS.Meta._emptyGearSlots()
    };
  },

  // Starting kits vary mechanically; recruits retain only their base class.
  getKitVariant: function(rosterHero) {
    return null;
  },

  // Backfill character-system fields on a roster entry (older saves).
  // Legacy heroes get the classic 4-starter kit — exactly the deck they
  // already had — so nothing changes out from under an existing save.
  _backfillRosterEntry: function(h) {
    if (h.alive === undefined) h.alive = true;
    if (!Array.isArray(h.upgradedCards)) h.upgradedCards = [];
    if (typeof h.runsSurvived !== 'number') h.runsSurvived = 0;
    if (typeof h.level !== 'number') h.level = 1;
    if (typeof h.xp !== 'number') h.xp = 0;
    if (h.injury === undefined) h.injury = null;
    if (h.subclass === undefined) h.subclass = null;
    if (!Array.isArray(h.kit) || !h.kit.length) {
      var cards = DS.Cards[h.heroClass] || [];
      h.kit = cards.slice(0, 4).map(function(c) { return c.id; });
    }
    h.level = Math.max(1, Math.min(6, Number.isFinite(h.level) ? Math.floor(h.level) : 1));
    h.xp = Number.isFinite(h.xp) && h.xp >= 0 ? h.xp : 0;
    var validCard = function(id) { return (DS.Cards[h.heroClass] || []).some(function(c) { return c.id === id; }); };
    h.kit = h.kit.filter(validCard);
    if (!h.kit.length) h.kit = DS.Meta.rollKit(h.heroClass);
    h.upgradedCards = h.upgradedCards.filter(validCard);
    if (DS.Skills.migrate) DS.Skills.migrate(h);
    else {
      if (!DS.Skills.valid(h.skillTree, h.heroClass)) h.skillTree = DS.Meta.rollSkillTree(h.heroClass);
      DS.Skills.repair(h.skillTree, h.heroClass);
    }
    // Recompute only progression-owned stats. Gear, wounds, gold and mastery survive.
    // Also fixes pre-schema leveled heroes and the partially implemented skill saves.
    var spent = 0, hp = (h.level - 1) * 2, power = h.level - 1, block = 0, cards = [];
    h.skillTree.branches.forEach(function(branch) { branch.nodes.forEach(function(node) {
      if (!node.unlocked) return;
      spent++;
      if (node.kind === 'maxHp') hp += node.amount;
      if (node.kind === 'power') power += node.amount;
      if (node.kind === 'block') block += node.amount;
      if (node.kind === 'card' && validCard(node.cardId) && cards.indexOf(node.cardId) < 0) cards.push(node.cardId);
    }); });
    if (h.progressionVersion !== 2) DS.Meta.progressionNotice = 'Hero progression updated. Compatible kits and learned skills were kept; level stats and points were recalculated.';
    h.progressionVersion = 2;
    h.skillPoints = Math.max(0, h.level - 1 - spent);
    h.maxHpBonus = hp; h.power = power; h.blockBonus = block; h.skillCards = cards;
  },

  // ===== SAVE / LOAD =====

  // Empty per-hero gear slot map (weapon / armor / 2 trinkets — see data/gear.js)
  _emptyGearSlots: function() {
    return (DS.Gear && DS.Gear._emptySlots)
      ? DS.Gear._emptySlots()
      : { weapon: null, armor: null, trinket: null, trinket2: null };
  },

  newGame: function() {
    DS.Meta.gold = 60;
    DS.Meta.runCount = 0;
    DS.Meta.rosterCapacityVersion = 1;
    DS.Meta.heroRoster = [
      DS.Meta.rollRecruit('fighter'),
      DS.Meta.rollRecruit('rogue'),
      DS.Meta.rollRecruit('cleric'),
      DS.Meta.rollRecruit('wizard')
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
    DS.Meta.merchantLevel = 0;
    DS.Meta.lostGear = [];
    DS.Meta.tutorialPerks = { freeBlacksmith: true, merchantDiscount: 0.20, rosterExpansion: false };
    DS.Meta.progressionTutorial = { completed: false };
    DS.Meta.save();
  },

  save: function() {
    try {
      var data = {
        gold: DS.Meta.gold,
        runCount: DS.Meta.runCount,
        rosterCapacityVersion: 1,
        victories: DS.Meta.victories,
        heroRoster: DS.Meta.heroRoster,
        buildings: DS.Meta.buildings,
        graveyard: DS.Meta.graveyard,
        unlocks: DS.Meta.unlocks,
        ownedGear: DS.Meta.ownedGear,
        merchantLevel: DS.Meta.merchantLevel,
        lostGear: DS.Meta.lostGear,
        progressionTutorial: DS.Meta.progressionTutorial || { completed: false },
        tutorialPerks: DS.Meta.tutorialPerks
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
      DS.Meta.ownedGear = data.ownedGear || [];        // backfills old saves with no gear
      DS.Meta.merchantLevel = data.merchantLevel || 0; // backfills pre-Phase-5 saves
      DS.Meta.lostGear = data.lostGear || [];          // backfills pre-Phase-5 saves
      DS.Meta.progressionTutorial = data.progressionTutorial || { completed: false };
      DS.Meta.tutorialPerks = data.tutorialPerks || { freeBlacksmith: true, merchantDiscount: 0.20, rosterExpansion: false };
      if (DS.Meta.tutorialPerks.rosterExpansion === undefined) {
        // Older saves treated the initial tavern level as a fifth party slot.
        // Reinterpret that level as the tutorial roster expansion only after
        // a run has resolved, while preserving later tavern upgrades.
        DS.Meta.tutorialPerks.rosterExpansion = DS.Meta.runCount > 0;
        if (DS.Meta.buildings.tavern && DS.Meta.buildings.tavern.level > 0) {
          DS.Meta.buildings.tavern.level = Math.max(0, DS.Meta.buildings.tavern.level - 1);
        }
      }
      if (DS.Meta.runCount > 0) DS.Meta.tutorialPerks.rosterExpansion = true;

      // Backfill per-hero gear slots on pre-Phase-5 saves; prune dead gear ids
      DS.Meta.heroRoster.forEach(function(h) {
        if (!h.gear) h.gear = DS.Meta._emptyGearSlots();
      });
      if (DS.Gear && DS.Gear.migrateOwned) DS.Gear.migrateOwned();

      // Backfill character-system fields (level/xp/kit/injury) on old saves
      DS.Meta.heroRoster.forEach(DS.Meta._backfillRosterEntry);

      // Ensure building shape
      if (!DS.Meta.buildings.chapel) DS.Meta.buildings.chapel = { level: 0 };
      if (!DS.Meta.buildings.tavern) DS.Meta.buildings.tavern = { level: 0 };
      if (DS.Meta.buildings.tavern.level < 0) DS.Meta.buildings.tavern.level = 0;
      if (!DS.Meta.buildings.graveyard) DS.Meta.buildings.graveyard = { level: 0 };

      DS.Meta.save(); // Persist rolled migration trees before another refresh.
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

  // Add a hero to the roster. Accepts either a class string (a fresh recruit
  // is rolled) or a pre-rolled recruit object from rollRecruit().
  addHeroToRoster: function(heroClassOrEntry) {
    var entry = (typeof heroClassOrEntry === 'string' || !heroClassOrEntry)
      ? DS.Meta.rollRecruit(heroClassOrEntry)
      : heroClassOrEntry;
    DS.Meta.heroRoster.push(entry);
    DS.Meta.save();
    return DS.Meta.heroRoster.length - 1;
  },

  // Append to the lost-gear ledger (no buyback in v1 — future softener hook)
  recordLostGear: function(itemId, heroName, cause) {
    DS.Meta.lostGear = DS.Meta.lostGear || [];
    DS.Meta.lostGear.push({
      itemId: itemId,
      heroName: heroName,
      cause: cause,
      runNumber: DS.Meta.runCount
    });
  },

  killHero: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero) return;
    // Phase 4/5: a dead hero's EQUIPPED gear is lost with them (DESIGN.md).
    // Unequipped gear in the bank is safe. onHeroDeathMeta strips ownership.
    var gearLost = (DS.Gear && DS.Gear.onHeroDeathMeta) ? DS.Gear.onHeroDeathMeta(hero) : [];
    gearLost.forEach(function(id) {
      DS.Meta.recordLostGear(id, hero.heroClass, 'death');
    });
    DS.Meta.graveyard.push({
      heroClass: hero.heroClass,
      runsSurvived: hero.runsSurvived,
      level: hero.level || 1,
      runNumber: DS.Meta.runCount,
      gearLost: gearLost
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

  // ===== XP & LEVELS (DD-style — progress dies with the character) =====
  // Earning rule (v1): every survivor of a run earns 1 XP per floor cleared,
  // +3 bonus if the boss fell. Dead heroes earn nothing (they're dead).
  // Each level-up auto-upgrades one base-kit card (signature first, then
  // cores in kit order) using DS.Cards.UPGRADE_DEFS. Upgrades are stored on
  // the roster entry (upgradedCards) and applied only when that character's
  // deck is built — they never touch the shared collection, and they go to
  // the graveyard with the character.
  // TODO(Joel): open balance params — XP_CURVE / XP_PER_FLOOR /
  //   XP_VICTORY_BONUS / XP_LEVEL_CAP are first guesses, tune from play.
  //   Alternative v2: level-up grants an upgrade POINT the player spends at
  //   the campfire (DS.Meta.upgradeHeroCard already supports choosing).
  XP_LEVEL_CAP: 6,
  XP_PER_FLOOR: 1,
  XP_VICTORY_BONUS: 3,
  // XP needed to go FROM level N to N+1 (index by current level, 1-based).
  XP_CURVE: [0, 8, 12, 16, 20, 24],

  xpToNext: function(level) {
    if (level >= DS.Meta.XP_LEVEL_CAP) return null;   // capped
    return DS.Meta.XP_CURVE[level];
  },

  // Grant XP to one roster hero; handles multi-level-ups. Returns an array of
  // { level, upgradedCardId } for each level gained (for UI toasts later).
  addXp: function(rosterIndex, amount) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero || hero.alive === false || !Number.isFinite(amount) || !(amount > 0)) return [];
    DS.Meta._backfillRosterEntry(hero);
    var gains = [];
    hero.xp += amount;
    var need = DS.Meta.xpToNext(hero.level);
    while (need !== null && hero.xp >= need) {
      hero.xp -= need;
      hero.level++;
      hero.skillPoints = (hero.skillPoints || 0) + 1;
      hero.maxHpBonus = (hero.maxHpBonus || 0) + 2;
      hero.power = (hero.power || 0) + 1;
      var upgradedId = DS.Meta._autoUpgradeKitCard(hero);
      gains.push({ level: hero.level, upgradedCardId: upgradedId, skillPoint: 1, maxHp: 2, power: 1 });
      need = DS.Meta.xpToNext(hero.level);
    }
    if (DS.Meta.xpToNext(hero.level) === null) hero.xp = 0;  // capped: no banking
    var tutorial = DS.Meta.progressionTutorial || (DS.Meta.progressionTutorial = { completed: false });
    if (gains.length && !tutorial.completed && !tutorial.pending) {
      hero.firstLevelGains = gains;
      tutorial.pending = true;
    }
    DS.Meta.save();
    return gains;
  },

  spendSkillPoint: function(rosterIndex, nodeId) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero || hero.alive === false) return false;
    DS.Meta._backfillRosterEntry(hero);
    if (hero.skillPoints < 1) return false;
    var found = null;
    var foundBranch = null;
    for (var b = 0; b < hero.skillTree.branches.length; b++) {
      var nodes = hero.skillTree.branches[b].nodes;
      for (var n = 0; n < nodes.length; n++) if (nodes[n].id === nodeId) { found = { node: nodes[n], nodes: nodes, index: n }; foundBranch = hero.skillTree.branches[b]; }
    }
    if (!found || found.node.unlocked) return false;
    if (hero.subclass && foundBranch.id !== hero.subclass) return false;
    if (found.node.requires && (!found.nodes[found.index - 1] || !found.nodes[found.index - 1].unlocked)) return false;
    if (!hero.subclass) hero.subclass = foundBranch.id;
    found.node.unlocked = true;
    if (hero.firstLevelGains && DS.Meta.progressionTutorial) DS.Meta.progressionTutorial = { completed: true };
    hero.skillPoints--;
    if (found.node.kind === 'maxHp') hero.maxHpBonus = (hero.maxHpBonus || 0) + found.node.amount;
    if (found.node.kind === 'power') hero.power = (hero.power || 0) + found.node.amount;
    if (found.node.kind === 'block') hero.blockBonus = (hero.blockBonus || 0) + found.node.amount;
    if (found.node.kind === 'card' && found.node.cardId && hero.skillCards.indexOf(found.node.cardId) === -1) hero.skillCards.push(found.node.cardId);
    DS.Meta.save();
    return true;
  },

  // Pick the next un-upgraded kit card and mark it upgraded.
  // Order: signature (last kit slot) first — a level-up hones what makes this
  // character THIS character — then core cards in kit order.
  _autoUpgradeKitCard: function(hero) {
    var kit = hero.kit || [];
    var order = kit.slice(-1).concat(kit.slice(0, -1));
    for (var i = 0; i < order.length; i++) {
      if (hero.upgradedCards.indexOf(order[i]) === -1) {
        hero.upgradedCards.push(order[i]);
        return order[i];
      }
    }
    return null;   // whole kit already upgraded (blacksmith and/or max level)
  },

  // XP earned by each survivor of the run that just ended.
  _runXpEarned: function(victory) {
    var stats = DS.State && DS.State.stats;
    var floors = stats ? (stats.floorsCleared || 0) : 0;
    return floors * DS.Meta.XP_PER_FLOOR + (victory ? DS.Meta.XP_VICTORY_BONUS : 0);
  },

  // ===== INJURIES (lightweight — DD-inspired, deliberately cheap) =====
  // NO stress system, by design. One injury type (Wounded: -20% max HP on the
  // next expedition), two triggers:
  //   PRIMARY — fleeing a fight: each survivor of a mid-combat FLEE rolls a
  //     high injury chance (applyFleeInjuries, called by the flee handler).
  //   SECONDARY — limping home: a survivor who ends a run at/below 25% max HP
  //     (incl. the first-run "miraculous escape" at 0) comes home Wounded.
  // Healing: free by sitting out one run, or instantly for a small gold fee
  // (campfire/town UI calls healInjury).
  // TODO(Joel): open params — flee chance, threshold, penalty, heal cost.
  FLEE_INJURY_CHANCE: 0.75,
  INJURY_HP_THRESHOLD: 0.25,
  INJURY_MAXHP_PENALTY: 0.2,
  INJURY_HEAL_COST: 15,

  isInjured: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    return !!(hero && hero.injury);
  },

  // Flat max-HP penalty for an injured hero (from the class's BASE maxHp,
  // so veteran/chapel bonuses aren't compounded into the wound).
  getInjuryPenalty: function(rosterHero) {
    if (!rosterHero || !rosterHero.injury) return 0;
    var def = null;
    for (var i = 0; i < DS.Heroes.length; i++) {
      if (DS.Heroes[i].cls === rosterHero.heroClass) { def = DS.Heroes[i]; break; }
    }
    if (!def) return 0;
    return Math.floor(def.maxHp * DS.Meta.INJURY_MAXHP_PENALTY);
  },

  // Pay gold to patch a hero up immediately. Returns true on success.
  healInjury: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero || !hero.injury) return false;
    if (!DS.Meta.spendGold(DS.Meta.INJURY_HEAL_COST)) return false;
    hero.injury = null;
    DS.Meta.save();
    return true;
  },

  // Set the Wounded tag on a roster hero (idempotent — injuries don't stack).
  _injure: function(rosterIndex) {
    var hero = DS.Meta.heroRoster[rosterIndex];
    if (!hero) return;
    hero.injury = {
      id: 'wounded',
      name: 'Wounded',
      desc: '-' + Math.round(DS.Meta.INJURY_MAXHP_PENALTY * 100) +
        '% Max HP. Heals by sitting out one run, or pay ' +
        DS.Meta.INJURY_HEAL_COST + 'g.'
    };
  },

  // Tag a survivor as Wounded if they limped home. runHero is the run-state
  // hero (has hp/maxHp at run end).
  _maybeInjure: function(rosterIndex, runHero) {
    if (!runHero) return;
    if (runHero.hp <= runHero.maxHp * DS.Meta.INJURY_HP_THRESHOLD) {
      DS.Meta._injure(rosterIndex);
    }
  },

  // PRIMARY injury trigger — call from the combat FLEE handler after a
  // mid-fight escape (one line: DS.Meta.applyFleeInjuries()).
  // survivors: array of run-state heroes who fled; defaults to all living
  // heroes in the current run. Each rolls FLEE_INJURY_CHANCE to be Wounded.
  // Returns the names of newly injured heroes (for the flee log/toast).
  applyFleeInjuries: function(survivors) {
    var runHeroes = (DS.State && DS.State.run) ? DS.State.run.heroes : [];
    var fleeing = survivors || runHeroes.filter(function(h) { return h.hp > 0; });
    var injuredNames = [];
    fleeing.forEach(function(runHero) {
      var idx = DS.Meta._rosterIndexForRunHero(runHero);
      if (idx === -1) return;
      var already = DS.Meta.heroRoster[idx] && DS.Meta.heroRoster[idx].injury;
      if (Math.random() < DS.Meta.FLEE_INJURY_CHANCE) {
        DS.Meta._injure(idx);
        if (!already) injuredNames.push(runHero.name);
      }
    });
    DS.Meta.save();
    return injuredNames;
  },

  // Map a run-state hero back to its roster index.
  // Preferred: DS.State._runRosterMap (run hero index -> roster index),
  // fallback: first roster entry of the same class (caravan forbids
  // duplicate classes, so class match is unambiguous).
  _rosterIndexForRunHero: function(runHero) {
    var runHeroes = (DS.State && DS.State.run) ? DS.State.run.heroes : [];
    var runIdx = runHeroes.indexOf(runHero);
    var map = DS.State && DS.State._runRosterMap;
    if (map && runIdx !== -1 && map[runIdx] !== undefined && map[runIdx] !== null) {
      return map[runIdx];
    }
    for (var r = 0; r < DS.Meta.heroRoster.length; r++) {
      if (DS.Meta.heroRoster[r].heroClass === runHero.cls) return r;
    }
    return -1;
  },

  // Everyone who stayed home this run rests off their injuries for free.
  // MUST run before killHero splices shift roster indices.
  _restInjuredAtHome: function(runRosterIndices) {
    DS.Meta.heroRoster.forEach(function(h, i) {
      if (runRosterIndices.indexOf(i) === -1 && h.injury) h.injury = null;
    });
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
    return DS.Meta.getRosterCapacity();
  },

  getRosterCapacity: function() {
    var perks = DS.Meta.tutorialPerks || {};
    var tutorial = perks.rosterExpansion || DS.Meta.runCount > 0 ? 1 : 0;
    var tavern = DS.Meta.buildings && DS.Meta.buildings.tavern ? (DS.Meta.buildings.tavern.level || 0) : 0;
    return DS.Meta.BASE_ROSTER_CAP + tutorial + tavern * DS.Buildings.tavern.slotsPerLevel;
  },

  grantFirstRunRosterExpansion: function() {
    if (!DS.Meta.tutorialPerks) DS.Meta.tutorialPerks = {};
    DS.Meta.tutorialPerks.rosterExpansion = true;
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

    // Home-front recovery + character progression (before any splicing)
    DS.Meta._restInjuredAtHome(runHeroRosterIndices);
    var xpEarned = DS.Meta._runXpEarned(false);
    var runHeroes = (DS.State && DS.State.run) ? DS.State.run.heroes : null;

    var kills = [];
    for (var i = 0; i < runHeroRosterIndices.length; i++) {
      var idx = runHeroRosterIndices[i];
      if (idx === -1) continue;
      if (aliveFlags[i]) {
        DS.Meta.heroSurvivedRun(idx);
        DS.Meta.addXp(idx, xpEarned);
        if (runHeroes && runHeroes[i]) DS.Meta._maybeInjure(idx, runHeroes[i]);
      } else {
        kills.push(idx);
      }
    }
    kills.sort(function(a, b) { return b - a; });
    kills.forEach(function(idx) {
      DS.Meta.killHero(idx);
    });

    DS.Meta.runCount++;
    DS.Meta.grantFirstRunRosterExpansion();
    DS.Meta.welfareCheck();
    DS.Meta.save();
  },

  applyDefeatPenalty: function(runHeroRosterIndices) {
    // Heroes who stayed home still rest off injuries
    DS.Meta._restInjuredAtHome(runHeroRosterIndices);

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

    // Home-front recovery + character progression (before any splicing)
    DS.Meta._restInjuredAtHome(runHeroRosterIndices);
    var xpEarned = DS.Meta._runXpEarned(true);
    var runHeroes = (DS.State && DS.State.run) ? DS.State.run.heroes : null;

    // Process heroes from the run — sort descending for safe splicing of dead
    var kills = [];
    for (var i = 0; i < runHeroRosterIndices.length; i++) {
      var idx = runHeroRosterIndices[i];
      if (idx === -1) continue;
      if (aliveFlags[i]) {
        DS.Meta.heroSurvivedRun(idx);
        DS.Meta.addXp(idx, xpEarned);
        if (runHeroes && runHeroes[i]) DS.Meta._maybeInjure(idx, runHeroes[i]);
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
    DS.Meta.grantFirstRunRosterExpansion();
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

// ===== GEAR CATALOGUE =====
// Phase 5: the real catalogue + economy logic lives in data/gear.js (DS.Gear).
// The Phase-3 placeholder that sat here has been replaced — all 8 placeholder
// gear ids were kept in the new catalog, so old ownedGear saves stay valid.
