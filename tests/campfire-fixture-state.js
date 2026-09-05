// Loaded only by campfire-fixtures.html after the real game modules.
(function() {
  'use strict';
  var scenario = window.fixtureScenario;
  DS.Meta.newGame();
  if (scenario === 'fresh') return;
  DS.Meta.runCount = 7;
  DS.Meta.gold = 185;
  var classes = DS.Heroes.map(function(h) { return h.cls; });
  var rosterClasses = scenario === 'full' ? classes : ['fighter', 'cleric', 'rogue', 'wizard'];
  DS.Meta.heroRoster = rosterClasses.map(function(cls, i) {
    var hero = DS.Meta.rollRecruit(cls);
    hero.runsSurvived = i + 1;
    hero.level = Math.min(6, i + 2);
    hero.xp = 3;
    return hero;
  });
  DS.Meta._injure(DS.Meta.heroRoster.findIndex(function(h) { return h.heroClass === 'cleric'; }));
  // Exercise actual death removal before building the offer. The same class
  // may return as a distinct fresh recruit; the old veteran never returns.
  DS.Meta.killHero(DS.Meta.heroRoster.findIndex(function(h) { return h.heroClass === 'rogue'; }));
  if (scenario === 'full') DS.Meta.addHeroToRoster(DS.Meta.rollRecruit('rogue'));
  if (scenario === 'empty') DS.Meta.heroRoster = [];
  if (scenario === 'long') {
    DS.Meta.heroRoster[0].name = '<Edric & the Ashen Watch>';
    DS.Meta.graveyard = Array.from({length: 9}, function(_, i) { return {heroClass: classes[i % 8], runNumber:i}; });
  }
  DS.Meta.save();
  if (scenario === 'resume' || scenario === 'corrupt') {
    DS.State.newRun();
    DS.State.run.map = DS.Map.generate();
    DS.State.run.currentNode = DS.State.run.map.floors[0][0].id;
    DS.Map.completeNode(DS.State.run.map, DS.State.run.currentNode);
    DS.State.screen = 'map';
    DS.State.run.gold = 43;
    DS.State.save();
    if (scenario === 'corrupt') localStorage.setItem('darkspire_save', '{broken');
  }
  // Deterministic all-class visual coverage without changing game recruitment.
  DS.Campfire._offer = null;
  DS.Campfire._buildOffer();
  if (['returning', 'long', 'resume', 'corrupt'].indexOf(scenario) !== -1) {
    DS.Campfire._offer = DS.Campfire._offer.filter(function(e) { return e.source === 'roster'; });
    ['barbarian', 'ranger', 'necromancer', 'paladin'].forEach(function(cls) {
      var recruit = DS.Meta.rollRecruit(cls);
      DS.Campfire._offer.push({source:'recruit', rosterIdx:null, recruit:recruit,
        heroClass:cls, heroDef:DS.Campfire._heroDef(cls), name:DS.Campfire._heroDef(cls).name,
        variant:DS.Meta.getKitVariant(recruit), level:1, xp:0, runsSurvived:0, injury:null});
    });
  }
})();
