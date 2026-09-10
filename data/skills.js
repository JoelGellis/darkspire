// Persistent hero skill trees. Each recruit gets three class-flavored branches
// with a random selection of nodes; the rolled tree is saved with that hero.
window.DS = window.DS || {};

DS.Skills = (function () {
  'use strict';

  var branchNames = {
    fighter: ['Ironwall', 'Command', 'Execution'],
    rogue: ['Ambush', 'Footwork', 'Venom'],
    cleric: ['Mercy', 'Liturgy', 'Judgment'],
    wizard: ['Aether', 'Wardcraft', 'Cataclysm'],
    barbarian: ['Fury', 'Bloodsong', 'Ravager'],
    ranger: ['Hunt', 'Trailcraft', 'Deadeye'],
    necromancer: ['Grave', 'Pact', 'Plague'],
    paladin: ['Oath', 'Bulwark', 'Retribution']
  };

  var cardPools = {
    fighter: ['fighter_taunt', 'fighter_cleave', 'fighter_shield_bash'],
    rogue: ['rogue_poison_blade', 'rogue_flurry', 'rogue_assassinate'],
    cleric: ['cleric_bless', 'cleric_holy_fire', 'cleric_sanctuary'],
    wizard: ['wizard_arcane_intellect', 'wizard_chain_lightning', 'wizard_meteor'],
    barbarian: ['barbarian_blood_rage', 'barbarian_rampage', 'barbarian_bloodlust'],
    ranger: ['ranger_snare_trap', 'ranger_mark_prey', 'ranger_called_shot'],
    necromancer: ['necromancer_hex', 'necromancer_plague_spread', 'necromancer_soul_siphon'],
    paladin: ['paladin_righteous_blow', 'paladin_guardian_stance', 'paladin_retribution']
  };

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }

  function candidates(cls, branch) {
    var cards = cardPools[cls] || [];
    var cardId = cards[branch] || cards[0];
    var prefix = cls + '_' + branch;
    var pool = [
      { id: prefix + '_vigor', name: 'Vigor', kind: 'maxHp', amount: 4, desc: '+4 maximum HP.' },
      { id: prefix + '_force', name: 'Force', kind: 'power', amount: 1, desc: '+1 damage to this hero\'s attacks.' },
      { id: prefix + '_guard', name: 'Guard', kind: 'block', amount: 1, desc: '+1 Block whenever this hero gains Block.' },
      { id: prefix + '_technique', name: 'Signature Technique', kind: 'card', cardId: cardId, desc: 'Add one ' + cardId.replace(cls + '_', '').replace(/_/g, ' ') + ' to this hero\'s starting deck.' }
    ];
    var def = (DS.Cards[cls] || []).find(function(c) { return c.id === cardId; });
    pool[3].name = def ? def.name : 'Signature Technique';
    // Each specialization always ends in its own technique, with two rolled stat nodes.
    return shuffle(pool.slice(0, 3)).slice(0, 2).concat([pool[3]]);
  }

  function generate(cls) {
    var names = branchNames[cls] || ['Discipline', 'Instinct', 'Mastery'];
    var tree = { version: 2, branches: [] };
    for (var b = 0; b < 3; b++) {
      var picked = candidates(cls, b);
      picked = picked.slice(0, 3);
      picked.forEach(function (node, index) {
        node.requires = index ? picked[index - 1].id : null;
        node.unlocked = false;
      });
      tree.branches.push({ id: cls + '_branch_' + b, subclassId: cls + '_subclass_' + b, name: names[b], nodes: picked });
    }
    return tree;
  }

  function valid(tree) {
    return tree && Array.isArray(tree.branches) && tree.branches.length === 3 && tree.branches.every(function(b) {
      return b && Array.isArray(b.nodes) && b.nodes.length === 3 && b.nodes.every(function(n) {
        return n && typeof n.id === 'string' && ['maxHp','power','block','card'].indexOf(n.kind) >= 0;
      });
    });
  }
  function repair(tree, cls) {
    tree.version = 2;
    tree.branches.forEach(function(b, bi) { b.subclassId = b.subclassId || cls + '_subclass_' + bi; b.nodes.forEach(function(n, i) {
      n.requires = i ? b.nodes[i - 1].id : null;
      if (n.kind !== 'card') n.amount = n.kind === 'maxHp' ? 4 : 1;
      if (n.kind === 'card' && !(DS.Cards[cls] || []).some(function(c) { return c.id === n.cardId; })) {
        n.cardId = cardPools[cls][bi];
        var def = DS.Cards[cls].find(function(c) { return c.id === n.cardId; });
        n.name = def.name; n.desc = 'Add one ' + def.name + ' to the starting deck.';
      }
    }); });
  }
  function subclasses(cls) {
    var names = branchNames[cls] || ['Discipline', 'Instinct', 'Mastery'];
    return names.map(function(name, i) { return { id: cls + '_subclass_' + i, name: name }; });
  }
  function nameFor(cls, id) {
    var found = subclasses(cls).find(function(s) { return s.id === id; });
    return found ? found.name : null;
  }
  return { generate: generate, valid: valid, repair: repair, subclasses: subclasses, nameFor: nameFor };
}());
