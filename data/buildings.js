window.DS = window.DS || {};

DS.Buildings = {

  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith',
    desc: 'Upgrade a hero\'s base card permanently. Upgraded cards gain +50% value.',
    icon: '\u2692\uFE0F',
    type: 'service',
    useCost: 40,

    // Returns base card defs (indices 0-3) that this hero hasn't upgraded yet
    getUpgradeableCards: function(rosterHero) {
      if (!rosterHero || !rosterHero.cls) return [];
      var cls = rosterHero.cls;
      var cards = DS.Cards[cls];
      if (!cards) return [];
      var upgraded = rosterHero.upgradedCards || [];
      var result = [];
      for (var i = 0; i < 4; i++) {
        if (cards[i] && upgraded.indexOf(cards[i].id) === -1) {
          result.push(cards[i]);
        }
      }
      return result;
    },

    // Mark a card as upgraded on the roster hero
    applyUpgrade: function(rosterHero, cardBaseId) {
      if (!rosterHero) return;
      if (!rosterHero.upgradedCards) rosterHero.upgradedCards = [];
      if (rosterHero.upgradedCards.indexOf(cardBaseId) === -1) {
        rosterHero.upgradedCards.push(cardBaseId);
      }
    }
  },

  chapel: {
    id: 'chapel',
    name: 'Chapel',
    desc: 'Bless your heroes. All heroes gain +3 max HP per level.',
    icon: '\u26EA',
    type: 'upgrade',
    maxLevel: 3,
    costs: [50, 100, 150],
    bonusPerLevel: 3,

    getBonusAtLevel: function(level) {
      return level * this.bonusPerLevel;
    },

    getUpgradeCost: function(currentLevel) {
      if (currentLevel >= this.maxLevel) return null;
      return this.costs[currentLevel];
    }
  },

  tavern: {
    id: 'tavern',
    name: 'Tavern',
    desc: 'Expand the caravan. +1 hero offered per level.',
    icon: '\uD83C\uDF7A',
    type: 'upgrade',
    maxLevel: 2,
    costs: [60, 120],
    slotsPerLevel: 1,

    // Base 4 caravan slots + level bonus
    getSlotsAtLevel: function(level) {
      return 4 + (level * this.slotsPerLevel);
    },

    getUpgradeCost: function(currentLevel) {
      if (currentLevel >= this.maxLevel) return null;
      return this.costs[currentLevel];
    }
  }

};

// Helper: list all buildings
DS.Buildings.list = function() {
  return [DS.Buildings.blacksmith, DS.Buildings.chapel, DS.Buildings.tavern];
};

// Helper: get building by id string
DS.Buildings.get = function(id) {
  var all = DS.Buildings.list();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) return all[i];
  }
  return null;
};
