window.DS = window.DS || {};

DS.Game = {
  // ===== BOOT =====
  init: function() {
    if (DS.Meta && DS.Meta.hasSave()) {
      DS.Meta.load();
      DS.State.screen = 'town';
    } else {
      DS.State.screen = 'title';
    }
    DS.UI.render();
  },

  // ===== NEW RUN =====
  startRun: function() {
    // Build party from caravan selection if available
    var party = null;
    if (DS.State._selectedParty && DS.Meta) {
      party = DS.State._selectedParty.map(function(p) {
        var rh = DS.Meta.heroRoster[p.rosterIndex];
        return {
          heroClass: p.heroClass,
          rosterIndex: p.rosterIndex,
          runsSurvived: rh ? rh.runsSurvived : 0
        };
      });
      // Build roster map for summary screen
      DS.State._runRosterMap = {};
      party.forEach(function(p, i) {
        DS.State._runRosterMap[i] = p.rosterIndex;
      });
    }

    DS.State.newRun(party);
    var run = DS.State.run;
    run.map = DS.Map.generate();
    run.floor = 0;
    run.currentNode = null;
    run.visitedEvents = [];

    // Auto-complete start node (floor 0) so player picks from floor 1
    var startNode = run.map.floors[0][0];
    DS.Map.completeNode(run.map, startNode.id);
    run.currentNode = startNode.id;

    DS.State.screen = 'map';
    DS.UI.render();
  },

  // ===== NODE SELECTION (from map click) =====
  selectNode: function(nodeId) {
    var run = DS.State.run;
    if (!run || !run.map) return;

    // Verify node is available
    var available = DS.Map.getAvailableNodes(run.map, run.currentNode);
    if (available.indexOf(nodeId) === -1) return;

    // Find the node
    var node = DS.Game._findNode(nodeId);
    if (!node) return;

    // Mark visited (but not completed yet — completed after the encounter resolves)
    node.visited = true;
    run.currentNode = nodeId;

    // Track floor for encounter scaling
    run.floor = node.floor;

    // Route based on node type
    switch (node.type) {
      case 'combat':
        DS.Game.startCombat('normal');
        break;
      case 'elite':
        DS.Game.startCombat('elite');
        break;
      case 'boss':
        DS.Game.startCombat('boss');
        break;
      case 'rest':
        DS.State.screen = 'rest';
        DS.UI.render();
        break;
      case 'event':
        DS.Game._startEvent();
        break;
      case 'shop':
        DS.State.screen = 'shop';
        DS.UI.render();
        break;
      default:
        // Unknown type, treat as combat
        DS.Game.startCombat('normal');
    }
  },

  // ===== START COMBAT =====
  startCombat: function(tier) {
    var pool = DS.Enemies.pickEncounter(tier);
    // Scale enemies by floor
    if (DS.Enemies.scaleEncounter && DS.State.run) {
      pool = DS.Enemies.scaleEncounter(pool, DS.State.run.floor);
    }
    DS.Combat.initCombat(pool);
    DS.State.screen = 'combat';
    DS.UI.render();
    DS.Combat.logMsg('A new combat begins. Steel yourself.', 'system');
  },

  // ===== COMBAT OUTCOMES =====
  onCombatVictory: function() {
    var run = DS.State.run;

    // Check beggar's debt
    if (DS.Events && DS.Events.checkBeggarDebt) {
      var beggarMsg = DS.Events.checkBeggarDebt(DS.State);
      if (beggarMsg) {
        run._beggarMessage = beggarMsg;
      }
    }

    // Complete current node
    DS.Game._completeCurrentNode();

    // Check if boss was beaten (floor 6 = boss)
    var node = DS.Game._findNode(run.currentNode);
    if (node && node.type === 'boss') {
      // Victory — summary screen handles meta rewards
      DS.State.stats.floorsCleared = 7;
      DS.State.screen = 'summary';
      DS.UI.render();
      return;
    }

    // Show reward screen
    DS.State.screen = 'reward';
    DS.UI.render();
  },

  onCombatDefeat: function() {
    DS.State.screen = 'summary';
    DS.UI.render();
  },

  // ===== AFTER SCREENS → RETURN TO MAP =====
  afterReward: function() {
    DS.Game._returnToMap();
  },

  afterRest: function() {
    DS.Game._completeCurrentNode();
    DS.Game._returnToMap();
  },

  afterEvent: function() {
    // Check beggar's debt after events too
    if (DS.Events && DS.Events.checkBeggarDebt) {
      var beggarMsg = DS.Events.checkBeggarDebt(DS.State);
      if (beggarMsg && DS.State.run) {
        DS.State.run._beggarMessage = beggarMsg;
      }
    }
    DS.Game._completeCurrentNode();
    DS.Game._returnToMap();
  },

  afterShop: function() {
    DS.Game._completeCurrentNode();
    DS.Game._returnToMap();
  },

  // ===== INTERNAL HELPERS =====
  _returnToMap: function() {
    DS.State.screen = 'map';
    DS.UI.render();
  },

  _completeCurrentNode: function() {
    var run = DS.State.run;
    if (run && run.map && run.currentNode) {
      DS.Map.completeNode(run.map, run.currentNode);
    }
  },

  _findNode: function(nodeId) {
    var run = DS.State.run;
    if (!run || !run.map) return null;
    var floors = run.map.floors;
    for (var f = 0; f < floors.length; f++) {
      for (var n = 0; n < floors[f].length; n++) {
        if (floors[f][n].id === nodeId) return floors[f][n];
      }
    }
    return null;
  },

  _startEvent: function() {
    var run = DS.State.run;
    run.visitedEvents = run.visitedEvents || [];
    var event = DS.Events.pickRandom(run.visitedEvents);
    if (event) {
      run._currentEvent = event;
      run.visitedEvents.push(event.id);
    } else {
      // Fallback — no events available, just return to map
      DS.Game._completeCurrentNode();
      DS.Game._returnToMap();
      return;
    }
    DS.State.screen = 'event';
    DS.UI.render();
  },

  // ===== SCREEN SWITCH (legacy compat) =====
  switchScreen: function(screenName) {
    DS.State.screen = screenName;
    DS.UI.render();
  }
};

// ===== BOOT =====
window.addEventListener('DOMContentLoaded', function() {
  DS.Game.init();
});
