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
// heroList: optional array of { cls: string, heroIdx: number } for this run's heroes
DS.Cards.buildStartingDeck = function(heroList) {
  var deck = [];
  var entries = heroList || DS.Heroes.map(function(h, i) { return { cls: h.cls, heroIdx: i }; });
  entries.forEach(function(entry, runIdx) {
    var cards = DS.Cards[entry.cls];
    if (!cards) return;
    var heroDef = DS.Heroes.find(function(h) { return h.cls === entry.cls; });
    var heroName = heroDef ? heroDef.name : entry.cls;
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
          heroIdx: runIdx,
          heroCls: entry.cls,
          heroName: heroName,
          upgraded: false
        });
      }
    }
  });
  return deck;
};

// Helper: get a random card reward pool (cards from active classes, including reward-only cards)
// activeClasses: optional array of class strings to filter by (e.g. ['fighter', 'ranger'])
DS.Cards.getRewardPool = function(count, activeClasses) {
  count = count || 3;
  var classes = activeClasses || DS.Heroes.map(function(h) { return h.cls; });

  // Collect owned card baseIds to deprioritize duplicates
  var ownedIds = {};
  if (DS.State && DS.State.run && DS.State.run.deck) {
    DS.State.run.deck.forEach(function(c) {
      ownedIds[c.baseId] = (ownedIds[c.baseId] || 0) + 1;
    });
  }

  var allCards = [];
  classes.forEach(function(cls) {
    var cards = DS.Cards[cls];
    if (!cards) return;
    var heroDef = DS.Heroes.find(function(h) { return h.cls === cls; });
    var heroIdx = DS.Heroes.indexOf(heroDef);
    var heroName = heroDef ? heroDef.name : cls;
    // Reward pool: indices 4+ (skip starters 0-3)
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
        heroName: heroName,
        upgraded: false
      });
    }
  });

  // Filter out cards the player already owns 2+ copies of
  allCards = allCards.filter(function(card) {
    return (ownedIds[card.baseId] || 0) < 2;
  });

  // If pool too small after filtering, fall back to all reward cards from active classes
  if (allCards.length < count) {
    classes.forEach(function(cls) {
      var cards = DS.Cards[cls];
      if (!cards) return;
      var heroDef = DS.Heroes.find(function(h) { return h.cls === cls; });
      var heroIdx = DS.Heroes.indexOf(heroDef);
      var heroName = heroDef ? heroDef.name : cls;
      for (var idx = 4; idx < cards.length; idx++) {
        var cardDef = cards[idx];
        if (!allCards.some(function(c) { return c.baseId === cardDef.id; })) {
          allCards.push({
            id: cardDef.id, baseId: cardDef.id, name: cardDef.name,
            cost: cardDef.cost, type: cardDef.type, target: cardDef.target,
            prefPos: cardDef.prefPos.slice(), desc: cardDef.desc, value: cardDef.value,
            effect: cardDef.effect, heroIdx: heroIdx, heroCls: cls,
            heroName: heroName, upgraded: false
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

// ===== CARD UPGRADE SYSTEM =====
// Each entry defines what changes when a card is upgraded.
// If effect is omitted, the original effect is kept (value bump is often enough).
DS.Cards.UPGRADE_DEFS = {
  // --- FIGHTER ---
  fighter_strike: { name: 'Strike+', desc: 'Deal 10 damage.', value: 10 },
  fighter_shield_block: { name: 'Shield Block+', desc: 'Gain 11 Block.', value: 11 },
  fighter_heavy_blow: {
    name: 'Heavy Blow+', desc: 'Deal 18 damage. Pos 1-2.', value: 18, prefPos: [1, 2]
  },
  fighter_rally: { name: 'Rally+', desc: '6 Block to ALL allies.', value: 6 },
  fighter_cleave: { name: 'Cleave+', desc: 'Deal 9 damage to ALL enemies.', value: 9 },
  fighter_taunt: { name: 'Taunt+', desc: 'Gain 8 Block. Enemies target you.', value: 8 },
  fighter_fortify: { name: 'Fortify+', desc: 'Gain Block = half current Block (min 5).', value: 5 },
  fighter_second_wind: { name: 'Second Wind+', desc: 'Heal 10 HP. Exhaust.', value: 10 },
  fighter_war_cry: { name: 'War Cry+', desc: 'Gain 3 Strength this combat. Exhaust.', value: 3 },
  fighter_shield_bash: {
    name: 'Shield Bash+', desc: 'Deal 11 damage. Apply 3 Vulnerable.', value: 11,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyStatus(target, 'vulnerable', 3);
    }
  },
  fighter_whirlwind: { name: 'Whirlwind+', desc: 'Deal 14 damage to ALL enemies. Pos 1 only.', value: 14 },
  fighter_iron_will: { name: 'Iron Will+', desc: 'Gain 16 Block. Exhaust.', value: 16 },

  // --- ROGUE ---
  rogue_backstab: { name: 'Backstab+', desc: 'Deal 11 damage.', value: 11 },
  rogue_evade: { name: 'Evade+', desc: 'Gain 9 Block.', value: 9 },
  rogue_throwing_knife: { name: 'Throwing Knife+', desc: 'Deal 8 damage. Hits any enemy.', value: 8 },
  rogue_shadow_step: { name: 'Shadow Step+', desc: 'Deal 7 damage + move forward 1.', value: 7 },
  rogue_flurry: { name: 'Flurry+', desc: 'Strike 3 times for 4 damage.', value: 4 },
  rogue_smoke_bomb: { name: 'Smoke Bomb+', desc: 'Gain 7 Block. Swap positions with an ally.', value: 7 },
  rogue_poison_blade: {
    name: 'Poison Blade+', desc: 'Deal 5 damage + 5 Poison.', value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyPoison(target, 5);
    }
  },
  rogue_fan_of_knives: { name: 'Fan of Knives+', desc: 'Deal 5 damage to all enemies.', value: 5 },
  rogue_weaken: {
    name: 'Nerve Strike+', desc: 'Deal 5 damage. Apply 3 Weak.', value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyStatus(target, 'weak', 3);
    }
  },
  rogue_lacerate: {
    name: 'Lacerate+', desc: 'Deal 7 damage. Apply 5 Bleed.', value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyStatus(target, 'bleed', 5);
    }
  },
  rogue_assassinate: { name: 'Assassinate+', desc: 'Deal 28 damage. Exhaust.', value: 28 },
  rogue_caltrops: { name: 'Caltrops+', desc: 'Apply 4 Poison to ALL enemies.', value: 4 },

  // --- CLERIC ---
  cleric_smite: { name: 'Smite+', desc: 'Deal 8 damage.', value: 8 },
  cleric_divine_shield: { name: 'Divine Shield+', desc: 'Give ally 10 Block.', value: 10 },
  cleric_heal: { name: 'Heal+', desc: 'Heal ally 12 HP.', value: 12 },
  cleric_bless: {
    name: 'Bless+', desc: 'All allies: 6 Block + 4 HP. Pos 4 only.', value: 6,
    effect: function(state, hero, target, card) {
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.gainBlock(h, card.value);
        DS.Combat.healTarget(h, 4);
      });
    }
  },
  cleric_holy_fire: { name: 'Holy Fire+', desc: 'Deal 13 damage.', value: 13 },
  cleric_sanctuary: { name: 'Sanctuary+', desc: 'All allies: 5 Block + 5 HP.', value: 5 },
  cleric_purify: {
    name: 'Purify+', desc: 'Remove ALL negative statuses from an ally.',
    effect: function(state, hero, target, card) {
      DS.Combat.removeNegativeStatuses(target);
    }
  },
  cleric_resurrect: { name: 'Resurrect+', desc: 'Revive a dead hero at 5 HP. Exhaust.', value: 5 },
  cleric_divine_wrath: {
    name: 'Divine Wrath+', desc: 'Deal 6 damage to all. Apply 2 Vulnerable.', value: 6,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
        DS.Combat.applyStatus(e, 'vulnerable', 2);
      });
    }
  },
  cleric_cleansing_light: { name: 'Cleansing Light+', desc: 'Heal all allies 5 HP. Remove all Weak.', value: 5 },
  cleric_martyrdom: { name: 'Martyrdom+', desc: 'Lose 5 HP. Heal all other allies 15 HP.', value: 15 },
  cleric_holy_nova: {
    name: 'Holy Nova+', desc: 'Deal 7 damage to all enemies. Heal all allies 5 HP.', value: 7,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.healTarget(h, 5);
      });
    }
  },

  // --- WIZARD ---
  wizard_magic_missile: { name: 'Magic Missile+', desc: 'Deal 9 damage. Hits any enemy.', value: 9 },
  wizard_arcane_ward: { name: 'Arcane Ward+', desc: 'Gain 8 Block.', value: 8 },
  wizard_fireball: { name: 'Fireball+', desc: 'Deal 7 damage to ALL enemies. Pos 4 only.', value: 7 },
  wizard_arcane_intellect: { name: 'Arcane Intellect+', desc: 'Draw 4 cards. Pos 4 only.', value: 4 },
  wizard_chain_lightning: {
    name: 'Chain Lightning+', desc: 'Strike random enemies 5 times for 4 damage.', value: 4,
    effect: function(state, hero, target, card) {
      for (var i = 0; i < 5; i++) {
        var alive = DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
        if (alive.length === 0) break;
        var pick = alive[Math.floor(Math.random() * alive.length)];
        DS.Combat.dealDamage(pick, card.value);
      }
    }
  },
  wizard_frost_nova: {
    name: 'Frost Nova+', desc: '3 damage to all enemies. 40% stun.', value: 3,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
        if (Math.random() < 0.4) {
          DS.Combat.applyStatus(e, 'stunned', 1);
        }
      });
    }
  },
  wizard_mana_shield: { name: 'Mana Shield+', desc: 'Convert energy to Block (5 per 1 energy).', value: 5 },
  wizard_teleport: {
    name: 'Teleport+', desc: 'Swap two heroes\' positions. Both gain 3 Block. Exhaust.', value: 3,
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
        DS.Combat.gainBlock(hero, card.value);
        DS.Combat.gainBlock(front, card.value);
      }
      card._exhaust = true;
    }
  },
  wizard_blizzard: {
    name: 'Blizzard+', desc: 'Deal 5 damage to all enemies. Apply 3 Weak.', value: 5,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
        DS.Combat.applyStatus(e, 'weak', 3);
      });
    }
  },
  wizard_empower: { name: 'Empower+', desc: 'Give an ally 4 Strength. Exhaust.', value: 4 },
  wizard_meteor: { name: 'Meteor+', desc: 'Deal 20 damage to ALL enemies. Exhaust.', value: 20 },
  wizard_mirror_image: {
    name: 'Mirror Image+', desc: 'Give all allies 5 Block. Draw 2 cards.', value: 5,
    effect: function(state, hero, target, card) {
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.gainBlock(h, card.value);
      });
      DS.Combat.drawCard();
      DS.Combat.drawCard();
    }
  },

  // --- BARBARIAN ---
  barbarian_savage_strike: { name: 'Savage Strike+', desc: 'Deal 11 damage.', value: 11 },
  barbarian_tough_skin: { name: 'Tough Skin+', desc: 'Gain 9 Block.', value: 9 },
  barbarian_reckless_charge: {
    name: 'Reckless Charge+', desc: 'Deal 16 damage. Take 2 damage. Pos 1 only.', value: 16,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      hero.hp = Math.max(1, hero.hp - 2);
      DS.Combat.floatText(hero, '-2', 'damage');
    }
  },
  barbarian_blood_rage: {
    name: 'Blood Rage+', desc: 'Gain 3 Strength. Lose 3 HP. Exhaust.', value: 3,
    effect: function(state, hero, target, card) {
      DS.Combat.applyStrength(hero, card.value);
      hero.hp = Math.max(1, hero.hp - 3);
      DS.Combat.floatText(hero, '-3', 'damage');
      card._exhaust = true;
    }
  },
  barbarian_rampage: {
    name: 'Rampage+', desc: 'Deal 9 damage. Double if below 50% HP.', value: 9,
    effect: function(state, hero, target, card) {
      var dmg = card.value;
      if (hero.hp < hero.maxHp * 0.5) dmg = card.value * 2;
      DS.Combat.dealDamage(target, dmg);
    }
  },
  barbarian_bloodlust: {
    name: 'Bloodlust+', desc: 'Deal 14 damage. If kill, heal 8. Pos 1 only.', value: 14,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (target.hp <= 0) {
        DS.Combat.healTarget(hero, 8);
      }
    }
  },
  barbarian_whirlwind_axe: { name: 'Whirlwind Axe+', desc: 'Deal 10 damage to ALL enemies. Pos 1 only.', value: 10 },
  barbarian_berserker_roar: {
    name: 'Berserker Roar+', desc: 'All enemies gain 3 Vulnerable. Gain 2 Strength.', value: 3,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.applyVulnerable(e, card.value);
      });
      DS.Combat.applyStrength(hero, 2);
    }
  },
  barbarian_pain_threshold: { name: 'Pain Threshold+', desc: 'Gain Block = missing HP (max 20).', value: 20 },
  barbarian_undying_rage: { name: 'Undying Rage+', desc: 'Set HP to 1. Gain 8 Strength. Exhaust.', value: 8 },
  barbarian_headbutt: {
    name: 'Headbutt+', desc: 'Deal 10 damage. 40% stun. Pos 1 only.', value: 10,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (target.hp > 0 && Math.random() < 0.40) {
        target.stunned = true;
        DS.Combat.logMsg(target.name + ' is stunned!', 'stun-log');
      }
    }
  },
  barbarian_frenzy: {
    name: 'Frenzy+', desc: 'Strike 4 times for 3 damage. +2 each if below 50% HP.', value: 3,
    effect: function(state, hero, target, card) {
      var bonus = (hero.hp < hero.maxHp * 0.5) ? 2 : 0;
      for (var i = 0; i < 4; i++) {
        if (target.hp <= 0) break;
        DS.Combat.dealDamage(target, card.value + bonus);
      }
    }
  },

  // --- RANGER ---
  ranger_quick_shot: { name: 'Quick Shot+', desc: 'Deal 9 damage. Hits any enemy.', value: 9 },
  ranger_dodge_roll: { name: 'Dodge Roll+', desc: 'Gain 8 Block.', value: 8 },
  ranger_aimed_shot: { name: 'Aimed Shot+', desc: 'Deal 13 damage.', value: 13 },
  ranger_snare_trap: {
    name: 'Snare Trap+', desc: 'Apply 3 Weak + 3 Vulnerable.', value: 3,
    effect: function(state, hero, target, card) {
      DS.Combat.applyWeak(target, card.value);
      DS.Combat.applyVulnerable(target, card.value);
    }
  },
  ranger_mark_prey: {
    name: 'Mark Prey+', desc: 'Mark target. Next hit deals +5 bonus damage.', value: 5,
    effect: function(state, hero, target, card) {
      target._marked = true;
      target._markBonus = card.value;
      DS.Combat.logMsg(target.name + ' is Marked!', 'stun-log');
      DS.Combat.floatText(target, 'MARKED', 'damage');
    }
  },
  ranger_volley: { name: 'Volley+', desc: 'Deal 6 damage to ALL enemies.', value: 6 },
  ranger_poison_arrow: {
    name: 'Poison Arrow+', desc: 'Deal 5 damage + 5 Poison.', value: 5,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyPoison(target, 5);
    }
  },
  ranger_called_shot: {
    name: 'Called Shot+', desc: 'Deal 18 damage. If Marked, deal +8 and clear Mark.', value: 18,
    effect: function(state, hero, target, card) {
      var dmg = card.value;
      if (target._marked) {
        dmg = card.value + 8;
        target._marked = false;
        target._markBonus = 0;
        DS.Combat.logMsg('Mark consumed! Bonus damage!', 'damage');
      }
      DS.Combat.dealDamage(target, dmg);
    }
  },
  ranger_multi_shot: {
    name: 'Multi-Shot+', desc: 'Hit 4 random enemies for 4 damage each.', value: 4,
    effect: function(state, hero, target, card) {
      for (var i = 0; i < 4; i++) {
        var alive = DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
        if (alive.length === 0) break;
        var pick = alive[Math.floor(Math.random() * alive.length)];
        DS.Combat.dealDamage(pick, card.value);
      }
    }
  },
  ranger_camouflage: {
    name: 'Camouflage+', desc: 'Gain 11 Block. Draw 1 card.', value: 11,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
      DS.Combat.drawCard();
    }
  },
  ranger_bear_trap: {
    name: 'Bear Trap+', desc: 'Deal 7 damage + 5 Bleed.', value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyBleed(target, 5);
    }
  },
  ranger_rain_of_arrows: { name: 'Rain of Arrows+', desc: 'Deal 12 damage to ALL enemies. Exhaust.', value: 12 },

  // --- NECROMANCER ---
  necromancer_life_drain: {
    name: 'Life Drain+', desc: 'Deal 6 damage. Heal self 5.', value: 6,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 5);
    }
  },
  necromancer_shadow_bolt: { name: 'Shadow Bolt+', desc: 'Deal 9 damage. Hits any enemy.', value: 9 },
  necromancer_bone_shield: { name: 'Bone Shield+', desc: 'Gain 8 Block.', value: 8 },
  necromancer_hex: { name: 'Hex+', desc: 'Apply 3 Weak.', value: 3 },
  necromancer_plague_spread: {
    name: 'Plague Spread+', desc: 'If Poisoned, triple it. Otherwise apply 4 Poison.', value: 4,
    effect: function(state, hero, target, card) {
      if (target.poison > 0) {
        var tripled = target.poison * 2;
        DS.Combat.applyPoison(target, tripled);
        DS.Combat.logMsg(target.name + '\'s Poison tripled!', 'poison-log');
      } else {
        DS.Combat.applyPoison(target, card.value);
      }
    }
  },
  necromancer_soul_siphon: {
    name: 'Soul Siphon+', desc: 'Deal 9 damage. Heal lowest-HP ally 9.', value: 9,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      var alive = DS.State.run.heroes.filter(function(h) { return h.hp > 0; });
      if (alive.length > 0) {
        var lowest = alive.reduce(function(a, b) { return a.hp < b.hp ? a : b; });
        DS.Combat.healTarget(lowest, card.value);
      }
    }
  },
  necromancer_corpse_explosion: {
    name: 'Corpse Explosion+', desc: 'Deal 3 x dead enemy count to all alive enemies. Pos 4 only.', value: 3
  },
  necromancer_dark_pact: {
    name: 'Dark Pact+', desc: 'Lose 3 HP. Draw 3 cards. Exhaust.', value: 3,
    effect: function(state, hero, target, card) {
      hero.hp = Math.max(1, hero.hp - 3);
      DS.Combat.floatText(hero, '-3', 'damage');
      for (var i = 0; i < card.value; i++) DS.Combat.drawCard();
      card._exhaust = true;
    }
  },
  necromancer_mass_curse: {
    name: 'Mass Curse+', desc: 'All enemies: 3 Weak + 2 Vulnerable. Pos 4 only.', value: 3,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.applyWeak(e, card.value);
        DS.Combat.applyVulnerable(e, 2);
      });
    }
  },
  necromancer_death_coil: {
    name: 'Death Coil+', desc: 'Deal 16 damage. Heal self 6.', value: 16,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 6);
    }
  },
  necromancer_blight: { name: 'Blight+', desc: 'Apply 4 Poison to ALL enemies.', value: 4 },
  necromancer_raise_shade: {
    name: 'Raise Shade+', desc: 'Deal 14 damage + 5 Poison. Exhaust. Pos 4 only.', value: 14,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyPoison(target, 5);
      card._exhaust = true;
    }
  },

  // --- PALADIN ---
  paladin_holy_strike: {
    name: 'Holy Strike+', desc: 'Deal 7 damage. Gain 5 Block.', value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.gainBlock(hero, 5);
    }
  },
  paladin_shield_of_faith: { name: 'Shield of Faith+', desc: 'Give ally 10 Block.', value: 10 },
  paladin_lay_on_hands: { name: 'Lay on Hands+', desc: 'Heal ally 10 HP.', value: 10 },
  paladin_righteous_blow: { name: 'Righteous Blow+', desc: 'Deal 11 damage.', value: 11 },
  paladin_divine_smite: {
    name: 'Divine Smite+', desc: 'Deal 16 damage. Apply 3 Vulnerable. Pos 1 only.', value: 16,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.applyVulnerable(target, 3);
    }
  },
  paladin_consecrate: {
    name: 'Consecrate+', desc: 'Deal 6 to all enemies. All allies gain 5 Block.', value: 6,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.gainBlock(h, 5);
      });
    }
  },
  paladin_guardian_stance: {
    name: 'Guardian Stance+', desc: 'Gain 18 Block. Taunt all enemies. Pos 1 only.', value: 18,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        e.taunted = hero.id;
      });
      DS.Combat.logMsg(hero.name + ' taunts all enemies!', 'stun-log');
    }
  },
  paladin_holy_avenger: {
    name: 'Holy Avenger+', desc: 'Deal damage equal to your Block + 4. Exhaust.', value: 4,
    effect: function(state, hero, target, card) {
      var dmg = (hero.block || 0) + card.value;
      if (dmg > 0) {
        DS.Combat.dealDamage(target, dmg);
      } else {
        DS.Combat.logMsg('No Block to convert!', 'system');
      }
      card._exhaust = true;
    }
  },
  paladin_aura_of_protection: { name: 'Aura of Protection+', desc: 'All allies gain 6 Block.', value: 6 },
  paladin_retribution: {
    name: 'Retribution+', desc: 'Deal 9 damage. Pos 1: also gain 6 Block.', value: 9,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      if (hero.pos === 1) {
        DS.Combat.gainBlock(hero, 6);
      }
    }
  },
  paladin_sacred_oath: {
    name: 'Sacred Oath+', desc: 'Gain 3 Strength + 7 Block. Exhaust.', value: 3,
    effect: function(state, hero, target, card) {
      DS.Combat.applyStrength(hero, card.value);
      DS.Combat.gainBlock(hero, 7);
      card._exhaust = true;
    }
  },
  paladin_crusader_strike: {
    name: 'Crusader Strike+', desc: 'Deal 14 damage. Heal self 7. Pos 1 only.', value: 14,
    effect: function(state, hero, target, card) {
      DS.Combat.dealDamage(target, card.value);
      DS.Combat.healTarget(hero, 7);
    }
  }
};

// Apply an upgrade to a card instance using UPGRADE_DEFS
DS.Cards.applyUpgrade = function(card) {
  var def = DS.Cards.UPGRADE_DEFS[card.baseId];
  if (!def) {
    // Fallback: +3 value, append +
    card.value = (card.value || 0) + 3;
    card.name = card.name.replace(/\+$/, '') + '+';
    card.upgraded = true;
    return card;
  }
  if (def.name) card.name = def.name;
  if (def.desc) card.desc = def.desc;
  if (def.value !== undefined) card.value = def.value;
  if (def.cost !== undefined) card.cost = def.cost;
  if (def.effect) card.effect = def.effect;
  if (def.prefPos) card.prefPos = def.prefPos.slice();
  if (def.innate !== undefined) card.innate = def.innate;
  if (def.ethereal !== undefined) card.ethereal = def.ethereal;
  card.upgraded = true;
  return card;
};
