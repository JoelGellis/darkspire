window.DS = window.DS || {};

// ============================================================
// BARBARIAN CARDS — Berserker. Self-damage for big numbers.
// Stronger below 50% HP.
// ============================================================

DS.Cards.barbarian = [
  // --- Starting cards (indices 0-3) ---
  {
    id: 'barbarian_savage_strike',
    name: 'Savage Strike',
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
  {
    id: 'barbarian_tough_skin',
    name: 'Tough Skin',
    cost: 1,
    type: 'block',
    target: 'self',
    prefPos: [1, 2, 3],
    desc: 'Gain 6 Block.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
    }
  },
  {
    id: 'barbarian_reckless_charge',
    name: 'Reckless Charge',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1],
    desc: 'Deal 12 damage. Take 3 damage. Pos 1 only.',
    value: 12,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      hero.hp = Math.max(1, hero.hp - 3);
      DS.Combat.floatText(hero, '-3', 'damage');
    }
  },
  {
    id: 'barbarian_blood_rage',
    name: 'Blood Rage',
    cost: 1,
    type: 'utility',
    target: 'none',
    prefPos: [1, 2],
    desc: 'Gain 2 Strength. Lose 4 HP. Exhaust.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.Combat.applyStrength(hero, card.value);
      hero.hp = Math.max(1, hero.hp - 4);
      DS.Combat.floatText(hero, '-4', 'damage');
      card._exhaust = true;
    }
  },
  // --- Reward-only cards (indices 4-11) ---
  {
    id: 'barbarian_rampage',
    name: 'Rampage',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Deal 6 damage. Double if below 50% HP.',
    value: 6,
    effect: function(state, hero, target, card) {
      var dmg = card.value;
      if (hero.hp < hero.maxHp * 0.5) dmg = card.value * 2;
      DS.Combat.dealDamage(target, dmg);
    }
  },
  {
    id: 'barbarian_bloodlust',
    name: 'Bloodlust',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [1],
    desc: 'Deal 10 damage. If kill, heal 5. Pos 1 only.',
    value: 10,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (target.hp <= 0) {
        DS.Combat.healTarget(hero, 5);
      }
    }
  },
  {
    id: 'barbarian_whirlwind_axe',
    name: 'Whirlwind Axe',
    cost: 2,
    type: 'attack',
    target: 'all_enemies',
    prefPos: [1],
    desc: 'Deal 7 damage to ALL enemies. Pos 1 only.',
    value: 7,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
    }
  },
  {
    id: 'barbarian_berserker_roar',
    name: 'Berserker Roar',
    cost: 1,
    type: 'utility',
    target: 'none',
    prefPos: [1, 2],
    desc: 'All enemies gain 2 Vulnerable. Gain 1 Strength.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.applyVulnerable(e, card.value);
      });
      DS.Combat.applyStrength(hero, 1);
    }
  },
  {
    id: 'barbarian_pain_threshold',
    name: 'Pain Threshold',
    cost: 1,
    type: 'block',
    target: 'self',
    prefPos: [1, 2, 3],
    desc: 'Gain Block = missing HP (max 15).',
    value: 15,
    effect: function(state, hero, target, card) {
      var missing = hero.maxHp - hero.hp;
      var amt = Math.min(missing, card.value);
      DS.Combat.gainBlock(hero, amt);
    }
  },
  {
    id: 'barbarian_undying_rage',
    name: 'Undying Rage',
    cost: 2,
    type: 'utility',
    target: 'none',
    prefPos: [1, 2],
    desc: 'Set HP to 1. Gain 6 Strength. Exhaust.',
    value: 6,
    effect: function(state, hero, target, card) {
      hero.hp = 1;
      DS.Combat.floatText(hero, '1 HP', 'damage');
      DS.Combat.applyStrength(hero, card.value);
      card._exhaust = true;
    }
  },
  {
    id: 'barbarian_headbutt',
    name: 'Headbutt',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1],
    desc: 'Deal 7 damage. 30% stun. Pos 1 only.',
    value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (target.hp > 0 && Math.random() < 0.30) {
        target.stunned = true;
        DS.Combat.logMsg(target.name + ' is stunned!', 'stun-log');
      }
    }
  },
  {
    id: 'barbarian_frenzy',
    name: 'Frenzy',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [1, 2],
    desc: 'Strike 4 times for 2 damage. +1 each if below 50% HP.',
    value: 2,
    effect: function(state, hero, target, card) {
      var bonus = (hero.hp < hero.maxHp * 0.5) ? 1 : 0;
      for (var i = 0; i < 4; i++) {
        if (target.hp <= 0) break;
        DS.Combat.dealDamage(target, card.value + bonus);
      }
    }
  }
];

// ============================================================
// RANGER CARDS — Flexible ranged DPS. Mark mechanic.
// ============================================================

DS.Cards.ranger = [
  // --- Starting cards (indices 0-3) ---
  {
    id: 'ranger_quick_shot',
    name: 'Quick Shot',
    cost: 1,
    type: 'attack',
    target: 'enemy_any',
    prefPos: [1, 2, 3],
    desc: 'Deal 6 damage. Hits any enemy.',
    value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
    }
  },
  {
    id: 'ranger_dodge_roll',
    name: 'Dodge Roll',
    cost: 1,
    type: 'block',
    target: 'self',
    prefPos: [1, 2, 3, 4],
    desc: 'Gain 5 Block.',
    value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
    }
  },
  {
    id: 'ranger_aimed_shot',
    name: 'Aimed Shot',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [2, 3, 4],
    desc: 'Deal 9 damage.',
    value: 9,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
    }
  },
  {
    id: 'ranger_snare_trap',
    name: 'Snare Trap',
    cost: 1,
    type: 'utility',
    target: 'enemy',
    prefPos: [2, 3, 4],
    desc: 'Apply 2 Weak + 2 Vulnerable.',
    value: 2,
    effect: function(state, hero, target, card) {
      DS.Combat.applyWeak(target, card.value);
      DS.Combat.applyVulnerable(target, card.value);
    }
  },
  // --- Reward-only cards (indices 4-11) ---
  {
    id: 'ranger_mark_prey',
    name: 'Mark Prey',
    cost: 0,
    type: 'utility',
    target: 'enemy',
    prefPos: [1, 2, 3, 4],
    desc: 'Mark target. Next hit deals +3 bonus damage.',
    value: 3,
    effect: function(state, hero, target, card) {
      target._marked = true;
      target._markBonus = card.value;
      DS.Combat.logMsg(target.name + ' is Marked!', 'stun-log');
      DS.Combat.floatText(target, 'MARKED', 'damage');
    }
  },
  {
    id: 'ranger_volley',
    name: 'Volley',
    cost: 2,
    type: 'attack',
    target: 'all_enemies',
    prefPos: [3, 4],
    desc: 'Deal 4 damage to ALL enemies.',
    value: 4,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
    }
  },
  {
    id: 'ranger_poison_arrow',
    name: 'Poison Arrow',
    cost: 1,
    type: 'attack',
    target: 'enemy_any',
    prefPos: [2, 3, 4],
    desc: 'Deal 3 damage + 3 Poison.',
    value: 3,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyPoison(target, 3);
    }
  },
  {
    id: 'ranger_called_shot',
    name: 'Called Shot',
    cost: 2,
    type: 'attack',
    target: 'enemy',
    prefPos: [2, 3],
    desc: 'Deal 14 damage. If Marked, deal +6 and clear Mark.',
    value: 14,
    effect: function(state, hero, target, card) {
      var dmg = card.value;
      if (target._marked) {
        dmg = card.value + 6;
        target._marked = false;
        target._markBonus = 0;
        DS.Combat.logMsg('Mark consumed! Bonus damage!', 'damage');
      }
      DS.Combat.dealDamage(target, dmg);
    }
  },
  {
    id: 'ranger_multi_shot',
    name: 'Multi-Shot',
    cost: 1,
    type: 'attack',
    target: 'enemy',
    prefPos: [2, 3, 4],
    desc: 'Hit 3 random enemies for 3 damage each.',
    value: 3,
    effect: function(state, hero, target, card) {
      for (var i = 0; i < 3; i++) {
        var alive = DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
        if (alive.length === 0) break;
        var pick = alive[Math.floor(Math.random() * alive.length)];
        DS.Combat.dealDamage(pick, card.value);
      }
    }
  },
  {
    id: 'ranger_camouflage',
    name: 'Camouflage',
    cost: 1,
    type: 'block',
    target: 'self',
    prefPos: [1, 2, 3, 4],
    desc: 'Gain 8 Block. Draw 1 card.',
    value: 8,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
      DS.Combat.drawCard();
    }
  },
  {
    id: 'ranger_bear_trap',
    name: 'Bear Trap',
    cost: 1,
    type: 'utility',
    target: 'enemy',
    prefPos: [2, 3, 4],
    desc: 'Deal 5 damage + 3 Bleed.',
    value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyBleed(target, 3);
    }
  },
  {
    id: 'ranger_rain_of_arrows',
    name: 'Rain of Arrows',
    cost: 3,
    type: 'attack',
    target: 'all_enemies',
    prefPos: [3, 4],
    desc: 'Deal 8 damage to ALL enemies. Exhaust.',
    value: 8,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
      card._exhaust = true;
    }
  }
];

// ============================================================
// HERO DEFINITIONS
// ============================================================

DS.Heroes.push({
  name: 'Barbarian',
  cls: 'barbarian',
  maxHp: 58,
  startPos: 1,
  colors: { primary: '#cc4422', secondary: '#3a1a0a', accent: '#ff6633' },
  sprite: {
    body: 'heavy',
    head: 'horns',
    details: ['greataxe'],
    bodyColor: '#3a1a0a',
    armorColor: '#cc4422',
    accentColor: '#ff6633'
  }
});

DS.Heroes.push({
  name: 'Ranger',
  cls: 'ranger',
  maxHp: 36,
  startPos: 2,
  colors: { primary: '#44aa44', secondary: '#1a3a1a', accent: '#77cc55' },
  sprite: {
    body: 'light',
    head: 'hood-ranger',
    details: ['bow'],
    bodyColor: '#1a3a1a',
    armorColor: '#44aa44',
    accentColor: '#77cc55'
  }
});
