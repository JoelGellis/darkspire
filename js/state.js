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

      var veteranBonus = (entry.runsSurvived || 0) * 5;
      var chapelBonus = (DS.Meta && DS.Meta.getChapelBonus) ? DS.Meta.getChapelBonus() : 0;
      var maxHp = def.maxHp + veteranBonus + chapelBonus;

      DS.State.run.heroes.push({
        id: 'hero_' + runIdx,
        name: def.name,
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

    // Build starting deck from run heroes
    var heroList = DS.State.run.heroes.map(function(h, i) {
      return { cls: h.cls, heroIdx: i };
    });
    DS.State.run.deck = DS.Cards.buildStartingDeck(heroList);

    // Apply blacksmith upgrades from roster
    if (DS.Meta && DS.Meta.heroRoster) {
      entries.forEach(function(entry, runIdx) {
        var rosterHero = null;
        if (entry.rosterIndex !== undefined && entry.rosterIndex !== null) {
          rosterHero = DS.Meta.heroRoster[entry.rosterIndex];
        } else {
          // Fallback: match by class
          for (var r = 0; r < DS.Meta.heroRoster.length; r++) {
            if (DS.Meta.heroRoster[r].heroClass === entry.heroClass) {
              rosterHero = DS.Meta.heroRoster[r];
              break;
            }
          }
        }
        if (!rosterHero || !rosterHero.upgradedCards || !rosterHero.upgradedCards.length) return;

        DS.State.run.deck.forEach(function(card) {
          if (card.heroIdx === runIdx && rosterHero.upgradedCards.indexOf(card.baseId) !== -1 && !card.upgraded) {
            card.upgraded = true;
            card.name = card.name + '+';
            if (card.value) {
              var oldVal = card.value;
              card.value = Math.ceil(oldVal * 1.5);
              card.desc = card.desc.replace(String(oldVal), String(card.value));
              // Rebind effect with upgraded value
              if (DS.UI && DS.UI.rebindCardEffect) {
                DS.UI.rebindCardEffect(card, card.value);
              }
            }
          }
        });
      });
    }
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
        pos: def.pos,
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
      var saveData = {
        version: 1,
        timestamp: Date.now(),
        screen: DS.State.screen,
        stats: DS.State.stats,
        run: {
          heroes: run.heroes,
          gold: run.gold,
          floor: run.floor,
          currentNode: run.currentNode,
          map: run.map,
          startTime: run.startTime || Date.now(),
          visitedEvents: run.visitedEvents || [],
          // Serialize deck: strip functions, keep what we need to rebuild
          deck: run.deck.map(function(c) {
            return {
              id: c.id,
              baseId: c.baseId,
              upgraded: c.upgraded || false,
              heroIdx: c.heroIdx,
              heroCls: c.heroCls
            };
          }),
          // Serialize relics: just IDs
          relicIds: (run.relics || []).map(function(r) { return r.id; })
        },
        // Roster mapping for summary screen
        _runRosterMap: DS.State._runRosterMap || null,
        selectedHeroes: DS.State.selectedHeroes || null
      };
      localStorage.setItem('darkspire_save', JSON.stringify(saveData));
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

      // Restore simple state
      DS.State.screen = data.screen || 'map';
      DS.State.stats = data.stats || { floorsCleared: 0, enemiesSlain: 0, cardsCollected: 0 };
      DS.State._runRosterMap = data._runRosterMap || null;
      DS.State.selectedHeroes = data.selectedHeroes || null;

      // Restore run
      DS.State.run = {
        heroes: data.run.heroes,
        gold: data.run.gold || 0,
        floor: data.run.floor || 0,
        currentNode: data.run.currentNode || null,
        map: data.run.map || null,
        startTime: data.run.startTime || Date.now(),
        visitedEvents: data.run.visitedEvents || [],
        deck: [],
        relics: []
      };

      // Rehydrate deck — rebuild card objects from definitions
      data.run.deck.forEach(function(saved) {
        var card = DS.State._rehydrateCard(saved);
        if (card) DS.State.run.deck.push(card);
      });

      // Rehydrate relics — look up full objects from DS.Relics
      (data.run.relicIds || []).forEach(function(relicId) {
        var relic = DS.State._findRelicDef(relicId);
        if (relic) DS.State.run.relics.push(relic);
      });

      // Clear the save (mid-run saves are consumed on load — roguelike)
      DS.State.deleteRunSave();

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
    var cardDefs = DS.Cards[heroCls];
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
    var card = {
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
    };

    // Re-apply upgrade if it was upgraded
    if (saved.upgraded) {
      card.upgraded = true;
      card.name = card.name + '+';
      if (card.value) {
        var oldVal = card.value;
        card.value = Math.ceil(oldVal * 1.5);
        card.desc = card.desc.replace(String(oldVal), String(card.value));
        // Rebind effect with upgraded value
        if (DS.UI && DS.UI.rebindCardEffect) {
          DS.UI.rebindCardEffect(card, card.value);
        }
      }
    }

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
