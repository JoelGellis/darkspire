window.DS = window.DS || {};

// prefPos convention (2026-08 gate softening):
//   prefPos: [1,2]  -> HARD position gate: card only playable while its hero's live
//                      pos is in the list (Darkest-Dungeon rank lock).
//   prefPos: []     -> UNGATED: playable from any position. Used for bread-and-butter
//                      cards so a starter deck functions (not thrives) from any
//                      formation; power spikes / position-mechanic cards keep the gate.
DS.Cards = {
  fighter: [
    // --- Starting cards (indices 0-3) ---
    {
      id: 'fighter_strike',
      name: 'Strike',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
      desc: 'Heal 5 HP. Exhaust.',
      value: 5,
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
      prefPos: [],
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
      reach: [1, 2],
      prefPos: [],
      desc: 'Deal 11 damage. Hits enemy positions 1-2.',
      value: 11,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
      }
    },
    {
      id: 'rogue_evade',
      name: 'Backstep',
      cost: 1,
      type: 'block',
      target: 'self',
      prefPos: [1, 2, 3],
      desc: 'Gain 6 Block, then move backward 1.',
      value: 6,
      effect: function(state, hero, target, card) {
        DS.Combat.gainBlock(hero, card.value);
        DS.Combat.moveBackward(hero);
      }
    },
    {
      id: 'rogue_shadow_step',
      name: 'Shadow Step',
      cost: 1,
      type: 'attack',
      target: 'enemy',
      reach: [1, 2],
      prefPos: [2, 3],
      desc: 'Deal 5 damage to enemy positions 1-2, then move forward 1.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
        DS.Combat.moveForward(hero);
      }
    },
    {
      id: 'rogue_throwing_knife',
      name: 'Throwing Knife',
      cost: 1,
      type: 'attack',
      target: 'enemy_any',
      prefPos: [],
      desc: 'Deal 5 damage. Hits any enemy position.',
      value: 5,
      effect: function(state, hero, target, card) {
        DS.Combat.dealDamage(target, card.value);
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
      desc: 'Heal ally 6 HP.',
      value: 6,
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      prefPos: [],
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
      desc: 'Deal 6 damage to ALL enemies. Pos 4 only.',
      value: 6,
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
          var pick = alive[Math.floor(DS.Combat.random() * alive.length)];
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
          if (DS.Combat.random() < 0.25) {
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
      prefPos: [],
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
      prefPos: [],
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

// Helper: build full starting deck (2 copies of each base-kit card per hero).
// heroList: optional array of { cls, heroIdx, kit?, upgradedCards? }.
//   kit: array of card baseIds (this character's ROLLED base kit — see
//        DS.Meta.CLASS_KITS / rollRecruit). Falls back to the classic 4
//        starters (indices 0-3) when absent, so sims and legacy callers
//        behave exactly as before.
//   upgradedCards: baseIds this CHARACTER has upgraded (level-ups /
//        blacksmith) — applied here via DS.Cards.applyUpgrade, so bound
//        upgrades never leak into the shared pools.
DS.Cards.buildStartingDeck = function(heroList) {
  var deck = [];
  var entries = heroList || DS.Heroes.map(function(h, i) { return { cls: h.cls, heroIdx: i }; });
  entries.forEach(function(entry, runIdx) {
    var cards = DS.Cards[entry.cls];
    if (!cards) return;
    var heroDef = DS.Heroes.find(function(h) { return h.cls === entry.cls; });
    var heroName = heroDef ? heroDef.name : entry.cls;

    // Resolve kit card definitions (rolled kit ids, or classic starters 0-3)
    var kitDefs = [];
    if (entry.kit && entry.kit.length) {
      entry.kit.forEach(function(baseId) {
        for (var i = 0; i < cards.length; i++) {
          if (cards[i].id === baseId) { kitDefs.push(cards[i]); return; }
        }
      });
    }
    if (!kitDefs.length) kitDefs = cards.slice(0, 4);

    kitDefs.forEach(function(cardDef) {
      for (var c = 0; c < 2; c++) {
        var card = {
          id: cardDef.id + '_' + c,
          baseId: cardDef.id,
          name: cardDef.name,
          cost: cardDef.cost,
          type: cardDef.type,
          target: cardDef.target,
          reach: cardDef.reach ? cardDef.reach.slice() : undefined,
          prefPos: cardDef.prefPos.slice(),
          desc: cardDef.desc,
          value: cardDef.value,
          effect: cardDef.effect,
          heroIdx: runIdx,
          heroCls: entry.cls,
          heroName: heroName,
          upgraded: false
        };
        // Character-bound upgrades (level-ups / blacksmith)
        if (entry.upgradedCards && entry.upgradedCards.indexOf(cardDef.id) !== -1) {
          DS.Cards.applyUpgrade(card);
        }
        deck.push(card);
      }
    });
    (entry.skillCards || []).forEach(function(baseId) {
      var skillDef = cards.find(function(c) { return c.id === baseId; });
      if (!skillDef) return;
      var card = {
        id: skillDef.id + '_skill_' + runIdx,
        baseId: skillDef.id,
        name: skillDef.name,
        cost: skillDef.cost,
        type: skillDef.type,
        target: skillDef.target,
        reach: skillDef.reach ? skillDef.reach.slice() : undefined,
        prefPos: skillDef.prefPos.slice(),
        desc: skillDef.desc,
        value: skillDef.value,
        effect: skillDef.effect,
        heroIdx: runIdx,
        heroCls: entry.cls,
        heroName: heroName,
        upgraded: false
      };
      if ((entry.upgradedCards || []).indexOf(baseId) !== -1) DS.Cards.applyUpgrade(card);
      deck.push(card);
    });
  });
  return deck;
};

// Is this card part of ANY class's base kit (core or signature)?
// Base-kit cards are what make a character the character — they are NEVER
// offered as rewards or sold in shops. Derived from DS.Meta.CLASS_KITS so
// the kit definition is the single source of truth. (In headless sims
// DS.Meta isn't loaded — returns false, which matches sim behavior.)
DS.Cards.isBaseKitCard = function(cardId) {
  var kits = DS.Meta && DS.Meta.CLASS_KITS;
  if (!kits) return false;
  for (var cls in kits) {
    var spec = kits[cls];
    if (spec.core && spec.core.indexOf(cardId) !== -1) return true;
    if (spec.signatures) {
      for (var i = 0; i < spec.signatures.length; i++) {
        if (spec.signatures[i].id === cardId) return true;
      }
    }
  }
  return false;
};

// Helper: get a random card reward pool (cards from active classes, including reward-only cards)
// activeClasses: optional array of class strings to filter by (e.g. ['fighter', 'ranger'])
DS.Cards.getRewardPool = function(count, activeClasses) {
  count = count || 3;
  var classes = activeClasses || (DS.State && DS.State.run && DS.State.run.heroes ?
    DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).map(function(h) { return h.cls; }) :
    DS.Heroes.map(function(h) { return h.cls; }));
  classes = classes.filter(function(cls, idx) { return classes.indexOf(cls) === idx; });

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
    // Reward pool: indices 4+ (skip starters 0-3), minus base-kit cards
    // (kit signatures live at index 4+ but are character-bound — unattainable)
    for (var idx = 4; idx < cards.length; idx++) {
      var cardDef = cards[idx];
      if (DS.Cards.isBaseKitCard(cardDef.id)) continue;
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
        if (DS.Cards.isBaseKitCard(cardDef.id)) continue;
        if (!allCards.some(function(c) { return c.baseId === cardDef.id; })) {
          allCards.push({
            id: cardDef.id, baseId: cardDef.id, name: cardDef.name,
            cost: cardDef.cost, type: cardDef.type, target: cardDef.target, reach: cardDef.reach ? cardDef.reach.slice() : undefined,
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
  fighter_strike: { name: 'Strike+', desc: 'Deal 10 damage. Hits enemy positions 1-2.', value: 10, reach: [1, 2] },
  fighter_shield_block: { name: 'Shield Block+', desc: 'Gain 11 Block.', value: 11 },
  fighter_heavy_blow: {
    name: 'Heavy Blow+', desc: 'Deal 18 damage. Pos 1-2.', value: 18, prefPos: [1, 2]
  },
  fighter_rally: {
    name: 'Rally+', desc: '6 Block to ALL allies. Draw 1 card.', value: 6,
    effect: function(state, hero, target, card) {
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) { DS.Combat.gainBlock(h, card.value); });
      DS.Combat.drawCard();
    }
  },
  fighter_cleave: { name: 'Cleave+', desc: 'Deal 9 damage to ALL enemies.', value: 9 },
  fighter_taunt: {
    name: 'Taunt+', desc: 'Gain 8 Block. Enemies target you. Position 1 adds 2 Block.', value: 8,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value + (hero.pos === 1 ? 2 : 0));
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) { e.taunted = hero.id; });
    }
  },
  fighter_fortify: { name: 'Fortify+', desc: 'Gain Block = half current Block (min 5).', value: 5 },
  fighter_second_wind: { name: 'Second Wind+', desc: 'Heal 8 HP. Exhaust.', value: 8 },
  fighter_war_cry: {
    name: 'War Cry+', desc: 'Gain 3 Strength. Position 1 also gains 4 Block. Exhaust.', value: 3,
    effect: function(state, hero, target, card) {
      hero.strength = (hero.strength || 0) + card.value;
      if (hero.pos === 1) DS.Combat.gainBlock(hero, 4);
      card._exhaust = true;
    }
  },
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
  rogue_backstab: {
    name: 'Backstab+', desc: 'Deal 15 damage. Hits enemy positions 1-2 and applies 1 Vulnerable.', value: 15, reach: [1, 2],
    effect: function(state, hero, target, card) { DS.Combat.dealDamage(target, card.value); DS.Combat.applyVulnerable(target, 1); }
  },
  rogue_evade: {
    name: 'Backstep+', desc: 'Gain 9 Block, move backward 1, and draw 1 card.', value: 9,
    effect: function(state, hero, target, card) { DS.Combat.gainBlock(hero, card.value); DS.Combat.moveBackward(hero); DS.Combat.drawCard(); }
  },
  rogue_throwing_knife: {
    name: 'Throwing Knife+', desc: 'Deal 8 damage. Hits any enemy. Draw 1 card.', value: 8,
    effect: function(state, hero, target, card) { DS.Combat.dealDamage(target, card.value); DS.Combat.drawCard(); }
  },
  rogue_shadow_step: {
    name: 'Shadow Step+', desc: 'Deal 7 damage to enemy positions 1-2, apply 2 Bleed, then move forward 1.', value: 7, reach: [1, 2],
    effect: function(state, hero, target, card) { DS.Combat.dealDamage(target, card.value); DS.Combat.applyBleed(target, 2); DS.Combat.moveForward(hero); }
  },
  rogue_flurry: {
    name: 'Flurry+', desc: 'Strike 3 times for 4 damage. The first hit applies 1 Bleed.', value: 4,
    effect: function(state, hero, target, card) {
      for (var i = 0; i < 3; i++) { DS.Combat.dealDamage(target, card.value); if (i === 0) DS.Combat.applyBleed(target, 1); }
    }
  },
  rogue_smoke_bomb: {
    name: 'Smoke Bomb+', desc: 'Gain 7 Block. Swap positions with an ally. Draw 1 card.', value: 7,
    effect: function(state, hero, target, card) {
      DS.Combat.gainBlock(hero, card.value);
      var tmp = hero.pos; hero.pos = target.pos; target.pos = tmp;
      DS.Combat.drawCard();
    }
  },
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
  cleric_smite: {
    name: 'Smite+', desc: 'Deal 8 damage. Apply 1 Weak.', value: 8,
    effect: function(state, hero, target, card) { DS.Combat.dealDamage(target, card.value); DS.Combat.applyWeak(target, 1); }
  },
  cleric_divine_shield: { name: 'Divine Shield+', desc: 'Give ally 10 Block.', value: 10 },
  cleric_heal: {
    name: 'Heal+', desc: 'Heal ally 9 HP and give them 3 Block.', value: 9,
    effect: function(state, hero, target, card) { DS.Combat.healTarget(target, card.value); DS.Combat.gainBlock(target, 3); }
  },
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
  cleric_cleansing_light: { name: 'Cleansing Light+', desc: 'Heal all allies 4 HP. Remove all Weak.', value: 4 },
  cleric_martyrdom: { name: 'Martyrdom+', desc: 'Lose 5 HP. Heal all other allies 10 HP.', value: 10 },
  cleric_holy_nova: {
    name: 'Holy Nova+', desc: 'Deal 7 damage to all enemies. Heal all allies 4 HP.', value: 7,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
      });
      DS.State.run.heroes.filter(function(h) { return h.hp > 0; }).forEach(function(h) {
        DS.Combat.healTarget(h, 4);
      });
    }
  },

  // --- WIZARD ---
  wizard_magic_missile: { name: 'Magic Missile+', desc: 'Deal 9 damage. Hits any enemy.', value: 9 },
  wizard_arcane_ward: {
    name: 'Arcane Ward+', desc: 'Gain 8 Block. Draw 1 card.', value: 8,
    effect: function(state, hero, target, card) { DS.Combat.gainBlock(hero, card.value); DS.Combat.drawCard(); }
  },
  wizard_fireball: { name: 'Fireball+', desc: 'Deal 8 damage to ALL enemies. Pos 4 only.', value: 8 },
  wizard_arcane_intellect: { name: 'Arcane Intellect+', desc: 'Draw 4 cards. Pos 4 only.', value: 4 },
  wizard_chain_lightning: {
    name: 'Chain Lightning+', desc: 'Strike random enemies 5 times for 4 damage.', value: 4,
    effect: function(state, hero, target, card) {
      for (var i = 0; i < 5; i++) {
        var alive = DS.State.combat.enemies.filter(function(e) { return e.hp > 0; });
        if (alive.length === 0) break;
        var pick = alive[Math.floor(DS.Combat.random() * alive.length)];
        DS.Combat.dealDamage(pick, card.value);
      }
    }
  },
  wizard_frost_nova: {
    name: 'Frost Nova+', desc: '3 damage to all enemies. 40% stun.', value: 3,
    effect: function(state, hero, target, card) {
      DS.State.combat.enemies.filter(function(e) { return e.hp > 0; }).forEach(function(e) {
        DS.Combat.dealDamage(e, card.value);
        if (DS.Combat.random() < 0.4) {
          DS.Combat.applyStatus(e, 'stunned', 1);
        }
      });
    }
  },
  wizard_mana_shield: {
    name: 'Mana Shield+', desc: 'Convert energy to 5 Block per energy. Spending 2+ energy draws 1 card.', value: 5,
    effect: function(state, hero, target, card) {
      var spent = DS.State.combat.energy;
      DS.State.combat.energy = 0;
      DS.Combat.gainBlock(hero, spent * card.value);
      if (spent >= 2) DS.Combat.drawCard();
    }
  },
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
      if (target.hp > 0 && DS.Combat.random() < 0.40) {
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
  ranger_aimed_shot: { name: 'Aimed Shot+', desc: 'Deal 13 damage. Hits enemy positions 2-4.', value: 13, reach: [2, 3, 4] },
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
        var pick = alive[Math.floor(DS.Combat.random() * alive.length)];
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
  necromancer_hex: {
    name: 'Hex+', desc: 'Apply 3 Weak. If already Weak, also apply 2 Vulnerable.', value: 3,
    effect: function(state, hero, target, card) {
      var wasWeak = target.weak > 0;
      DS.Combat.applyWeak(target, card.value);
      if (wasWeak) DS.Combat.applyVulnerable(target, 2);
    }
  },
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
  paladin_righteous_blow: {
    name: 'Righteous Blow+', desc: 'Deal 11 damage. Position 1 also gains 3 Block.', value: 11,
    effect: function(state, hero, target, card) { DS.Combat.dealDamage(target, card.value); if (hero.pos === 1) DS.Combat.gainBlock(hero, 3); }
  },
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
  if (def.reach) card.reach = def.reach.slice();
  if (def.innate !== undefined) card.innate = def.innate;
  if (def.ethereal !== undefined) card.ethereal = def.ethereal;
  card.upgraded = true;
  return card;
};
// New reward cards use the same canonical definitions for draft, play and reload.
(function() {
  function add(cls, id, name, cost, type, target, desc, effect, extra) {
    DS.Cards[cls].push(Object.assign({id:cls+'_'+id,name:name,cost:cost,type:type,target:target,prefPos:[],desc:desc,value:0,effect:effect},extra || {}));
  }
  add('fighter','intercept','Intercept',1,'block','ally','Gain 7 Block. Guard an ally until next turn.',function(s,h,t) { DS.Combat.gainBlock(h,7); DS.Combat.guardAlly(h,t); });
  add('fighter','riposte','Riposte',1,'block','self','Gain 5 Block. Retaliate for 5 damage against the next 2 attacks this round.',function(s,h) { DS.Combat.gainBlock(h,5); h.riposte=2; h.riposteDamage=5; });
  add('fighter','hook','Grappling Hook',1,'attack','enemy_any','Deal 4 damage. Pull target forward 2 ranks.',function(s,h,t,c) { DS.Combat.dealDamage(t,c.value); DS.Combat.displace(t,-2); },{value:4});
  add('fighter','sunder','Sunder Armor',2,'attack','enemy','Destroy up to 12 Block, then deal 9 damage.',function(s,h,t,c) { t.block=Math.max(0,t.block-12); DS.Combat.dealDamage(t,c.value); },{value:9});
  add('rogue','reserve_blade','Reserve Blade',1,'attack','enemy','Retain. Deal 9 damage when the moment is right.',function(s,h,t,c) { DS.Combat.dealDamage(t,c.value); },{retain:true,value:9});
  add('rogue','improvise','Improvise',0,'skill','none','Discard your leftmost other card. Draw 2. Exhaust.',function(s,h,t,c) { var i=s.combat.hand.findIndex(function(x) { return x!==c; }); if(i>=0) DS.Combat.discardCard(i); DS.Combat.drawCard(); DS.Combat.drawCard(); },{exhaust:true});
  add('rogue','escape_plan','Escape Plan',1,'skill','self','Innate. Gain 4 Block whenever you deliberately discard a card this combat. Exhaust.',function(s,h) { h.discardPayoff=(h.discardPayoff || 0)+4; },{innate:true,exhaust:true});
  add('wizard','overcharge','Overcharge',0,'skill','none','The leftmost other card costs 0 this turn. Exhaust.',function(s,h,t,c) { var card=s.combat.hand.find(function(x) { return x!==c && !x.unplayable && !x.curse && !x.xCost; }); if(card) card._turnCost=0; },{exhaust:true});
  add('wizard','arcane_barrage','Arcane Barrage',0,'attack','enemy_any','Spend all energy. Deal 6 damage per energy spent.',function(s,h,t,c) { for(var i=0;i<c._energySpent && t.hp>0;i++) DS.Combat.dealDamage(t,c.value); },{xCost:true,value:6});
  add('wizard','conjure','Conjure Shards',1,'skill','none','Create two free Arcane Shards. Unused shards fade at turn end. Exhaust.',function(s,h,t,c) { DS.Combat.generateCard('tactical_shard',c.heroIdx); DS.Combat.generateCard('tactical_shard',c.heroIdx); },{exhaust:true});
  DS.Cards.tactical=[{id:'tactical_shard',name:'Arcane Shard',cost:0,type:'attack',target:'enemy_any',prefPos:[],value:4,desc:'Deal 4 damage. Ethereal. Exhaust.',ethereal:true,exhaust:true,effect:function(s,h,t,c) { DS.Combat.dealDamage(t,c.value); }}, {id:'tactical_wound',name:'Wound',cost:0,type:'status',target:'none',prefPos:[],value:0,unplayable:true,desc:'Unplayable. Occupies a draw this combat.',effect:function() {}}];
  // Starting-kit construction preserves keyword metadata as well as ordinary values.
  var build=DS.Cards.buildStartingDeck;
  DS.Cards.buildStartingDeck=function(entries) { return build(entries).map(function(card) { var def=DS.Cards[card.heroCls].find(function(c) { return c.id===card.baseId; }); ['reach','retain','innate','ethereal','exhaust','xCost','unplayable'].forEach(function(key) { var upgrade=card.upgraded && DS.Cards.UPGRADE_DEFS[card.baseId]; var source=upgrade && upgrade[key]!==undefined ? upgrade : def; if(source[key]!==undefined) card[key]=Array.isArray(source[key]) ? source[key].slice() : source[key]; }); return card; }); };
})();

(function() {
  var reward=DS.Cards.getRewardPool;
  DS.Cards.getRewardPool=function(count,classes) { return reward(count,classes).map(function(card) { var def=DS.Cards[card.heroCls].find(function(c) { return c.id===card.baseId; }); ['reach','retain','innate','ethereal','exhaust','xCost','unplayable'].forEach(function(key) { var upgrade=card.upgraded && DS.Cards.UPGRADE_DEFS[card.baseId]; var source=upgrade && upgrade[key]!==undefined ? upgrade : def; if(source[key]!==undefined) card[key]=Array.isArray(source[key]) ? source[key].slice() : source[key]; }); return card; }); };
})();
