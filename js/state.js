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
  newRun: function() {
    DS.State.stats = { floorsCleared: 0, enemiesSlain: 0, cardsCollected: 0 };
    DS.State.run = {
      heroes: [],
      deck: [],
      relics: [],
      gold: 0,
      floor: 0,
      currentNode: null,
      map: null
    };

    // Init heroes from definitions
    DS.Heroes.forEach(function(def, i) {
      DS.State.run.heroes.push({
        id: 'hero_' + i,
        name: def.name,
        cls: def.cls,
        hp: def.maxHp,
        maxHp: def.maxHp,
        pos: def.startPos,
        block: 0,
        poison: 0,
        weak: 0,
        vulnerable: 0,
        strength: 0,
        bleed: 0,
        stunned: false,
        isHero: true,
        heroIdx: i
      });
    });

    // Build starting deck
    DS.State.run.deck = DS.Cards.buildStartingDeck();
  },

  // Set up combat state from run heroes + enemy pool
  startCombat: function(enemyPool) {
    // Reset hero block/poison/position for new combat
    DS.State.run.heroes.forEach(function(h, i) {
      h.block = 0;
      h.poison = 0;
      h.weak = 0;
      h.vulnerable = 0;
      h.strength = 0;
      h.bleed = 0;
      h.stunned = false;
      h.pos = DS.Heroes[i].startPos;
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
      // Can't serialize functions, so save deck as card IDs
      var saveData = {
        screen: DS.State.screen,
        stats: DS.State.stats,
        run: {
          heroes: DS.State.run.heroes,
          gold: DS.State.run.gold,
          floor: DS.State.run.floor,
          deckIds: DS.State.run.deck.map(function(c) { return c.baseId; })
        }
      };
      localStorage.setItem('darkspire_save', JSON.stringify(saveData));
    } catch(e) {
      console.warn('Failed to save:', e);
    }
  },

  // Load run from localStorage
  load: function() {
    try {
      var raw = localStorage.getItem('darkspire_save');
      if (!raw) return false;
      // For now, just return false — save/load is complex with function refs
      return false;
    } catch(e) {
      return false;
    }
  }
};
