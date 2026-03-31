window.DS = window.DS || {};

DS.Enemies = {
  normal: [
    // Pool 1: Skeleton Patrol (the original fight)
    [
      {
        name: 'Bone Soldier', icon: '\uD83D\uDC80', maxHp: 22, pos: 1,
        intents: [
          { name: 'Attack', type: 'attack', dmg: 8, desc: 'ATK 8', targeting: 'front' },
          { name: 'Defend', type: 'defend', block: 6, desc: 'DEF 6' }
        ]
      },
      {
        name: 'Bone Captain', icon: '\u2694\uFE0F', maxHp: 28, pos: 2,
        intents: [
          { name: 'Attack', type: 'attack', dmg: 10, desc: 'ATK 10', targeting: 'front' },
          { name: 'War Cry', type: 'buff', desc: 'WAR CRY +3', buffAmt: 3 }
        ]
      },
      {
        name: 'Bone Archer', icon: '\uD83C\uDFF9', maxHp: 16, pos: 3,
        intents: [
          { name: 'Snipe', type: 'attack', dmg: 6, desc: 'ATK 6\u2192back', targeting: 'back' },
          { name: 'Multi-shot', type: 'attack_multi', dmg: 2, hits: 3, desc: 'ATK 2\u00D73', targeting: 'random' }
        ]
      }
    ],

    // Pool 2: Goblin Ambush
    [
      {
        name: 'Goblin Raider', icon: '\uD83D\uDC7A', maxHp: 12, pos: 1,
        intents: [
          { name: 'Stab', type: 'attack', dmg: 5, desc: 'ATK 5', targeting: 'front' },
          { name: 'Slash', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'front' }
        ]
      },
      {
        name: 'Goblin Raider', icon: '\uD83D\uDC7A', maxHp: 12, pos: 2,
        intents: [
          { name: 'Stab', type: 'attack', dmg: 5, desc: 'ATK 5', targeting: 'front' },
          { name: 'Defend', type: 'defend', block: 4, desc: 'DEF 4' }
        ]
      },
      {
        name: 'Goblin Poisoner', icon: '\uD83D\uDDE1\uFE0F', maxHp: 12, pos: 3,
        intents: [
          { name: 'Poison Dagger', type: 'attack_poison', dmg: 3, poison: 2, desc: 'ATK 3 + PSN 2', targeting: 'front' },
          { name: 'Throw Vial', type: 'poison', poison: 3, desc: 'PSN 3\u2192random', targeting: 'random' }
        ]
      }
    ],

    // Pool 3: Dark Cult
    [
      {
        name: 'Dark Cultist', icon: '\uD83D\uDD2E', maxHp: 20, pos: 2,
        intents: [
          { name: 'Dark Bolt', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'random' },
          { name: 'Heal Allies', type: 'heal_allies', heal: 5, desc: 'HEAL ALL 5' }
        ]
      },
      {
        name: 'Cultist Acolyte', icon: '\uD83D\uDC7B', maxHp: 14, pos: 1,
        intents: [
          { name: 'Strike', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'front' },
          { name: 'Defend', type: 'defend', block: 5, desc: 'DEF 5' }
        ]
      },
      {
        name: 'Cultist Acolyte', icon: '\uD83D\uDC7B', maxHp: 14, pos: 3,
        intents: [
          { name: 'Strike', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'front' },
          { name: 'Dark Prayer', type: 'buff', desc: 'BUFF +2', buffAmt: 2 }
        ]
      }
    ],

    // Pool 4: Slime Nest
    [
      {
        name: 'Slime Mother', icon: '\uD83E\uDDA0', maxHp: 35, pos: 2,
        intents: [
          { name: 'Acid Spray', type: 'attack_all', dmg: 4, desc: 'ATK 4 ALL', targeting: 'all' },
          { name: 'Absorb', type: 'defend', block: 8, desc: 'DEF 8' }
        ]
      },
      {
        name: 'Slimeling', icon: '\uD83D\uDCA7', maxHp: 8, pos: 1,
        deathEffect: 'poison_random_2',
        intents: [
          { name: 'Slap', type: 'attack', dmg: 3, desc: 'ATK 3', targeting: 'front' },
          { name: 'Ooze', type: 'attack_poison', dmg: 2, poison: 1, desc: 'ATK 2 + PSN 1', targeting: 'front' }
        ]
      },
      {
        name: 'Slimeling', icon: '\uD83D\uDCA7', maxHp: 8, pos: 3,
        deathEffect: 'poison_random_2',
        intents: [
          { name: 'Slap', type: 'attack', dmg: 3, desc: 'ATK 3', targeting: 'random' },
          { name: 'Ooze', type: 'attack_poison', dmg: 2, poison: 1, desc: 'ATK 2 + PSN 1', targeting: 'random' }
        ]
      }
    ],

    // Pool 5: Fungal Colony
    [
      {
        name: 'Fungal Brute', icon: '\uD83C\uDF44', maxHp: 28, pos: 1,
        intents: [
          { name: 'Slam', type: 'attack', dmg: 9, desc: 'ATK 9', targeting: 'front' },
          { name: 'Harden', type: 'defend', block: 7, desc: 'DEF 7' }
        ]
      },
      {
        name: 'Spore Sprayer', icon: '\uD83D\uDCA8', maxHp: 18, pos: 2,
        intents: [
          { name: 'Spore Cloud', type: 'poison', poison: 3, desc: 'PSN 3\u2192random', targeting: 'random' },
          { name: 'Burst', type: 'attack_all', dmg: 3, desc: 'ATK 3 ALL', targeting: 'all' }
        ]
      },
      {
        name: 'Mushroom Cap', icon: '\uD83C\uDF41', maxHp: 10, pos: 3,
        intents: [
          { name: 'Regenerate', type: 'heal_allies', heal: 4, desc: 'HEAL ALL 4' },
          { name: 'Toxic Bite', type: 'attack_poison', dmg: 4, poison: 2, desc: 'ATK 4 + PSN 2', targeting: 'front' }
        ]
      }
    ],

    // Pool 6: Shadow Pack
    [
      {
        name: 'Shadow Wolf', icon: '\uD83D\uDC3A', maxHp: 20, pos: 1,
        intents: [
          { name: 'Frenzy', type: 'attack_multi', dmg: 3, hits: 2, desc: 'ATK 3\u00D72', targeting: 'random' },
          { name: 'Bite', type: 'attack', dmg: 7, desc: 'ATK 7', targeting: 'front' }
        ]
      },
      {
        name: 'Shadow Wolf', icon: '\uD83D\uDC3A', maxHp: 20, pos: 2,
        intents: [
          { name: 'Lunge', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'random' },
          { name: 'Bite', type: 'attack', dmg: 7, desc: 'ATK 7', targeting: 'front' }
        ]
      },
      {
        name: 'Shadow Alpha', icon: '\uD83D\uDC3A', maxHp: 30, pos: 3,
        intents: [
          { name: 'Howl', type: 'buff', desc: 'BUFF +2', buffAmt: 2 },
          { name: 'Shadow Strike', type: 'attack_all', dmg: 5, desc: 'ATK 5 ALL', targeting: 'all' }
        ]
      }
    ]
  ],

  elite: [
    // Pool 1: Bone Knight + Bone Mage
    [
      {
        name: 'Bone Knight', icon: '\uD83D\uDC80', maxHp: 45, pos: 1,
        intents: [
          { name: 'Cleave', type: 'attack', dmg: 12, desc: 'ATK 12', targeting: 'front' },
          { name: 'Shield Wall', type: 'defend', block: 8, desc: 'DEF 8' }
        ]
      },
      {
        name: 'Bone Mage', icon: '\u2620\uFE0F', maxHp: 25, pos: 3,
        intents: [
          { name: 'Dark Wave', type: 'attack_all', dmg: 3, desc: 'ATK 3 ALL', targeting: 'all' },
          { name: 'Empower', type: 'buff', desc: 'BUFF +5', buffAmt: 5 }
        ]
      }
    ],

    // Pool 2: Bandit King + Thugs
    [
      {
        name: 'Bandit King', icon: '\uD83D\uDC51', maxHp: 50, pos: 2,
        intents: [
          { name: 'Heavy Strike', type: 'attack', dmg: 8, desc: 'ATK 8', targeting: 'front' },
          { name: 'Rally', type: 'buff', desc: 'RALLY +3', buffAmt: 3 },
          { name: 'Execute', type: 'attack', dmg: 14, desc: 'ATK 14', targeting: 'front' }
        ]
      },
      {
        name: 'Bandit Thug', icon: '\uD83D\uDDE1\uFE0F', maxHp: 18, pos: 1,
        intents: [
          { name: 'Slash', type: 'attack', dmg: 7, desc: 'ATK 7', targeting: 'front' },
          { name: 'Guard', type: 'defend', block: 5, desc: 'DEF 5' }
        ]
      },
      {
        name: 'Bandit Thug', icon: '\uD83D\uDDE1\uFE0F', maxHp: 18, pos: 3,
        intents: [
          { name: 'Slash', type: 'attack', dmg: 7, desc: 'ATK 7', targeting: 'random' },
          { name: 'Guard', type: 'defend', block: 5, desc: 'DEF 5' }
        ]
      }
    ],

    // Pool 3: Wraith Council
    [
      {
        name: 'Wraith Lord', icon: '\uD83D\uDC7B', maxHp: 40, pos: 2,
        intents: [
          { name: 'Life Drain', type: 'attack', dmg: 10, desc: 'ATK 10\u2192back', targeting: 'back' },
          { name: 'Shadow Veil', type: 'defend', block: 10, desc: 'DEF 10' },
          { name: 'Soul Rend', type: 'attack_all', dmg: 5, desc: 'ATK 5 ALL', targeting: 'all' }
        ]
      },
      {
        name: 'Wraith', icon: '\uD83D\uDC7B', maxHp: 22, pos: 1,
        intents: [
          { name: 'Chilling Touch', type: 'attack_poison', dmg: 5, poison: 2, desc: 'ATK 5 + PSN 2', targeting: 'front' },
          { name: 'Phase', type: 'defend', block: 6, desc: 'DEF 6' }
        ]
      },
      {
        name: 'Wraith', icon: '\uD83D\uDC7B', maxHp: 22, pos: 3,
        intents: [
          { name: 'Chilling Touch', type: 'attack_poison', dmg: 5, poison: 2, desc: 'ATK 5 + PSN 2', targeting: 'random' },
          { name: 'Wail', type: 'buff', desc: 'BUFF +3', buffAmt: 3 }
        ]
      }
    ]
  ],

  boss: [
    // Boss 1: The Lich
    [
      {
        name: 'The Lich', icon: '\uD83D\uDC80', maxHp: 80, pos: 2, isBoss: true,
        intents: [
          { name: 'Soul Drain', type: 'attack_all', dmg: 10, desc: 'ATK 10 ALL', targeting: 'all' },
          { name: 'Dark Bolt', type: 'attack', dmg: 15, desc: 'ATK 15\u2192back', targeting: 'back' },
          { name: 'Raise Dead', type: 'summon', summon: 'skeleton_guard', count: 2, desc: 'SUMMON 2' },
          { name: 'Dark Shield', type: 'defend', block: 10, desc: 'DEF 10' }
        ]
      },
      {
        name: 'Skeleton Guard', icon: '\uD83D\uDC80', maxHp: 15, pos: 1,
        intents: [
          { name: 'Strike', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'front' },
          { name: 'Block', type: 'defend', block: 4, desc: 'DEF 4' }
        ]
      },
      {
        name: 'Skeleton Guard', icon: '\uD83D\uDC80', maxHp: 15, pos: 3,
        intents: [
          { name: 'Strike', type: 'attack', dmg: 6, desc: 'ATK 6', targeting: 'random' },
          { name: 'Block', type: 'defend', block: 4, desc: 'DEF 4' }
        ]
      }
    ],

    // Boss 2: Ancient Dragon — single massive enemy, hits hard
    [
      {
        name: 'Ancient Dragon', icon: '\uD83D\uDC09', maxHp: 110, pos: 2, isBoss: true,
        intents: [
          { name: 'Fire Breath', type: 'attack_all', dmg: 8, desc: 'ATK 8 ALL', targeting: 'all' },
          { name: 'Tail Sweep', type: 'attack', dmg: 18, desc: 'ATK 18', targeting: 'front' },
          { name: 'Dragon Scales', type: 'defend', block: 15, desc: 'DEF 15' },
          { name: 'Inferno', type: 'attack_all', dmg: 12, desc: 'ATK 12 ALL', targeting: 'all' },
          { name: 'Bite', type: 'attack', dmg: 14, desc: 'ATK 14\u2192random', targeting: 'random' }
        ]
      }
    ],

    // Boss 3: Plague Mother — poison-heavy with summons
    [
      {
        name: 'Plague Mother', icon: '\uD83E\uDDA0', maxHp: 75, pos: 2, isBoss: true,
        intents: [
          { name: 'Plague Cloud', type: 'attack_poison', dmg: 5, poison: 3, desc: 'ATK 5 + PSN 3', targeting: 'front' },
          { name: 'Devour', type: 'attack', dmg: 16, desc: 'ATK 16', targeting: 'front' },
          { name: 'Absorb', type: 'defend', block: 12, desc: 'DEF 12' },
          { name: 'Spawn', type: 'summon', summon: 'plague_spawn', count: 2, desc: 'SUMMON 2' },
          { name: 'Toxic Eruption', type: 'attack_all', dmg: 6, desc: 'ATK 6 ALL', targeting: 'all' }
        ]
      },
      {
        name: 'Plague Spawn', icon: '\uD83D\uDCA7', maxHp: 12, pos: 1,
        deathEffect: 'poison_random_2',
        intents: [
          { name: 'Spit', type: 'attack_poison', dmg: 3, poison: 2, desc: 'ATK 3 + PSN 2', targeting: 'random' },
          { name: 'Ooze', type: 'poison', poison: 2, desc: 'PSN 2\u2192random', targeting: 'random' }
        ]
      },
      {
        name: 'Plague Spawn', icon: '\uD83D\uDCA7', maxHp: 12, pos: 3,
        deathEffect: 'poison_random_2',
        intents: [
          { name: 'Spit', type: 'attack_poison', dmg: 3, poison: 2, desc: 'ATK 3 + PSN 2', targeting: 'front' },
          { name: 'Ooze', type: 'poison', poison: 2, desc: 'PSN 2\u2192random', targeting: 'random' }
        ]
      }
    ]
  ]
};

// Helper: pick a random encounter from a tier
DS.Enemies.pickEncounter = function(tier) {
  var pools = DS.Enemies[tier];
  if (!pools || pools.length === 0) return DS.Enemies.normal[0];
  return pools[Math.floor(Math.random() * pools.length)];
};

// Scale enemy stats by floor
DS.Enemies.scaleEncounter = function(pool, floor) {
  if (floor <= 1) return pool;
  var factor = 1 + (floor - 1) * 0.1;
  return pool.map(function(def) {
    var scaled = {};
    for (var k in def) scaled[k] = def[k];
    scaled.maxHp = Math.floor(def.maxHp * factor);
    scaled.intents = def.intents.map(function(i) {
      var si = {};
      for (var j in i) si[j] = i[j];
      if (si.dmg) si.dmg = Math.floor(si.dmg * factor);
      if (si.block) si.block = Math.floor(si.block * factor);
      if (si.heal) si.heal = Math.floor(si.heal * factor);
      return si;
    });
    return scaled;
  });
};
