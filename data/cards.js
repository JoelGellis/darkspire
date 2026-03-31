window.DS = window.DS || {};

DS.Cards = {
  fighter: [
    // --- Starting cards (indices 0-3) ---
    {
      id: 'fighter_strike',
      name: 'Strike',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [1, 2, 3],
      desc: 'Deal 7 damage.',
      value: 7,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'fighter_shield_block',
      name: 'Shield Block',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [1, 2],
      desc: 'Gain 8 Block.',
      value: 8,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
      }
    },
    {
      id: 'fighter_heavy_blow',
      name: 'Heavy Blow',
      cost: 2,
      type: 'attack',
      target: 'enemy',
      prefPos: [1],
      desc: 'Deal 15 damage. Pos 1 only.',
      value: 15,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'fighter_rally',
      name: 'Rally',
      cost: 1,
      type: 'block',
      target: 'all_allies',
      prefPos: [1, 2],
      desc: '4 Block to ALL allies.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.gainBlock(h, card.value);
        });
      }
    },
    // --- Reward-only cards (indices 4-7) ---
    {
      id: 'fighter_cleave',
      name: 'Cleave',
      cost: 2,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [1, 2],
      desc: 'Deal 6 damage to ALL enemies.',
      value: 6,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
      }
    },
    {
      id: 'fighter_taunt',
      name: 'Taunt',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [1],
      desc: 'Gain 5 Block. Enemies target you.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          e.taunted = hero.id;
        });
      }
    },
    {
      id: 'fighter_fortify',
      name: 'Fortify',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [1, 2, 3],
      desc: 'Gain Block = half current Block (min 3).',
      value: 3,
      effect: function(state, hero, target, card) {
        var amt = Math.max(card.value, Math.floor(hero.block / 2));
        DS.Combat.gainBlock(hero, amt);
      }
    },
    {
      id: 'fighter_second_wind',
      name: 'Second Wind',
      cost: 1,
      type: 'heal',
      target: 'self',
      prefPos: [1, 2],
      desc: 'Heal 6 HP. Exhaust.',
      value: 6,
      effect: function(state, hero, target, card) {
        DS.Combat.healTarget(hero, card.value);
        card._exhaust = true;
      }
    },
    // --- Status effect cards (indices 8-9) ---
    {
      id: 'fighter_war_cry',
      name: 'War Cry',
      cost: 1,
      type: 'utility',
      target: 'none',
      prefPos: [1, 2],
      desc: 'Gain 2 Strength this combat. Exhaust.',
      value: 2,
      effect: function(state, hero, target, card) {
        hero.strength = (hero.strength || 0) + card.value;
        DS.Combat.logMsg(hero.name + ' gains ' + card.value + ' Strength!', 'heal');
        card._exhaust = true;
      }
    },
    {
      id: 'fighter_shield_bash',
      name: 'Shield Bash',
      cost: 2,
      type: 'attack',
      target: 'enemy',
      prefPos: [1],
      desc: 'Deal 8 damage. Apply 2 Vulnerable.',
      value: 8,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        target.vulnerable = (target.vulnerable || 0) + 2;
        DS.Combat.logMsg(target.name + ' is Vulnerable!', 'stun-log');
      }
    },
    {
      id: 'fighter_whirlwind',
      name: 'Whirlwind',
      cost: 3,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [1],
      desc: 'Deal 10 damage to ALL enemies. Pos 1 only.',
      value: 10,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
      }
    },
    {
      id: 'fighter_iron_will',
      name: 'Iron Will',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [1, 2],
      desc: 'Gain 12 Block. Exhaust.',
      value: 12,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
        card._exhaust = true;
      }
    }
  ],

  rogue: [
    // --- Starting cards (indices 0-3) ---
    {
      id: 'rogue_backstab',
      name: 'Backstab',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [1, 2, 3],
      desc: 'Deal 8 damage.',
      value: 8,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'rogue_evade',
      name: 'Evade',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [2, 3, 4],
      desc: 'Gain 6 Block.',
      value: 6,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
      }
    },
    {
      id: 'rogue_throwing_knife',
      name: 'Throwing Knife',
      cost: 1,
      type: 'attack',
      target: 'enemy_any',
      prefPos: [2, 3, 4],
      desc: 'Deal 5 damage. Hits any enemy.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'rogue_shadow_step',
      name: 'Shadow Step',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [2, 3],
      desc: 'Deal 4 damage + move forward 1.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        DS.Combat.moveForward(hero);
      }
    },
    // --- Reward-only cards (indices 4-7) ---
    {
      id: 'rogue_flurry',
      name: 'Flurry',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [1, 2],
      desc: 'Strike 3 times for 3 damage.',
      value: 3,
      effect: function(state, hero, target, card) {
        for (var i = 0; i < 3; i++) DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'rogue_smoke_bomb',
      name: 'Smoke Bomb',
      cost: 1,
      type: 'block',
      target: 'ally',
      prefPos: [2, 3, 4],
      desc: 'Gain 4 Block. Swap positions with an ally.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
        var tmp = hero.pos;
        hero.pos = target.pos;
        target.pos = tmp;
      }
    },
    {
      id: 'rogue_poison_blade',
      name: 'Poison Blade',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [2, 3],
      desc: 'Deal 4 damage + 3 Poison.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        DS.Combat.applyPoison(target, 3);
      }
    },
    {
      id: 'rogue_fan_of_knives',
      name: 'Fan of Knives',
      cost: 2,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [3, 4],
      desc: 'Deal 3 damage to all enemies.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
      }
    },
    // --- Status effect cards (indices 8-9) ---
    {
      id: 'rogue_weaken',
      name: 'Nerve Strike',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [2, 3],
      desc: 'Deal 3 damage. Apply 2 Weak.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        target.weak = (target.weak || 0) + 2;
        DS.Combat.logMsg(target.name + ' is Weakened!', 'stun-log');
      }
    },
    {
      id: 'rogue_lacerate',
      name: 'Lacerate',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [1, 2, 3],
      desc: 'Deal 5 damage. Apply 3 Bleed.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        target.bleed = (target.bleed || 0) + 3;
        DS.Combat.logMsg(target.name + ' is Bleeding!', 'damage');
      }
    },
    {
      id: 'rogue_assassinate',
      name: 'Assassinate',
      cost: 2,
      type: 'attack',
      target: 'enemy',
      prefPos: [1, 2],
      desc: 'Deal 20 damage. Exhaust.',
      value: 20,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        card._exhaust = true;
      }
    },
    {
      id: 'rogue_caltrops',
      name: 'Caltrops',
      cost: 1,
      type: 'utility',
      target: 'all_enemies',
      prefPos: [2, 3, 4],
      desc: 'Apply 2 Poison to ALL enemies.',
      value: 2,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.applyPoison(e, card.value);
        });
      }
    }
  ],

  cleric: [
    // --- Starting cards (indices 0-3) ---
    {
      id: 'cleric_smite',
      name: 'Smite',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [2, 3, 4],
      desc: 'Deal 5 damage.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'cleric_divine_shield',
      name: 'Divine Shield',
      cost: 1,
      type: 'block',
      target: 'ally',
      prefPos: [3, 4],
      desc: 'Give ally 7 Block.',
      value: 7,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(target, card.value);
      }
    },
    {
      id: 'cleric_heal',
      name: 'Heal',
      cost: 1,
      type: 'heal',
      target: 'ally',
      prefPos: [3, 4],
      desc: 'Heal ally 8 HP.',
      value: 8,
      effect: function(state, hero, target, card) {
        DS.Combat.healTarget(target, card.value);
      }
    },
    {
      id: 'cleric_bless',
      name: 'Bless',
      cost: 2,
      type: 'block',
      target: 'all_allies',
      prefPos: [4],
      desc: 'All allies: 4 Block + 2 HP. Pos 4 only.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.gainBlock(h, card.value);
          DS.Combat.healTarget(h, 2);
        });
      }
    },
    // --- Reward-only cards (indices 4-7) ---
    {
      id: 'cleric_holy_fire',
      name: 'Holy Fire',
      cost: 2,
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
      id: 'cleric_sanctuary',
      name: 'Sanctuary',
      cost: 2,
      type: 'block',
      target: 'all_allies',
      prefPos: [3, 4],
      desc: 'All allies: 3 Block + 3 HP.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.gainBlock(h, card.value);
          DS.Combat.healTarget(h, card.value);
        });
      }
    },
    {
      id: 'cleric_purify',
      name: 'Purify',
      cost: 0,
      type: 'heal',
      target: 'ally',
      prefPos: [3, 4],
      desc: 'Remove all Poison from an ally.',
      value: 0,
      effect: function(state, hero, target, card) {
        target.poison = 0;
        DS.Combat.logMsg(target.name + ' purified of poison.', 'heal');
      }
    },
    {
      id: 'cleric_resurrect',
      name: 'Resurrect',
      cost: 3,
      type: 'heal',
      target: 'ally_dead',
      prefPos: [4],
      desc: 'Revive a dead hero at 1 HP. Exhaust.',
      value: 1,
      effect: function(state, hero, target, card) {
        target.hp = card.value;
        DS.Combat.logMsg(target.name + ' has been resurrected!', 'heal');
        card._exhaust = true;
      }
    },
    // --- Status effect cards (indices 8-9) ---
    {
      id: 'cleric_divine_wrath',
      name: 'Divine Wrath',
      cost: 2,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [3, 4],
      desc: 'Deal 4 damage to all. Apply 1 Vulnerable.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
          e.vulnerable = (e.vulnerable || 0) + 1;
          DS.Combat.logMsg(e.name + ' is Vulnerable!', 'stun-log');
        });
      }
    },
    {
      id: 'cleric_cleansing_light',
      name: 'Cleansing Light',
      cost: 1,
      type: 'heal',
      target: 'all_allies',
      prefPos: [3, 4],
      desc: 'Heal all allies 3 HP. Remove all Weak.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.healTarget(h, card.value);
          h.weak = 0;
          DS.Combat.logMsg(h.name + ' is cleansed of Weakness!', 'heal');
        });
      }
    },
    {
      id: 'cleric_martyrdom',
      name: 'Martyrdom',
      cost: 1,
      type: 'heal',
      target: 'none',
      prefPos: [3, 4],
      desc: 'Lose 5 HP. Heal all other allies 10 HP.',
      value: 10,
      effect: function(state, hero, target, card) {
        hero.hp = Math.max(1, hero.hp - 5);
        DS.Combat.floatText(hero, '-5', 'damage');
        DS.State.run.heroes.filter(function(h) { return h.hp > 0 && h !== hero; }).forEach(function(h) {
          DS.Combat.healTarget(h, card.value);
        });
      }
    },
    {
      id: 'cleric_holy_nova',
      name: 'Holy Nova',
      cost: 2,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [3, 4],
      desc: 'Deal 5 damage to all enemies. Heal all allies 3 HP.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.healTarget(h, 3);
        });
      }
    }
  ],

  wizard: [
    // --- Starting cards (indices 0-3) ---
    {
      id: 'wizard_magic_missile',
      name: 'Magic Missile',
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
      id: 'wizard_arcane_ward',
      name: 'Arcane Ward',
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
      id: 'wizard_fireball',
      name: 'Fireball',
      cost: 2,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [4],
      desc: 'Deal 4 damage to ALL enemies. Pos 4 only.',
      value: 4,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
      }
    },
    {
      id: 'wizard_arcane_intellect',
      name: 'Arcane Intellect',
      cost: 1,
      type: 'draw',
      target: 'none',
      prefPos: [4],
      desc: 'Draw 3 cards. Pos 4 only.',
      value: 3,
      effect: function(state, hero, target, card) {
        for (var i = 0; i < card.value; i++) DS.Combat.drawCard();
      }
    },
    // --- Reward-only cards (indices 4-7) ---
    {
      id: 'wizard_chain_lightning',
      name: 'Chain Lightning',
      cost: 2,
      type: 'attack',
      target: 'enemy',
      prefPos: [4],
      desc: 'Strike random enemies 4 times for 3 damage.',
      value: 3,
      effect: function(state, hero, target, card) {
        for (var i = 0; i < 4; i++) {
          var alive = DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
          if (alive.length === 0) break;
          var pick = alive[Math.floor(Math.random() * alive.length)];
          DS.Combat.dealDamage(pick, card.value);
        }
      }
    },
    {
      id: 'wizard_frost_nova',
      name: 'Frost Nova',
      cost: 1,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [3, 4],
      desc: '2 damage to all enemies. 25% stun.',
      value: 2,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
          if (Math.random() < 0.25) {
            e.stunned = true;
            DS.Combat.logMsg(e.name + ' is stunned!', 'stun-log');
          }
        });
      }
    },
    {
      id: 'wizard_mana_shield',
      name: 'Mana Shield',
      cost: 0,
      type: 'block',
      target: 'self',
      prefPos: [3, 4],
      desc: 'Convert energy to Block (4 per 1 energy).',
      value: 4,
      effect: function(state, hero, target, card) {
        var amt = DS.State.combat.energy * card.value;
        DS.State.combat.energy = 0;
        DS.Combat.gainBlock(hero, amt);
      }
    },
    {
      id: 'wizard_teleport',
      name: 'Teleport',
      cost: 0,
      type: 'utility',
      target: 'none',
      prefPos: [1, 2, 3, 4],
      desc: 'Swap two heroes\' positions. Exhaust.',
      value: 0,
      effect: function(state, hero, target, card) {
        var front = null;
        DS.State.run.heroes.forEach(function(h) {
          if (h.hp > 0 && h !== hero) {
            if (!front || h.pos < front.pos) front = h;
          }
        });
        if (front) {
          var tmp = hero.pos;
          hero.pos = front.pos;
          front.pos = tmp;
          DS.Combat.logMsg(hero.name + ' teleports, swapping with ' + front.name + '.', 'system');
        }
        card._exhaust = true;
      }
    },
    // --- Status effect cards (indices 8-9) ---
    {
      id: 'wizard_blizzard',
      name: 'Blizzard',
      cost: 3,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [4],
      desc: 'Deal 3 damage to all enemies. Apply 2 Weak.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
          e.weak = (e.weak || 0) + 2;
          DS.Combat.logMsg(e.name + ' is Weakened!', 'stun-log');
        });
      }
    },
    {
      id: 'wizard_empower',
      name: 'Empower',
      cost: 1,
      type: 'utility',
      target: 'ally',
      prefPos: [3, 4],
      desc: 'Give an ally 3 Strength. Exhaust.',
      value: 3,
      effect: function(state, hero, target, card) {
        target.strength = (target.strength || 0) + card.value;
        DS.Combat.logMsg(target.name + ' is empowered!', 'heal');
        card._exhaust = true;
      }
    },
    {
      id: 'wizard_meteor',
      name: 'Meteor',
      cost: 3,
      type: 'attack',
      target: 'all_enemies',
      prefPos: [4],
      desc: 'Deal 15 damage to ALL enemies. Exhaust.',
      value: 15,
      effect: function(state, hero, target, card) {
        DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
          DS.Combat.dealDamage(e, card.value);
        });
        card._exhaust = true;
      }
    },
    {
      id: 'wizard_mirror_image',
      name: 'Mirror Image',
      cost: 1,
      type: 'block',
      target: 'all_allies',
      prefPos: [3, 4],
      desc: 'Give all allies 3 Block. Draw 1 card.',
      value: 3,
      effect: function(state, hero, target, card) {
        DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
          DS.Combat.gainBlock(h, card.value);
        });
        DS.Combat.drawCard();
      }
    }
  ]
};

// Helper: build full starting deck (2 copies of each STARTER card per hero, indices 0-3 only)
DS.Cards.buildStartingDeck = function() {
  var deck = [];
  var classes = ['fighter', 'rogue', 'cleric', 'wizard'];
  classes.forEach(function(cls, heroIdx) {
    var cards = DS.Cards[cls];
    // Only starter cards: indices 0 through 3
    for (var idx = 0; idx < 4; idx++) {
      var cardDef = cards[idx];
      for (var c = 0; c < 2; c++) {
        deck.push({
          id: cardDef.id + '_' + c,
          baseId: cardDef.id,
          name: cardDef.name,
          cost: cardDef.cost,
          type: cardDef.type,
          target: cardDef.target,
          prefPos: cardDef.prefPos.slice(),
          desc: cardDef.desc,
          value: cardDef.value,
          effect: cardDef.effect,
          heroIdx: heroIdx,
          heroCls: cls,
          heroName: DS.Heroes[heroIdx].name,
          upgraded: false
        });
      }
    }
  });
  return deck;
};

// Helper: get a random card reward pool (3 cards from ALL classes, including reward-only cards)
DS.Cards.getRewardPool = function(count) {
  count = count || 3;

  // Collect owned card baseIds to deprioritize duplicates
  var ownedIds = {};
  if (DS.State && DS.State.run && DS.State.run.deck) {
    DS.State.run.deck.forEach(function(c) {
      ownedIds[c.baseId] = (ownedIds[c.baseId] || 0) + 1;
    });
  }

  var allCards = [];
  var classes = ['fighter', 'rogue', 'cleric', 'wizard'];
  classes.forEach(function(cls, heroIdx) {
    // Reward pool: indices 4+ (skip starters 0-3)
    var cards = DS.Cards[cls];
    for (var idx = 4; idx < cards.length; idx++) {
      var cardDef = cards[idx];
      allCards.push({
        id: cardDef.id,
        baseId: cardDef.id,
        name: cardDef.name,
        cost: cardDef.cost,
        type: cardDef.type,
        target: cardDef.target,
        prefPos: cardDef.prefPos.slice(),
        desc: cardDef.desc,
        value: cardDef.value,
        effect: cardDef.effect,
        heroIdx: heroIdx,
        heroCls: cls,
        heroName: DS.Heroes[heroIdx].name,
        upgraded: false
      });
    }
  });

  // Filter out cards the player already owns 2+ copies of
  allCards = allCards.filter(function(card) {
    return (ownedIds[card.baseId] || 0) < 2;
  });

  // If pool too small after filtering, fall back to all reward cards
  if (allCards.length < count) {
    classes.forEach(function(cls, heroIdx) {
      var cards = DS.Cards[cls];
      for (var idx = 4; idx < cards.length; idx++) {
        var cardDef = cards[idx];
        if (!allCards.some(function(c) { return c.baseId === cardDef.id; })) {
          allCards.push({
            id: cardDef.id, baseId: cardDef.id, name: cardDef.name,
            cost: cardDef.cost, type: cardDef.type, target: cardDef.target,
            prefPos: cardDef.prefPos.slice(), desc: cardDef.desc, value: cardDef.value,
            effect: cardDef.effect, heroIdx: heroIdx, heroCls: cls,
            heroName: DS.Heroes[heroIdx].name, upgraded: false
          });
        }
      }
    });
  }

  // Shuffle and pick
  for (var i = allCards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = allCards[i]; allCards[i] = allCards[j]; allCards[j] = tmp;
  }
  return allCards.slice(0, count);
};
