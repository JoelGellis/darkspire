window.DS = window.DS || {};

DS.Relics = [

  // ============================================================
  // COMMON RELICS
  // ============================================================

  {
    id: 'iron_shield',
    name: 'Iron Shield',
    desc: 'Start each combat with 3 Block on all heroes.',
    rarity: 'common',
    icon: '\uD83D\uDEE1\uFE0F',
    onCombatStart: function(state) {
      if (!state || !state.run || !state.run.heroes) return;
      state.run.heroes.forEach(function(h) {
        if (h && h.hp > 0) {
          h.block = (h.block || 0) + 3;
        }
      });
    }
  },

  {
    id: 'healing_herb',
    name: 'Healing Herb',
    desc: 'At end of combat, heal all heroes 5 HP.',
    rarity: 'common',
    icon: '\uD83C\uDF3F',
    onCombatEnd: function(state) {
      if (!state || !state.run || !state.run.heroes) return;
      state.run.heroes.forEach(function(h) {
        if (h && h.hp > 0 && h.maxHp) {
          h.hp = Math.min(h.hp + 5, h.maxHp);
        }
      });
    }
  },

  {
    id: 'sharpening_stone',
    name: 'Sharpening Stone',
    desc: 'First attack card each combat deals +3 damage.',
    rarity: 'common',
    icon: '\uD83E\uDEA8',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._sharpenUsed = false;
    },
    onCardPlayed: function(state, card) {
      if (!state || !state.run) return;
      if (state.run._sharpenUsed) return;
      if (card && card.type === 'attack' && card.target) {
        state.run._sharpenUsed = true;
        // Return bonus damage for the engine to apply
        return { bonusDamage: 3 };
      }
    }
  },

  {
    id: 'torch',
    name: 'Torch',
    desc: 'Draw 1 extra card on turn 1 of each combat.',
    rarity: 'common',
    icon: '\uD83D\uDD25',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._torchTurn = 0;
    },
    onTurnStart: function(state) {
      if (!state || !state.run) return;
      state.run._torchTurn = (state.run._torchTurn || 0) + 1;
      if (state.run._torchTurn === 1) {
        if (DS.Combat && DS.Combat.drawCard) {
          DS.Combat.drawCard();
        }
      }
    }
  },

  {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    desc: 'Gain 15% more gold from combat.',
    rarity: 'common',
    icon: '\uD83E\uDE99',
    // Engine checks this flag when awarding gold
    goldMultiplier: 1.15
  },

  // ============================================================
  // UNCOMMON RELICS
  // ============================================================

  {
    id: 'berserkers_ring',
    name: "Berserker's Ring",
    desc: 'When a hero drops below 50% HP, their next attack deals +5 damage.',
    rarity: 'uncommon',
    icon: '\uD83D\uDC8D',
    onDamageTaken: function(state, hero, amount) {
      if (!hero || !hero.maxHp) return;
      if (hero.hp > 0 && hero.hp < hero.maxHp * 0.5) {
        hero._berserkBuff = true;
      }
    },
    onCardPlayed: function(state, card) {
      if (!state || !state.run || !state.run.heroes) return;
      if (card && card.type === 'attack' && typeof card.heroIdx === 'number') {
        var hero = state.run.heroes[card.heroIdx];
        if (hero && hero._berserkBuff) {
          hero._berserkBuff = false;
          return { bonusDamage: 5 };
        }
      }
    }
  },

  {
    id: 'mages_codex',
    name: "Mage's Codex",
    desc: 'When you play 3 cards in a turn, draw 1 card.',
    rarity: 'uncommon',
    icon: '\uD83D\uDCD6',
    onTurnStart: function(state) {
      if (!state || !state.run) return;
      state.run._codexCount = 0;
      state.run._codexTriggered = false;
    },
    onCardPlayed: function(state, card) {
      if (!state || !state.run) return;
      state.run._codexCount = (state.run._codexCount || 0) + 1;
      if (state.run._codexCount >= 3 && !state.run._codexTriggered) {
        state.run._codexTriggered = true;
        if (DS.Combat && DS.Combat.drawCard) {
          DS.Combat.drawCard();
        }
      }
    }
  },

  {
    id: 'guardian_angel',
    name: 'Guardian Angel',
    desc: 'The first time a hero would die each combat, survive with 1 HP instead.',
    rarity: 'uncommon',
    icon: '\uD83D\uDC7C',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._angelUsed = false;
    },
    onDamageTaken: function(state, hero, amount) {
      if (!state || !state.run) return;
      if (state.run._angelUsed) return;
      // Fire AFTER damage — if hero is dead, revive to 1 HP
      if (hero && hero.hp <= 0) {
        state.run._angelUsed = true;
        hero.hp = 1;
        // Prevent the death from being processed by returning prevented flag
        return { prevented: true, message: 'Guardian Angel intervenes! ' + hero.name + ' clings to life!' };
      }
    }
  },

  {
    id: 'position_boots',
    name: 'Position Boots',
    desc: 'Once per combat, you may play a card ignoring position requirements.',
    rarity: 'uncommon',
    icon: '\uD83E\uDD7E',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._bootsUsed = false;
    },
    // Engine checks state.run._bootsUsed and sets it true when player opts to use it
    ignorePosition: true
  },

  {
    id: 'vampiric_blade',
    name: 'Vampiric Blade',
    desc: 'Attacks that kill an enemy heal the killer for 3 HP.',
    rarity: 'uncommon',
    icon: '\uD83D\uDDE1\uFE0F',
    onEnemyKill: function(state, enemy) {
      if (!state || !state.run || !state.run.heroes) return;
      // The engine should pass the killing hero as context; fallback to first alive hero
      var killer = (state.combat && state.combat._lastAttacker) || null;
      if (!killer) {
        // fallback: heal first living hero
        for (var i = 0; i < state.run.heroes.length; i++) {
          if (state.run.heroes[i] && state.run.heroes[i].hp > 0) {
            killer = state.run.heroes[i];
            break;
          }
        }
      }
      if (killer && killer.maxHp) {
        killer.hp = Math.min((killer.hp || 0) + 3, killer.maxHp);
      }
    }
  },

  // ============================================================
  // RARE RELICS
  // ============================================================

  {
    id: 'crown_of_thorns',
    name: 'Crown of Thorns',
    desc: 'When a hero takes damage, deal 2 damage back to the attacker.',
    rarity: 'rare',
    icon: '\uD83D\uDC51',
    onDamageTaken: function(state, hero, amount) {
      if (!state || !state.combat) return;
      // Reflect 2 damage to the attacking enemy
      var attacker = state.combat._lastAttackingEnemy || null;
      if (attacker && attacker.hp > 0 && DS.Combat && DS.Combat.dealDamage) {
        DS.Combat.dealDamage(attacker, 2);
      }
    }
  },

  {
    id: 'philosophers_stone',
    name: "Philosopher's Stone",
    desc: '+1 max energy each turn. Enemies deal +1 damage.',
    rarity: 'rare',
    icon: '\uD83D\uDD2E',
    energyBonus: 1,
    enemyDamageBonus: 1
  },

  {
    id: 'time_crystal',
    name: 'Time Crystal',
    desc: 'On turn 1 of each combat, take 2 turns before enemies act.',
    rarity: 'rare',
    icon: '\u23F3',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._timeCrystalActive = true;
    },
    onTurnStart: function(state) {
      if (!state || !state.run) return;
      // Engine reads _timeCrystalActive on turn 1 to grant an extra player turn
      // After turn 1 completes, engine sets this to false
    },
    // Flag for engine: grant extra turn on first round
    extraFirstTurn: true
  },

  {
    id: 'soul_jar',
    name: 'Soul Jar',
    desc: "Dead heroes' cards can still be played at 50% effectiveness.",
    rarity: 'rare',
    icon: '\uD83C\uDFFA',
    // Engine checks this relic: if a hero has hp <= 0 but soul_jar exists,
    // their cards remain playable with halved values
    deadHeroCards: true,
    effectivenessMultiplier: 0.5
  },

  {
    id: 'dragons_heart',
    name: "Dragon's Heart",
    desc: 'Block persists between turns, decaying by 1 instead of resetting.',
    rarity: 'rare',
    icon: '\uD83D\uDC09',
    // Engine checks this relic to change block behavior:
    // - Damage passes through block (block is not consumed)
    // - Block decreases by 1 at end of each turn instead
    // combat.js handles the decay logic
    persistentBlock: true
  },

  // --- NEW RELICS ---

  {
    id: 'war_drum',
    name: 'War Drum',
    desc: 'At start of combat, all heroes gain 2 Strength.',
    rarity: 'uncommon',
    icon: '\uD83E\uDD41',
    onCombatStart: function(state) {
      if (!state || !state.run || !state.run.heroes) return;
      state.run.heroes.forEach(function(h) {
        if (h && h.hp > 0) {
          h.strength = (h.strength || 0) + 2;
        }
      });
    }
  },

  {
    id: 'blood_pendant',
    name: 'Blood Pendant',
    desc: 'When you play a card that costs 2+, heal the caster 2 HP.',
    rarity: 'uncommon',
    icon: '\uD83D\uDC8E',
    onCardPlayed: function(state, card) {
      if (!state || !state.run || !card || card.cost < 2) return;
      var hero = state.run.heroes[card.heroIdx];
      if (hero && hero.hp > 0 && hero.maxHp) {
        hero.hp = Math.min(hero.hp + 2, hero.maxHp);
      }
    }
  },

  {
    id: 'mirror_shard',
    name: 'Mirror Shard',
    desc: 'First card each turn is duplicated (played twice). Exhaust after 3 uses.',
    rarity: 'rare',
    icon: '\uD83E\uDE9E',
    onCombatStart: function(state) {
      if (!state || !state.run) return;
      state.run._mirrorUses = 0;
      state.run._mirrorUsedThisTurn = false;
    },
    onTurnStart: function(state) {
      if (!state || !state.run) return;
      state.run._mirrorUsedThisTurn = false;
    },
    onCardPlayed: function(state, card) {
      if (!state || !state.run) return;
      if (state.run._mirrorUsedThisTurn) return;
      if (state.run._mirrorUses >= 3) return;
      state.run._mirrorUsedThisTurn = true;
      state.run._mirrorUses++;
      // Re-execute the card effect
      var hero = state.run.heroes[card.heroIdx];
      if (hero && card.effect) {
        card.effect(state, hero, null, card);
      }
    }
  },

  {
    id: 'frost_amulet',
    name: 'Frost Amulet',
    desc: 'Enemies start combat with 1 Weak.',
    rarity: 'common',
    icon: '\u2744\uFE0F',
    onCombatStart: function(state) {
      if (!state || !state.combat || !state.combat.enemies) return;
      state.combat.enemies.forEach(function(e) {
        if (e && e.hp > 0) e.weak = (e.weak || 0) + 1;
      });
    }
  },

  {
    id: 'battle_standard',
    name: 'Battle Standard',
    desc: '+1 card drawn each turn.',
    rarity: 'rare',
    icon: '\uD83D\uDEA9',
    onTurnStart: function(state) {
      if (DS.Combat && DS.Combat.drawCard) {
        DS.Combat.drawCard();
      }
    }
  },

  {
    id: 'thieves_gloves',
    name: "Thieves' Gloves",
    desc: 'Gain 25% more gold. Shops cost 10% less.',
    rarity: 'common',
    icon: '\uD83E\uDDE4',
    goldMultiplier: 1.25
  }

];

// Helper: get relics by rarity
DS.Relics.byRarity = function(rarity) {
  return DS.Relics.filter(function(r) { return r.rarity === rarity; });
};

// Helper: pick a random relic not already owned
DS.Relics.pickRandom = function(ownedIds) {
  ownedIds = ownedIds || [];
  var available = DS.Relics.filter(function(r) {
    return typeof r === 'object' && r.id && ownedIds.indexOf(r.id) === -1;
  });
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

// Helper: check if run has a specific relic
DS.Relics.hasRelic = function(state, relicId) {
  if (!state || !state.run || !state.run.relics) return false;
  return state.run.relics.some(function(r) { return r.id === relicId; });
};

// Helper: fire a hook on all owned relics
DS.Relics.fireHook = function(state, hookName, args) {
  if (!state || !state.run || !state.run.relics) return [];
  var results = [];
  state.run.relics.forEach(function(r) {
    if (r && typeof r[hookName] === 'function') {
      var result = r[hookName].apply(r, [state].concat(args || []));
      if (result) results.push(result);
    }
  });
  return results;
};
