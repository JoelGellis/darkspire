window.DS = window.DS || {};

DS.State = {
  screen: 'title',  // title, map, combat, reward, rest, event, shop, gameover
  run: null,
  combat: null,
  stats: {
    floorsCleared: 0,
    enemiesSlain: 0,
    cardsCollected: 0
  },

  // Initialize a fresh run
  // party: optional array of { heroClass, runsSurvived } from caravan
  newRun: function(party) {
    DS.State.stats = { floorsCleared: 0, enemiesSlain: 0, cardsCollected: 0 };
    var graveyardGold = (DS.Meta && DS.Meta.getGraveyardBonus) ? DS.Meta.getGraveyardBonus() : 0;
    var unlockGold = (DS.Meta && DS.Meta.getUnlockGoldBonus) ? DS.Meta.getUnlockGoldBonus() : 0;
    graveyardGold += unlockGold;
    DS.State.run = {
      heroes: [],
      deck: [],
      relics: [],
      gold: graveyardGold,
      startGold: graveyardGold,  // baseline for retreat banking — only GAINS above this bank
      floor: 0,
      currentNode: null,
      map: null,
      startTime: Date.now()
    };

    // Build hero entries — from caravan party or default first 4
    var entries = party || DS.Heroes.slice(0, 4).map(function(def) {
      return { heroClass: def.cls, runsSurvived: 0 };
    });

    entries.forEach(function(entry, runIdx) {
      // Find full hero definition by class
      var def = null;
      var defIdx = -1;
      for (var i = 0; i < DS.Heroes.length; i++) {
        if (DS.Heroes[i].cls === entry.heroClass) {
          def = DS.Heroes[i];
          defIdx = i;
          break;
        }
      }
      if (!def) return;

      var rosterHero = DS.Meta && entry.rosterIndex !== undefined ? DS.Meta.heroRoster[entry.rosterIndex] : null;
      var veteranBonus = ((rosterHero || entry).runsSurvived || 0) * 5;
      var chapelBonus = (DS.Meta && DS.Meta.getChapelBonus) ? DS.Meta.getChapelBonus() : 0;
      var maxHp = Math.max(1, def.maxHp + veteranBonus + chapelBonus - (DS.Meta && DS.Meta.getInjuryPenalty ? DS.Meta.getInjuryPenalty(rosterHero || entry) : 0));

      DS.State.run.heroes.push({
        id: 'hero_' + runIdx,
        name: (rosterHero && rosterHero.name) || def.name,
        cls: def.cls,
        hp: maxHp,
        maxHp: maxHp,
        pos: runIdx + 1, // Sequential positions (1-4) based on party order
        block: 0,
        poison: 0,
        weak: 0,
        vulnerable: 0,
        strength: 0,
        bleed: 0,
        stunned: false,
        isHero: true,
        heroIdx: defIdx
      });
    });

    // Resolve the actual selected character, never a different veteran of the same class.
    var heroList = DS.State.run.heroes.map(function(h, i) {
      var entry = entries[i];
      var rh = DS.Meta && entry.rosterIndex !== undefined ? DS.Meta.heroRoster[entry.rosterIndex] : entry;
      return { cls: h.cls, heroIdx: i, kit: rh && rh.kit, upgradedCards: rh && rh.upgradedCards };
    });
    DS.State.run.deck = DS.Cards.buildStartingDeck(heroList);
    if (DS.Gear) DS.Gear.applyLoadout(DS.State.run, entries.map(function(e) { return e.rosterIndex; }), DS.State._selectedArtifacts || []);
    DS.State._selectedArtifacts = [];

  },

  // Set up combat state from run heroes + enemy pool
  startCombat: function(enemyPool) {
    // Reset hero statuses for new combat — position persists across the run
    DS.State.run.heroes.forEach(function(h) {
      h.block = 0;
      h.poison = 0;
      h.weak = 0;
      h.vulnerable = 0;
      h.strength = 0;
      h.bleed = 0;
      h.stunned = false;
      // Position is NOT reset — it persists throughout the run
    });

    // Build enemies from pool definition with floor scaling
    var floor = DS.State.run.floor || 0;
    var hpScale = 1 + (floor * 0.1);   // +10% HP per floor
    var dmgScale = Math.floor(floor * 0.5); // +0.5 dmg per floor (rounded down)
    var enemies = [];
    enemyPool.forEach(function(def, i) {
      var scaledHp = Math.round(def.maxHp * hpScale);
      // Scale intents: add floor-based damage bonus
      var scaledIntents = def.intents.map(function(intent) {
        var si = {};
        for (var k in intent) si[k] = intent[k];
        if (si.dmg) si.dmg = si.dmg + dmgScale;
        return si;
      });
      enemies.push({
        id: 'enemy_' + i,
        name: def.name,
        icon: def.icon,
        hp: scaledHp,
        maxHp: scaledHp,
        block: 0,
        pos: i + 1, // Position by spawn order: 1 = front (closest to player)
        poison: 0,
        weak: 0,
        vulnerable: 0,
        strength: 0,
        bleed: 0,
        stunned: false,
        isHero: false,
        isBoss: def.isBoss || false,
        intentPool: scaledIntents,
        currentIntent: null,
        dmgBuff: 0,
        deathEffect: def.deathEffect || null
      });
    });

    DS.State.combat = {
      enemies: enemies,
      drawPile: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],
      energy: 3,
      maxEnergy: 3,
      turn: 1,
      selectedCard: null,
      gameOver: false,
      animating: false,
      log: []
    };
  },

  // Add a relic to the run, avoiding duplicates
  addRelic: function(relic) {
    if (!DS.State.run || !relic) return false;
    DS.State.run.relics = DS.State.run.relics || [];
    var isDupe = DS.State.run.relics.some(function(r) { return r.id === relic.id; });
    if (isDupe) return false;
    DS.State.run.relics.push(relic);
    return true;
  },

  // Clean up after combat
  endCombat: function(victory) {
    if (victory) {
      DS.State.stats.floorsCleared++;
      // Count slain enemies
      if (DS.State.combat) {
        DS.State.combat.enemies.forEach(function(e) {
          if (e.hp <= 0) DS.State.stats.enemiesSlain++;
        });
      }
      // Award gold — check for lucky coin relic multiplier
      var goldReward = 10 + Math.floor(Math.random() * 10) + (DS.State.run.floor * 2);
      if (DS.State.run.relics) {
        DS.State.run.relics.forEach(function(r) {
          if (r.goldMultiplier) {
            goldReward = Math.floor(goldReward * r.goldMultiplier);
          }
        });
      }
      DS.State.run.gold += goldReward;
      DS.State.run._lastGoldReward = goldReward;
      // NOTE: floor is managed by map node selection, not incremented here
    }
    DS.State.combat = null;
  },

  // Save run to localStorage
  save: function() {
    if (!DS.State.run) return;
    try {
      var run = DS.State.run;
      if (DS.State.combat && (DS.State.combat.animating || DS.State.combat.gameOver)) return false;
      var serializedRun = Object.assign({}, run, { relics: undefined, relicIds: (run.relics || []).map(function(r) { return r.id; }) });
      var saveData = {
        version: 2, timestamp: Date.now(), screen: DS.State.screen, stats: DS.State.stats,
        run: serializedRun,
        combat: DS.State.screen === 'combat' ? DS.State.combat : null,
        comboTriggers: DS.Combat.COMBOS.map(function(c) { return !!c._triggered; }),
        _runRosterMap: DS.State._runRosterMap || null,
        selectedHeroes: DS.State.selectedHeroes || null
      };
      localStorage.setItem('darkspire_save', JSON.stringify(saveData));
      return true;
    } catch(e) {
      console.warn('Failed to save:', e);
    }
  },

  // Check if a run save exists
  hasRunSave: function() {
    return localStorage.getItem('darkspire_save') !== null;
  },

  // Delete run save
  deleteRunSave: function() {
    localStorage.removeItem('darkspire_save');
  },

  // Load run from localStorage
  load: function() {
    try {
      var raw = localStorage.getItem('darkspire_save');
      if (!raw) return false;
      var data = JSON.parse(raw);

      // Validate shape
      if (!data.run || !data.run.heroes || !data.run.deck) return false;

      var rehydratePile = function(pile) {
        if (!Array.isArray(pile)) throw new Error('Invalid saved card pile');
        return pile.map(function(saved) {
          var card = DS.State._rehydrateCard(saved);
          if (!card) throw new Error('Unknown saved card: ' + saved.baseId);
          return card;
        });
      };
      var restoredRun = Object.assign({}, data.run, { deck: rehydratePile(data.run.deck), relics: [] });
      var restoredCombat = null;
      if (data.screen === 'combat') {
        if (!data.combat || data.combat.animating || data.combat.gameOver || !Array.isArray(data.combat.enemies)) return false;
        restoredCombat = Object.assign({}, data.combat);
        ['hand','drawPile','discardPile','exhaustPile'].forEach(function(pile) { restoredCombat[pile] = rehydratePile(data.combat[pile]); });
        if (restoredCombat._lastAttacker) restoredCombat._lastAttacker = restoredRun.heroes.find(function(h) { return h.id === restoredCombat._lastAttacker.id; }) || null;
        restoredCombat._lastAttackingEnemy = null;
      }
      DS.State.screen = data.screen || 'map';
      DS.State.stats = data.stats || { floorsCleared: 0, enemiesSlain: 0, cardsCollected: 0 };
      DS.State._runRosterMap = data._runRosterMap || null;
      DS.State.selectedHeroes = data.selectedHeroes || null;
      DS.State.run = restoredRun;
      DS.State.combat = restoredCombat;
      DS.Combat.COMBOS.forEach(function(c,i) { c._triggered = !!(data.comboTriggers && data.comboTriggers[i]); });

      // Rehydrate relics — look up full objects from DS.Relics
      (data.run.relicIds || []).forEach(function(relicId) {
        var relic = DS.State._findRelicDef(relicId);
        if (relic) DS.State.run.relics.push(relic);
      });

      // Clear the save (mid-run saves are consumed on load — roguelike)
      // Retain the durable checkpoint until another settled action replaces it.

      return true;
    } catch(e) {
      console.warn('Failed to load:', e);
      return false;
    }
  },

  // Rebuild a card object from its serialized form
  _rehydrateCard: function(saved) {
    var heroCls = saved.heroCls;
    var baseId = saved.baseId;
    if (!heroCls || !baseId) return null;

    // Find the card definition
    var cardDefs = baseId.indexOf('tactical_') === 0 ? DS.Cards.tactical : DS.Cards[heroCls];
    if (!cardDefs) return null;

    var def = null;
    for (var i = 0; i < cardDefs.length; i++) {
      if (cardDefs[i].id === baseId) {
        def = cardDefs[i];
        break;
      }
    }
    if (!def) return null;

    // Find hero display info
    var heroDef = null;
    for (var h = 0; h < DS.Heroes.length; h++) {
      if (DS.Heroes[h].cls === heroCls) { heroDef = DS.Heroes[h]; break; }
    }

    // Clone the card
    var card = Object.assign({}, saved, {
      id: saved.id,
      baseId: def.id,
      name: def.name,
      cost: def.cost,
      type: def.type,
      target: def.target,
      prefPos: def.prefPos.slice(),
      desc: def.desc,
      value: def.value,
      effect: def.effect,
      heroIdx: saved.heroIdx,
      heroCls: heroCls,
      heroName: heroDef ? heroDef.name : heroCls,
      upgraded: false
    });

    ['reach','innate','retain','ethereal','unplayable','exhaust','xCost','temporary'].forEach(function(key) { if (def[key] !== undefined) card[key] = def[key]; });
    ['_turnCost','_combatCost'].forEach(function(key) { if (saved[key] !== undefined) card[key] = saved[key]; });
    if (saved.upgraded) DS.Cards.applyUpgrade(card);

    return card;
  },

  // Find a relic definition by ID
  _findRelicDef: function(relicId) {
    if (!DS.Relics) return null;
    for (var i = 0; i < DS.Relics.length; i++) {
      if (DS.Relics[i].id === relicId) return DS.Relics[i];
    }
    return null;
  },

  // Auto-save after returning to map (called by the game flow)
  autoSave: function() {
    if (DS.State.screen === 'map' && DS.State.run) {
      DS.State.save();
    }
  }
};
