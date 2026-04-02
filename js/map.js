/*
 * DARKSPIRE — Dungeon Map Module
 * Slay the Spire-style branching dungeon map rendered on canvas.
 *
 * Namespace: DS.Map
 */

(function () {
  "use strict";

  window.DS = window.DS || {};

  // ── Constants ──────────────────────────────────────────────────────────

  var FLOORS = 7; // 0 = start, 1-5 = mid, 6 = boss
  var CANVAS_W = 500;
  var CANVAS_H = 700;
  var NODE_RADIUS = 15;
  var BOSS_RADIUS = 20;
  var FLOOR_PADDING_Y = 50; // top/bottom padding
  var SIDE_PADDING_X = 60;

  // Node type colors — richer, more distinct
  var TYPE_COLORS = {
    start:  "#c0b090",
    combat: "#c83838",
    elite:  "#e0a020",
    rest:   "#e88030",
    event:  "#b060e0",
    shop:   "#40b050",
    boss:   "#e82020",
  };

  // Path colors
  var PATH_DEFAULT = "rgba(140, 110, 70, 0.35)";
  var PATH_VISITED = "rgba(210, 180, 100, 0.8)";
  var GLOW_CURRENT = "rgba(255, 215, 60, 0.9)";

  // ── Utility ────────────────────────────────────────────────────────────

  var _nextId = 0;
  function uid() { return "n" + (_nextId++); }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) { return arr[rand(0, arr.length - 1)]; }

  function chance(pct) { return Math.random() < pct; }

  // Convert node logical coords (floor, x 0-1) to canvas pixel coords.
  function nodePixel(node) {
    var usableH = CANVAS_H - FLOOR_PADDING_Y * 2;
    var py = CANVAS_H - FLOOR_PADDING_Y - (node.floor / (FLOORS - 1)) * usableH;
    var usableW = CANVAS_W - SIDE_PADDING_X * 2;
    var px = SIDE_PADDING_X + node.x * usableW;
    return { x: px, y: py };
  }

  // ── Map Generation ─────────────────────────────────────────────────────

  function generateFloorNodes(floor, count) {
    var nodes = [];
    for (var i = 0; i < count; i++) {
      // Spread evenly with some jitter
      var baseX = (i + 1) / (count + 1);
      var jitter = (Math.random() - 0.5) * 0.08;
      var x = Math.max(0.05, Math.min(0.95, baseX + jitter));
      nodes.push({
        id: uid(),
        floor: floor,
        x: x,
        type: "combat", // assigned later
        visited: false,
        completed: false,
      });
    }
    // Sort by x so connections make sense
    nodes.sort(function (a, b) { return a.x - b.x; });
    return nodes;
  }

  function assignType(node, floorNodes, connections) {
    var f = node.floor;

    // Fixed types
    if (f === 0) { node.type = "start"; return; }
    if (f === 6) { node.type = "boss"; return; }
    if (f === 1) { node.type = "combat"; return; }

    // Elite: floors 3-5, ~15%
    if (f >= 3 && f <= 5 && chance(0.15)) { node.type = "elite"; return; }
    // Rest: floors 2-5, ~15%  (floor 5 handled separately below)
    if (f >= 2 && f <= 5 && chance(0.15)) { node.type = "rest"; return; }
    // Event: floors 1-5, ~15%
    if (f >= 1 && f <= 5 && chance(0.15)) { node.type = "event"; return; }
    // Shop: floors 2-5, ~10%
    if (f >= 2 && f <= 5 && chance(0.10)) { node.type = "shop"; return; }

    node.type = "combat";
  }

  // Check if a parent node (on floor below) is a rest node.
  function parentIsRest(node, mapData) {
    for (var i = 0; i < mapData.connections.length; i++) {
      var c = mapData.connections[i];
      if (c.to === node.id) {
        var parent = findNode(mapData, c.from);
        if (parent && parent.type === "rest") return true;
      }
    }
    return false;
  }

  function findNode(mapData, id) {
    for (var f = 0; f < mapData.floors.length; f++) {
      for (var n = 0; n < mapData.floors[f].length; n++) {
        if (mapData.floors[f][n].id === id) return mapData.floors[f][n];
      }
    }
    return null;
  }

  function generate() {
    _nextId = 0;
    var floors = [];
    var connections = [];

    // Floor 0 — single start node
    floors[0] = [{
      id: uid(), floor: 0, x: 0.5, type: "start",
      visited: false, completed: false,
    }];

    // Floors 1-5 — random 2-4 nodes
    for (var f = 1; f <= 5; f++) {
      var count = rand(2, 4);
      floors[f] = generateFloorNodes(f, count);
    }

    // Floor 6 — boss
    floors[6] = [{
      id: uid(), floor: 6, x: 0.5, type: "boss",
      visited: false, completed: false,
    }];

    // ── Create connections (bottom-up) ──
    for (var f = 0; f < FLOORS - 1; f++) {
      var lower = floors[f];
      var upper = floors[f + 1];

      // For each lower node, connect to 1-2 upper nodes, preferring closest by x.
      // Then ensure every upper node has at least one incoming connection.

      // Sort upper by x
      var upperSorted = upper.slice().sort(function (a, b) { return a.x - b.x; });

      var connectedUpper = {};

      for (var li = 0; li < lower.length; li++) {
        var lNode = lower[li];
        // Find closest upper nodes
        var scored = upperSorted.map(function (u) {
          return { node: u, dist: Math.abs(u.x - lNode.x) };
        }).sort(function (a, b) { return a.dist - b.dist; });

        // Connect to 1 or 2
        var numConn = (lower.length === 1 && upper.length > 1) ? Math.min(2, upper.length) : rand(1, 2);
        // If this is the only lower node, connect to all upper nodes
        if (lower.length === 1) numConn = upper.length;

        for (var ci = 0; ci < Math.min(numConn, scored.length); ci++) {
          var target = scored[ci].node;
          connections.push({ from: lNode.id, to: target.id });
          connectedUpper[target.id] = true;
        }
      }

      // Ensure all upper nodes have at least one incoming connection
      for (var ui = 0; ui < upper.length; ui++) {
        if (!connectedUpper[upper[ui].id]) {
          // Connect from the nearest lower node
          var best = null, bestDist = Infinity;
          for (var li2 = 0; li2 < lower.length; li2++) {
            var d = Math.abs(lower[li2].x - upper[ui].x);
            if (d < bestDist) { bestDist = d; best = lower[li2]; }
          }
          connections.push({ from: best.id, to: upper[ui].id });
        }
      }
    }

    // Deduplicate connections
    var seen = {};
    connections = connections.filter(function (c) {
      var key = c.from + "->" + c.to;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    // ── Try to reduce line crossings ──
    // For each floor, check if swapping two nodes' x positions reduces crossings.
    for (var f = 1; f <= 5; f++) {
      var fl = floors[f];
      if (fl.length < 2) continue;
      for (var attempt = 0; attempt < 10; attempt++) {
        var improved = false;
        for (var i = 0; i < fl.length - 1; i++) {
          for (var j = i + 1; j < fl.length; j++) {
            var crossBefore = countCrossings(floors, connections, f);
            // Swap x
            var tmpX = fl[i].x;
            fl[i].x = fl[j].x;
            fl[j].x = tmpX;
            var crossAfter = countCrossings(floors, connections, f);
            if (crossAfter < crossBefore) {
              improved = true; // keep swap
            } else {
              // revert: fl[i] currently has j's original x, fl[j] has i's original (tmpX)
              fl[j].x = fl[i].x;
              fl[i].x = tmpX;
            }
          }
        }
        if (!improved) break;
      }
    }

    var mapData = { floors: floors, connections: connections };

    // ── Assign node types ──
    for (var f = 0; f < FLOORS; f++) {
      for (var n = 0; n < floors[f].length; n++) {
        assignType(floors[f][n], floors[f], connections);
      }
    }

    // ── Enforce constraints ──

    // No two adjacent rests on the same path
    for (var f = 1; f < FLOORS; f++) {
      for (var n = 0; n < floors[f].length; n++) {
        var node = floors[f][n];
        if (node.type === "rest" && parentIsRest(node, mapData)) {
          node.type = "combat";
        }
      }
    }

    // Floor 5 must have at least one rest
    var hasRest5 = floors[5].some(function (n) { return n.type === "rest"; });
    if (!hasRest5) {
      // Pick one node on floor 5 that isn't creating an adjacent rest issue
      var candidates = floors[5].filter(function (n) { return n.type !== "boss"; });
      if (candidates.length > 0) {
        pick(candidates).type = "rest";
      }
    }

    return mapData;
  }

  function countCrossings(floors, connections, floor) {
    // Count edge crossings between floor-1 -> floor and floor -> floor+1
    var crossings = 0;

    function edgesForFloorPair(fLow, fHigh) {
      var edges = [];
      for (var i = 0; i < connections.length; i++) {
        var c = connections[i];
        var fromNode = null, toNode = null;
        for (var n = 0; n < floors[fLow].length; n++) {
          if (floors[fLow][n].id === c.from) fromNode = floors[fLow][n];
        }
        for (var n2 = 0; n2 < floors[fHigh].length; n2++) {
          if (floors[fHigh][n2].id === c.to) toNode = floors[fHigh][n2];
        }
        if (fromNode && toNode) {
          edges.push({ x1: fromNode.x, x2: toNode.x });
        }
      }
      return edges;
    }

    function countEdgeCrossings(edges) {
      var c = 0;
      for (var i = 0; i < edges.length; i++) {
        for (var j = i + 1; j < edges.length; j++) {
          // Two edges cross if one goes left-to-right and the other right-to-left
          if ((edges[i].x1 - edges[j].x1) * (edges[i].x2 - edges[j].x2) < 0) {
            c++;
          }
        }
      }
      return c;
    }

    if (floor > 0) {
      crossings += countEdgeCrossings(edgesForFloorPair(floor - 1, floor));
    }
    if (floor < FLOORS - 1) {
      crossings += countEdgeCrossings(edgesForFloorPair(floor, floor + 1));
    }
    return crossings;
  }

  // ── Available Nodes ────────────────────────────────────────────────────

  function getAvailableNodes(mapData, currentNodeId) {
    if (currentNodeId == null) {
      // Player hasn't started: the start node is available
      return [mapData.floors[0][0].id];
    }
    var available = [];
    for (var i = 0; i < mapData.connections.length; i++) {
      var c = mapData.connections[i];
      if (c.from === currentNodeId) {
        var target = findNode(mapData, c.to);
        if (target && !target.completed) {
          available.push(c.to);
        }
      }
    }
    return available;
  }

  // ── Complete Node ──────────────────────────────────────────────────────

  function completeNode(mapData, nodeId) {
    var node = findNode(mapData, nodeId);
    if (node) {
      node.visited = true;
      node.completed = true;
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  var _animFrame = null;
  var _animTime = 0;

  function render(container, mapData, currentNodeId, onNodeClick) {
    if (!container) return;

    // Get or create canvas
    var canvas = container.querySelector("canvas.ds-map-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "ds-map-canvas";
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.cursor = "pointer";
      container.appendChild(canvas);
    }

    var ctx = canvas.getContext("2d");
    var available = getAvailableNodes(mapData, currentNodeId);
    var visitedEdges = buildVisitedEdges(mapData);

    // Cancel any previous animation loop for this canvas
    if (_animFrame) cancelAnimationFrame(_animFrame);

    // Click handler
    canvas.onclick = function (e) {
      if (!onNodeClick) return;
      var rect = canvas.getBoundingClientRect();
      var scaleX = CANVAS_W / rect.width;
      var scaleY = CANVAS_H / rect.height;
      var mx = (e.clientX - rect.left) * scaleX;
      var my = (e.clientY - rect.top) * scaleY;

      for (var i = 0; i < available.length; i++) {
        var node = findNode(mapData, available[i]);
        if (!node) continue;
        var pos = nodePixel(node);
        var r = node.type === "boss" ? BOSS_RADIUS : NODE_RADIUS;
        var dx = mx - pos.x, dy = my - pos.y;
        if (dx * dx + dy * dy <= (r + 8) * (r + 8)) {
          // Flash effect
          flashNode(ctx, pos, r);
          onNodeClick(node.id);
          return;
        }
      }
    };

    // Animation loop
    function frame(timestamp) {
      _animTime = timestamp || 0;
      drawMap(ctx, mapData, currentNodeId, available, visitedEdges, _animTime);
      _animFrame = requestAnimationFrame(frame);
    }
    _animFrame = requestAnimationFrame(frame);
  }

  function buildVisitedEdges(mapData) {
    var set = {};
    for (var i = 0; i < mapData.connections.length; i++) {
      var c = mapData.connections[i];
      var fromNode = findNode(mapData, c.from);
      var toNode = findNode(mapData, c.to);
      if (fromNode && toNode && fromNode.completed && toNode.visited) {
        set[c.from + "->" + c.to] = true;
      }
    }
    return set;
  }

  // ── Draw Routines ──────────────────────────────────────────────────────

  // Type label names for display
  var TYPE_LABELS = {
    start: "Start", combat: "Combat", elite: "Elite",
    rest: "Rest", event: "Event", shop: "Shop", boss: "Boss"
  };

  function drawMap(ctx, mapData, currentNodeId, available, visitedEdges, time) {
    // Background
    drawBackground(ctx);

    // Paths
    drawPaths(ctx, mapData, visitedEdges);

    // Nodes
    for (var f = 0; f < mapData.floors.length; f++) {
      for (var n = 0; n < mapData.floors[f].length; n++) {
        var node = mapData.floors[f][n];
        var isCurrent = node.id === currentNodeId;
        var isAvailable = available.indexOf(node.id) !== -1;
        drawNode(ctx, node, isCurrent, isAvailable, time);
      }
    }

    // Type labels under available nodes (drawn after nodes so they're on top)
    ctx.textAlign = "center";
    for (var f2 = 0; f2 < mapData.floors.length; f2++) {
      for (var n2 = 0; n2 < mapData.floors[f2].length; n2++) {
        var node2 = mapData.floors[f2][n2];
        var isAvail2 = available.indexOf(node2.id) !== -1;
        if (isAvail2 && node2.type !== "start") {
          var pos2 = nodePixel(node2);
          var r2 = node2.type === "boss" ? BOSS_RADIUS : NODE_RADIUS;
          var label = TYPE_LABELS[node2.type] || "";
          ctx.font = "bold 9px serif";
          ctx.fillStyle = TYPE_COLORS[node2.type] || "#aaa";
          ctx.globalAlpha = 0.8;
          ctx.fillText(label, pos2.x, pos2.y + r2 + 14);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  function drawBackground(ctx) {
    // Deep dungeon gradient — dark at bottom (entrance), eerie at top (boss lair)
    var grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#1e0a0a");   // Boss end: blood-tinted
    grad.addColorStop(0.3, "#18100e");
    grad.addColorStop(0.6, "#14100a");
    grad.addColorStop(1, "#0e0a06");   // Start: deep dungeon dark
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle noise texture via small random dots
    ctx.globalAlpha = 0.025;
    var step = 8;
    for (var y = 0; y < CANVAS_H; y += step) {
      for (var x = 0; x < CANVAS_W; x += step) {
        var v = ((x * 7 + y * 13) % 255) / 255;
        ctx.fillStyle = v > 0.5 ? "#ffffff" : "#000000";
        ctx.fillRect(x, y, step, step);
      }
    }
    ctx.globalAlpha = 1.0;

    // Atmospheric fog — drifting horizontal bands
    ctx.globalAlpha = 0.04;
    for (var band = 0; band < 5; band++) {
      var bandY = CANVAS_H * (0.15 + band * 0.18);
      var fogGrad = ctx.createRadialGradient(
        CANVAS_W * 0.5, bandY, 10,
        CANVAS_W * 0.5, bandY, CANVAS_W * 0.45
      );
      fogGrad.addColorStop(0, "rgba(160, 140, 100, 0.6)");
      fogGrad.addColorStop(1, "transparent");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, bandY - 40, CANVAS_W, 80);
    }
    ctx.globalAlpha = 1.0;

    // Stronger vignette — deeper darkness at edges
    var vg = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.2,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.72
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(0.7, "rgba(0,0,0,0.2)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Floor depth labels (subtle, right side)
    ctx.font = "9px serif";
    ctx.textAlign = "right";
    var floorNames = ["Entrance", "", "", "", "", "", "Boss Lair"];
    for (var f = 0; f < FLOORS; f++) {
      var usableH = CANVAS_H - FLOOR_PADDING_Y * 2;
      var py = CANVAS_H - FLOOR_PADDING_Y - (f / (FLOORS - 1)) * usableH;
      ctx.fillStyle = "rgba(120, 100, 70, 0.25)";
      ctx.fillText("F" + f, CANVAS_W - 8, py + 3);
      if (floorNames[f]) {
        ctx.font = "italic 9px serif";
        ctx.fillStyle = "rgba(120, 100, 70, 0.18)";
        ctx.fillText(floorNames[f], CANVAS_W - 8, py + 14);
        ctx.font = "9px serif";
      }
    }
  }

  function drawPaths(ctx, mapData, visitedEdges) {
    ctx.lineCap = "round";

    for (var i = 0; i < mapData.connections.length; i++) {
      var c = mapData.connections[i];
      var fromNode = findNode(mapData, c.from);
      var toNode = findNode(mapData, c.to);
      if (!fromNode || !toNode) continue;

      var p1 = nodePixel(fromNode);
      var p2 = nodePixel(toNode);
      var key = c.from + "->" + c.to;
      var isVisited = visitedEdges[key];

      // Dotted line for unvisited, solid for visited
      if (isVisited) {
        ctx.strokeStyle = PATH_VISITED;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(210, 180, 100, 0.5)";
        ctx.shadowBlur = 8;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = PATH_DEFAULT;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.setLineDash([4, 4]);
      }

      // Bezier curve for organic feel
      var midY = (p1.y + p2.y) / 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(p1.x, midY, p2.x, midY, p2.x, p2.y);
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
    }
  }

  function drawNode(ctx, node, isCurrent, isAvailable, time) {
    var pos = nodePixel(node);
    var r = node.type === "boss" ? BOSS_RADIUS : NODE_RADIUS;
    var color = TYPE_COLORS[node.type] || "#888888";

    ctx.save();

    // Determine visibility/style
    if (node.completed) {
      ctx.globalAlpha = 0.35;
    } else if (!isCurrent && !isAvailable) {
      ctx.globalAlpha = 0.15;
    } else {
      ctx.globalAlpha = 1.0;
    }

    // Glow effects
    if (isCurrent) {
      drawGlow(ctx, pos.x, pos.y, r + 14, GLOW_CURRENT, 14);
      // Inner ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 215, 60, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (isAvailable && !isCurrent) {
      // Breathe animation — type-colored
      var breathe = 0.25 + 0.2 * Math.sin(time * 0.003);
      drawGlow(ctx, pos.x, pos.y, r + 10, "rgba(200,200,150," + breathe + ")", 10);
    }
    if (node.type === "boss" && !node.completed) {
      // Pulsing menacing glow
      var pulse = 0.35 + 0.35 * Math.sin(time * 0.004);
      drawGlow(ctx, pos.x, pos.y, r + 20, "rgba(255,30,20," + pulse + ")", 18);
    }
    if (node.type === "elite" && !node.completed && (isAvailable || isCurrent)) {
      // Elite danger glow
      var ePulse = 0.2 + 0.15 * Math.sin(time * 0.005);
      drawGlow(ctx, pos.x, pos.y, r + 10, "rgba(224,160,32," + ePulse + ")", 8);
    }

    // Node background circle — darker, richer
    var bgGrad = ctx.createRadialGradient(pos.x - 2, pos.y - 2, 0, pos.x, pos.y, r);
    bgGrad.addColorStop(0, "rgba(30, 25, 18, 0.95)");
    bgGrad.addColorStop(1, "rgba(12, 8, 4, 0.95)");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Outer border ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner subtle highlight ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw icon
    drawIcon(ctx, node.type, pos.x, pos.y, r, color);

    // Completed — dim X instead of checkmark (more dungeon-y)
    if (node.completed) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#88aa88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x - 5, pos.y - 5);
      ctx.lineTo(pos.x + 5, pos.y + 5);
      ctx.moveTo(pos.x + 5, pos.y - 5);
      ctx.lineTo(pos.x - 5, pos.y + 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGlow(ctx, x, y, radius, color, blur) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function flashNode(ctx, pos, r) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 200, 0.7)";
    ctx.fill();
    ctx.restore();
  }

  // ── Icon Drawing ───────────────────────────────────────────────────────

  function drawIcon(ctx, type, x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var s = r * 0.55; // icon scale factor

    switch (type) {
      case "start":
        drawStartIcon(ctx, x, y, s);
        break;
      case "combat":
        drawCombatIcon(ctx, x, y, s);
        break;
      case "elite":
        drawEliteIcon(ctx, x, y, s);
        break;
      case "rest":
        drawRestIcon(ctx, x, y, s);
        break;
      case "event":
        drawEventIcon(ctx, x, y, s);
        break;
      case "shop":
        drawShopIcon(ctx, x, y, s);
        break;
      case "boss":
        drawBossIcon(ctx, x, y, s * 1.2);
        break;
    }

    ctx.restore();
  }

  function drawStartIcon(ctx, x, y, s) {
    // Upward arrow
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x - s * 0.6, y + s * 0.3);
    ctx.lineTo(x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x - s * 0.2, y + s);
    ctx.lineTo(x + s * 0.2, y + s);
    ctx.lineTo(x + s * 0.2, y + s * 0.3);
    ctx.lineTo(x + s * 0.6, y + s * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  function drawCombatIcon(ctx, x, y, s) {
    // Crossed swords — two diagonal lines with crossguards
    ctx.lineWidth = 2;

    // Sword 1: top-left to bottom-right
    ctx.beginPath();
    ctx.moveTo(x - s, y - s);
    ctx.lineTo(x + s, y + s);
    ctx.stroke();
    // Crossguard 1
    ctx.beginPath();
    ctx.moveTo(x - s * 0.6 - s * 0.35, y - s * 0.6 + s * 0.35);
    ctx.lineTo(x - s * 0.6 + s * 0.35, y - s * 0.6 - s * 0.35);
    ctx.stroke();

    // Sword 2: top-right to bottom-left
    ctx.beginPath();
    ctx.moveTo(x + s, y - s);
    ctx.lineTo(x - s, y + s);
    ctx.stroke();
    // Crossguard 2
    ctx.beginPath();
    ctx.moveTo(x + s * 0.6 - s * 0.35, y - s * 0.6 - s * 0.35);
    ctx.lineTo(x + s * 0.6 + s * 0.35, y - s * 0.6 + s * 0.35);
    ctx.stroke();

    // Pommel dots
    ctx.beginPath();
    ctx.arc(x + s, y + s, 1.5, 0, Math.PI * 2);
    ctx.arc(x - s, y + s, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEliteIcon(ctx, x, y, s) {
    // Skull — oval head, eyes, jaw
    // Skull outline
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.15, s * 0.75, s * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y - s * 0.25, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.28, y - s * 0.25, s * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Nose — small triangle
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.05);
    ctx.lineTo(x - s * 0.1, y + s * 0.2);
    ctx.lineTo(x + s * 0.1, y + s * 0.2);
    ctx.closePath();
    ctx.fill();

    // Jaw line
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y + s * 0.35);
    ctx.lineTo(x + s * 0.45, y + s * 0.35);
    ctx.stroke();

    // Teeth marks
    for (var t = -0.3; t <= 0.3; t += 0.15) {
      ctx.beginPath();
      ctx.moveTo(x + s * t, y + s * 0.25);
      ctx.lineTo(x + s * t, y + s * 0.45);
      ctx.stroke();
    }
  }

  function drawRestIcon(ctx, x, y, s) {
    // Campfire — flame and logs

    // Flame — three pointed shapes
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.3, x + s * 0.35, y + s * 0.2);
    ctx.quadraticCurveTo(x, y - s * 0.1, x, y - s * 1.1);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.1);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.3, x - s * 0.35, y + s * 0.2);
    ctx.quadraticCurveTo(x, y - s * 0.1, x, y - s * 1.1);
    ctx.fill();

    // Inner flame (brighter)
    ctx.fillStyle = "#ffcc44";
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.1, x + s * 0.15, y + s * 0.15);
    ctx.quadraticCurveTo(x, y, x, y - s * 0.7);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.1, x - s * 0.15, y + s * 0.15);
    ctx.quadraticCurveTo(x, y, x, y - s * 0.7);
    ctx.fill();

    // Logs
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.7, y + s * 0.6);
    ctx.lineTo(x + s * 0.3, y + s * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.7, y + s * 0.6);
    ctx.lineTo(x - s * 0.3, y + s * 0.3);
    ctx.stroke();
  }

  function drawEventIcon(ctx, x, y, s) {
    // Question mark
    ctx.font = "bold " + Math.round(s * 2.2) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y + 1);
  }

  function drawShopIcon(ctx, x, y, s) {
    // Coin — circle with S inside
    ctx.beginPath();
    ctx.arc(x, y, s * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold " + Math.round(s * 1.2) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", x, y + 1);
  }

  function drawBossIcon(ctx, x, y, s) {
    // Crowned skull — larger version of elite skull with crown

    // Skull outline
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.1, s * 0.7, s * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes — larger, menacing
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.28, y, s * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.25);
    ctx.lineTo(x - s * 0.08, y + s * 0.38);
    ctx.lineTo(x + s * 0.08, y + s * 0.38);
    ctx.closePath();
    ctx.fill();

    // Jaw
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y + s * 0.52);
    ctx.lineTo(x + s * 0.4, y + s * 0.52);
    ctx.stroke();

    // Teeth
    for (var t = -0.25; t <= 0.25; t += 0.125) {
      ctx.beginPath();
      ctx.moveTo(x + s * t, y + s * 0.42);
      ctx.lineTo(x + s * t, y + s * 0.62);
      ctx.stroke();
    }

    // Crown — three triangular points
    ctx.fillStyle = "#ffcc00";
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1.5;
    var crownBase = y - s * 0.55;
    var crownTop = y - s * 1.1;
    var crownW = s * 0.65;

    ctx.beginPath();
    // Base line
    ctx.moveTo(x - crownW, crownBase);
    // Left point
    ctx.lineTo(x - crownW * 0.7, crownTop + s * 0.15);
    // Left dip
    ctx.lineTo(x - crownW * 0.35, crownBase - s * 0.1);
    // Center point (tallest)
    ctx.lineTo(x, crownTop);
    // Right dip
    ctx.lineTo(x + crownW * 0.35, crownBase - s * 0.1);
    // Right point
    ctx.lineTo(x + crownW * 0.7, crownTop + s * 0.15);
    // Back to base
    ctx.lineTo(x + crownW, crownBase);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown jewels — small dots
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(x, crownTop + s * 0.18, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3388ff";
    ctx.beginPath();
    ctx.arc(x - crownW * 0.55, crownTop + s * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + crownW * 0.55, crownTop + s * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  DS.Map = {
    generate: generate,
    render: render,
    getAvailableNodes: getAvailableNodes,
    completeNode: completeNode,
  };

})();
