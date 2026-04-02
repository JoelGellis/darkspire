window.DS = window.DS || {};

// ============================================================
// NECROMANCER CARDS — Dark support. Life drain. Poison amplifier.
// ============================================================

DS.Cards.necromancer = [
  // --- Starting cards (indices 0-3) ---
  {
    id: 'necromancer_life_drain',
    name: 'Life Drain',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [3, 4],
    desc: 'Deal 4 damage. Heal self 3.',
    value: 4,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 3);
    }
  },
  {
    id: 'necromancer_shadow_bolt',
    name: 'Shadow Bolt',
    cost: 1,
    type: 'attack',
    target: 'enemy_any',
    prefPos: [3, 4],
    desc: 'Deal 6 damage. Hits any enemy.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
    }
  },
  {
    id: 'necromancer_bone_shield',
    name: 'Bone Shield',
    cost: 1,
    type: 'block',
    target: 'self',
    prefPos: [3, 4],
    desc: 'Gain 5 Block.',
    value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
    }
  },
  {
    id: 'necromancer_hex',
    name: 'Hex',
    cost: 1,
    type: 'utility',
    target: 'enemy',
    prefPos: [3, 4],
    desc: 'Apply 2 Weak.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.Combat.applyWeak(target, card.value);
    }
  },
  // --- Reward-only cards (indices 4-11) ---
  {
    id: 'necromancer_plague_spread',
    name: 'Plague Spread',
    cost: 1,
    type: 'utility',
    target: 'enemy',
    prefPos: [3, 4],
    desc: 'If Poisoned, double it. Otherwise apply 3 Poison.',
    value: 3,
    effect: function(state, hero, target, card) {
      if (target.poison > 0) {
        var doubled = target.poison;
        DS.Combat.applyPoison(target, doubled);
        DS.Combat.logMsg(target.name + '\'s Poison doubled!', 'poison-log');
      } else {
        DS.Combat.applyPoison(target, card.value);
      }
    }
  },
  {
    id: 'necromancer_soul_siphon',
    name: 'Soul Siphon',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [3, 4],
    desc: 'Deal 6 damage. Heal lowest-HP ally 6.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      var alive = DS.State.run.heroes.filter(function(h) { return h.hp > 0; });
      if (alive.length > 0) {
        var lowest = alive.reduce(function(a, b) { return a.hp < b.hp ? a : b; });
        DS.Combat.healTarget(lowest, card.value);
      }
    }
  },
  {
    id: 'necromancer_corpse_explosion',
    name: 'Corpse Explosion',
    cost: 1,
    type: 'attack',
    target: 'all_enemies',
    prefPos: [4],
    desc: 'Deal 2 x dead enemy count to all alive enemies. Pos 4 only.',
    value: 2,
    effect: function(state, hero, target, card) {
      var deadCount = DS.State.combat.enemies.filter(function(e) { return e.hp <= 0; }).length;
      if (deadCount === 0) {
        DS.Combat.logMsg('No corpses to explode!', 'system');
        return;
      }
      var dmg = card.value * deadCount;
      DS.Combat.logMsg('Corpses explode for ' + dmg + ' damage!', 'damage');
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, dmg);
      });
    }
  },
  {
    id: 'necromancer_dark_pact',
    name: 'Dark Pact',
    cost: 0,
    type: 'draw',
    target: 'none',
    prefPos: [3, 4],
    desc: 'Lose 5 HP. Draw 3 cards. Exhaust.',
    value: 3,
    effect: function(state, hero, target, card) {
      hero.hp = Math.max(1, hero.hp - 5);
      DS.Combat.floatText(hero, '-5', 'damage');
      for (var i = 0; i < card.value; i++) DS.Combat.drawCard();
      card._exhaust = true;
    }
  },
  {
    id: 'necromancer_mass_curse',
    name: 'Mass Curse',
    cost: 2,
    type: 'utility',
    target: 'all_enemies',
    prefPos: [4],
    desc: 'All enemies: 2 Weak + 1 Vulnerable. Pos 4 only.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.applyWeak(e, card.value);
        DS.Combat.applyVulnerable(e, 1);
      });
    }
  },
  {
    id: 'necromancer_death_coil',
    name: 'Death Coil',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [3, 4],
    desc: 'Deal 12 damage. Heal self 4.',
    value: 12,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 4);
    }
  },
  {
    id: 'necromancer_blight',
    name: 'Blight',
    cost: 1,
    type: 'utility',
    target: 'all_enemies',
    prefPos: [3, 4],
    desc: 'Apply 2 Poison to ALL enemies.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.applyPoison(e, card.value);
      });
    }
  },
  {
    id: 'necromancer_raise_shade',
    name: 'Raise Shade',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [4],
    desc: 'Deal 10 damage + 3 Poison. Exhaust. Pos 4 only.',
    value: 10,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyPoison(target, 3);
      card._exhaust = true;
    }
  }
];

// ============================================================
// PALADIN CARDS — Off-tank/support hybrid. Pos 1 devotion bonus.
// ============================================================

DS.Cards.paladin = [
  // --- Starting cards (indices 0-3) ---
  {
    id: 'paladin_holy_strike',
    name: 'Holy Strike',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Deal 5 damage. Gain 3 Block.',
    value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.gainBlock(hero, 3);
    }
  },
  {
    id: 'paladin_shield_of_faith',
    name: 'Shield of Faith',
    cost: 1,
    type: 'block',
    target: 'ally',
    prefPos: [1, 2, 3],
    desc: 'Give ally 7 Block.',
    value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(target, card.value);
    }
  },
  {
    id: 'paladin_lay_on_hands',
    name: 'Lay on Hands',
    cost: 1,
    type: 'heal',
    target: 'ally',
    prefPos: [1, 2, 3],
    desc: 'Heal ally 6 HP.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.healTarget(target, card.value);
    }
  },
  {
    id: 'paladin_righteous_blow',
    name: 'Righteous Blow',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Deal 8 damage.',
    value: 8,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
    }
  },
  // --- Reward-only cards (indices 4-11) ---
  {
    id: 'paladin_divine_smite',
    name: 'Divine Smite',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [1],
    desc: 'Deal 12 damage. Apply 2 Vulnerable. Pos 1 only.',
    value: 12,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyVulnerable(target, 2);
    }
  },
  {
    id: 'paladin_consecrate',
    name: 'Consecrate',
    cost: 2,
    type: 'attack',
    target: 'all_enemies',
    prefPos: [1, 2],
    desc: 'Deal 4 to all enemies. All allies gain 3 Block.',
    value: 4,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.gainBlock(h, 3);
      });
    }
  },
  {
    id: 'paladin_guardian_stance',
    name: 'Guardian Stance',
    cost: 2,
    type: 'block',
    target: 'self',
    prefPos: [1],
    desc: 'Gain 14 Block. Taunt all enemies. Pos 1 only.',
    value: 14,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        e.taunted = hero.id;
      });
      DS.Combat.logMsg(hero.name + ' taunts all enemies!', 'stun-log');
    }
  },
  {
    id: 'paladin_holy_avenger',
    name: 'Holy Avenger',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Deal damage equal to your Block. Exhaust.',
    value: 0,
    effect: function(state, hero, target, card) {
      var dmg = hero.block || 0;
      if (dmg > 0) {
        DS.Combat.dealDamage(target, dmg);
      } else {
        DS.Combat.logMsg('No Block to convert!', 'system');
      }
      card._exhaust = true;
    }
  },
  {
    id: 'paladin_aura_of_protection',
    name: 'Aura of Protection',
    cost: 1,
    type: 'block',
    target: 'all_allies',
    prefPos: [1, 2],
    desc: 'All allies gain 4 Block.',
    value: 4,
    effect: function(state, hero, target, card) {
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.gainBlock(h, card.value);
      });
    }
  },
  {
    id: 'paladin_retribution',
    name: 'Retribution',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Deal 6 damage. Pos 1: also gain 4 Block.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (hero.pos === 1) {
        DS.Combat.gainBlock(hero, 4);
      }
    }
  },
  {
    id: 'paladin_sacred_oath',
    name: 'Sacred Oath',
    cost: 1,
    type: 'utility',
    target: 'none',
    prefPos: [1, 2],
    desc: 'Gain 2 Strength + 5 Block. Exhaust.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.Combat.applyStrength(hero, card.value);
      DS.Combat.gainBlock(hero, 5);
      card._exhaust = true;
    }
  },
  {
    id: 'paladin_crusader_strike',
    name: 'Crusader Strike',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [1],
    desc: 'Deal 10 damage. Heal self 5. Pos 1 only.',
    value: 10,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 5);
    }
  }
];

// ============================================================
// HERO DEFINITIONS
// ============================================================

DS.Heroes.push({
  name: 'Necromancer',
  cls: 'necromancer',
  maxHp: 30,
  startPos: 4,
  colors: { primary: '#8844aa', secondary: '#1a0a2a', accent: '#aa66cc' },
  sprite: {
    body: 'robes',
    head: 'skull-hood',
    details: ['skull-staff'],
    bodyColor: '#1a0a2a',
    armorColor: '#8844aa',
    accentColor: '#aa66cc'
  }
});

DS.Heroes.push({
  name: 'Paladin',
  cls: 'paladin',
  maxHp: 46,
  startPos: 1,
  colors: { primary: '#ddcc44', secondary: '#f0e8d0', accent: '#ffee88' },
  sprite: {
    body: 'heavy',
    head: 'helm-cross',
    details: ['mace-right', 'shield-left'],
    bodyColor: '#f0e8d0',
    armorColor: '#ddcc44',
    accentColor: '#ffee88'
  }
});
