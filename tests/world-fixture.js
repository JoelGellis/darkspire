// Isolated visual destinations. Real modules, in-memory storage, no player saves.
window.addEventListener('load', function() {
  var scenario = window.fixtureScenario;
  if (['town','map','combat','boss','reward','rest','train','purge','shop','event','summary'].indexOf(scenario) === -1) return;
  if (scenario === 'town') { DS.State.screen = 'town'; DS.UI.render(); return; }
  DS.Campfire._offer = null; DS.Campfire._selected = []; DS.Campfire._buildOffer();
  [0,1,2,3].forEach(DS.Campfire.toggleSelect); DS.Campfire.embark();
  var run = DS.State.run;
  run.gold = 185;
  if (scenario === 'map') { DS.UI.render(); return; }
  var node = run.map.floors[1][0];
  node.visited = true; run.currentNode = node.id; run.floor = 1;
  if (scenario === 'combat' || scenario === 'boss') {
    DS.Combat.initCombat(scenario === 'boss' ? DS.Enemies.boss[1] : DS.Enemies.normal[0]);
    DS.State.screen = 'combat'; DS.UI.render(); return;
  }
  if (scenario === 'event') { DS.Game._startEvent(); return; }
  if (scenario === 'summary') run._retreated = true;
  if (scenario === 'reward') { run._lastGoldReward = 23; DS.Map.completeNode(run.map, node.id); }
  if (scenario === 'rest' || scenario === 'train' || scenario === 'purge') run.heroes[0].hp -= 17;
  DS.State.screen = scenario === 'train' || scenario === 'purge' ? 'rest' : scenario;
  DS.UI.render();
  if (scenario === 'train') DS.UI.renderTrainScreen(document.getElementById('game-root'));
  if (scenario === 'purge') DS.UI.renderPurgeScreen(document.getElementById('game-root'));
});
