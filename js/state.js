window.DS = window.DS || {};

DS.State = {
  SAVE_SCHEMA: 3,
  screen: 'title',  // title, map, combat, reward, rest, event, shop, gameover
  run: null,
  combat: null,
  migrationNotice: null,
  recoveredFromBackup: false,
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
    var entries = (party || DS.Heroes.slice(0, 4).map(function(def) {
      return { heroClass: def.cls, runsSurvived: 0 };
    })).slice(0, 4);

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
      var maxHp = Math.max(1, def.maxHp + veteranBonus + chapelBonus + ((rosterHero || entry).maxHpBonus || 0) - (DS.Meta && DS.Meta.getInjuryPenalty ? DS.Meta.getInjuryPenalty(rosterHero || entry) : 0));

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
        ,power: (rosterHero || entry).power || 0
        ,blockBonus: (rosterHero || entry).blockBonus || 0
      });
    });

    // Resolve the actual selected character, never a different veteran of the same class.
    var heroList = DS.State.run.heroes.map(function(h, i) {
      var entry = entries[i];
      var rh = DS.Meta && entry.rosterIndex !== undefined ? DS.Meta.heroRoster[entry.rosterIndex] : entry;
      return { cls: h.cls, heroIdx: i, kit: rh && rh.kit, upgradedCards: rh && rh.upgradedCards, skillCards: rh && rh.skillCards };
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
    // Enemy intent damage stays equal to the value telegraphed by the card.
    // Difficulty comes from encounters, HP and intent choices, not hidden
    // floor damage added after the player reads the number.
    var enemies = [];
    enemyPool.forEach(function(def, i) {
      var scaledHp = Math.round(def.maxHp * hpScale);
      // Copy intent definitions so combat state never mutates the catalog.
      var scaledIntents = def.intents.map(function(intent) {
        var si = {};
        for (var k in intent) si[k] = intent[k];
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
        version: DS.State.SAVE_SCHEMA, timestamp: Date.now(), screen: DS.State.screen, stats: DS.State.stats,
        run: serializedRun,
        combat: DS.State.screen === 'combat' ? DS.State.combat : null,
        comboTriggers: DS.Combat.COMBOS.map(function(c) { return !!c._triggered; }),
        migrationNotice: DS.State.migrationNotice || null,
        _runRosterMap: DS.State._runRosterMap || null,
        selectedHeroes: DS.State.selectedHeroes || null
      };
      // Rotate only a parseable active save into the recovery slot. A corrupt
      // active value must never replace the last known-good checkpoint.
      var previous = localStorage.getItem('darkspire_save');
      if (previous) {
        try {
          JSON.parse(previous);
          localStorage.setItem('darkspire_save_backup', previous);
        } catch (backupError) {}
      }
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
      DS.State.migrationNotice = null;
      DS.State.recoveredFromBackup = false;
      var raw = localStorage.getItem('darkspire_save');
      if (!raw) return false;
       var data;
       var loadedFromRecovery = false;
       try {
         data = JSON.parse(raw);
       } catch (activeError) {
         var backupRaw = localStorage.getItem('darkspire_save_backup');
         if (!backupRaw) {
           try {
             var checkpoint = JSON.parse(localStorage.getItem('darkspire_recovery_checkpoint') || 'null');
             backupRaw = checkpoint && checkpoint.raw;
           } catch (checkpointError) {}
         }
         if (!backupRaw) return false;
         data = JSON.parse(backupRaw);
         raw = backupRaw;
         loadedFromRecovery = true;
         DS.State.recoveredFromBackup = true;
       }
       var sourceVersion = Number(data.version) || 1;
       var droppedCards = 0;
       // Preserve the exact pre-migration checkpoint before any tolerant repair.
       // This is deliberately separate from the active save and is never used as
       // a substitute for a valid save.
        if (!loadedFromRecovery) localStorage.setItem('darkspire_recovery_checkpoint', JSON.stringify({
          savedAt: Date.now(), sourceVersion: sourceVersion, raw: raw
        }));

      // A pre-correction save may contain a five-hero active expedition. Do
      // not silently discard its campaign, gear or build: the exact raw save
      // is already in the recovery checkpoint. Return the player to the
      // campfire so they can form a legal four-hero party; Meta remains
      // untouched and preserves the full roster.
      if ((data.run && Array.isArray(data.run.heroes) && data.run.heroes.length > 4) ||
          (Array.isArray(data.selectedHeroes) && data.selectedHeroes.length > 4)) {
        DS.State.screen = 'campfire';
        DS.State.run = null;
        DS.State.combat = null;
        DS.State.selectedHeroes = null;
        DS.State._selectedParty = null;
        DS.State.migrationNotice = 'Campaign updated: the saved five-hero expedition was checkpointed; assemble four heroes to continue. Your roster, gear and town progress remain intact.';
        DS.State.deleteRunSave();
        return true;
      }

      // Validate shape
      if (!data.run || !data.run.heroes || !data.run.deck) return false;

       var rehydratePile = function(pile) {
         if (!Array.isArray(pile)) return [];
         return pile.map(function(saved) {
           var card = DS.State._rehydrateCard(saved);
           if (!card) { droppedCards++; return null; }
           return card;
         }).filter(function(card) { return !!card; });
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
       DS.State.stats = DS.State._migrateStats(data.stats);
      DS.State._runRosterMap = data._runRosterMap || null;
      DS.State.selectedHeroes = data.selectedHeroes || null;
      DS.State.run = restoredRun;
      DS.State.combat = restoredCombat;
       DS.Combat.COMBOS.forEach(function(c,i) { c._triggered = !!(data.comboTriggers && data.comboTriggers[i]); });

       DS.State.migrationNotice = null;
       if (loadedFromRecovery || sourceVersion < DS.State.SAVE_SCHEMA || droppedCards) {
         var parts = [];
         if (loadedFromRecovery) parts.push('recovered the last good checkpoint');
         if (sourceVersion < DS.State.SAVE_SCHEMA) parts.push('save updated to schema ' + DS.State.SAVE_SCHEMA);
         if (droppedCards) parts.push(droppedCards + ' retired card' + (droppedCards === 1 ? '' : 's') + ' removed');
         DS.State.migrationNotice = 'Campaign updated: ' + parts.join('; ') + '.';
       }

      // Rehydrate relics — look up full objects from DS.Relics
       (data.run.relicIds || []).forEach(function(relicId) {
         var relic = DS.State._findRelicDef(relicId);
         if (relic) DS.State.run.relics.push(relic);
       });
       if (!DS.State.migrationNotice && data.migrationNotice) DS.State.migrationNotice = data.migrationNotice;
       if (loadedFromRecovery || sourceVersion < DS.State.SAVE_SCHEMA || droppedCards) DS.State.save();

      // Clear the save (mid-run saves are consumed on load — roguelike)
      // Retain the durable checkpoint until another settled action replaces it.

      return true;
    } catch(e) {
      console.warn('Failed to load:', e);
      return false;
    }
  },

  _migrateStats: function(saved) {
    var defaults = { floorsCleared: 0, enemiesSlain: 0, cardsCollected: 0 };
    if (!saved || typeof saved !== 'object') return defaults;
    Object.keys(defaults).forEach(function(key) {
      var value = Number(saved[key]);
      defaults[key] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    });
    return defaults;
  },

  // Rebuild a card object from its serialized form
  _rehydrateCard: function(saved) {
    if (!saved || typeof saved !== 'object') return null;
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
