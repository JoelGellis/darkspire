/*
 * DARKSPIRE — Visual Effects Layer
 * Canvas-based particle effects for atmospheric ambiance.
 *
 * Namespace: DS.Effects
 *
 * Usage:
 *   DS.Effects.start("combat")  — floating embers + dust
 *   DS.Effects.start("rest")    — campfire sparks rising
 *   DS.Effects.start("title")   — slow drifting motes
 *   DS.Effects.stop()           — tear down overlay
 */

(function () {
  "use strict";

  window.DS = window.DS || {};

  var canvas = null;
  var ctx = null;
  var animId = null;
  var particles = [];
  var mode = null;

  // ── Particle templates ────────────────────────────────────────────────

  var CONFIGS = {
    combat: {
      count: 30,
      spawn: function (w, h) {
        return {
          x: Math.random() * w,
          y: h + 10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.3 + Math.random() * 0.5),
          size: 1 + Math.random() * 2,
          life: 1.0,
          decay: 0.002 + Math.random() * 0.003,
          color: Math.random() > 0.6 ? "200,80,30" : "180,140,60",
          drift: Math.random() * 0.02,
        };
      },
    },
    rest: {
      count: 40,
      spawn: function (w, h) {
        var cx = w / 2;
        return {
          x: cx + (Math.random() - 0.5) * 80,
          y: h * 0.55 + Math.random() * 30,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(0.5 + Math.random() * 1.0),
          size: 1 + Math.random() * 2.5,
          life: 1.0,
          decay: 0.005 + Math.random() * 0.005,
          color: Math.random() > 0.4 ? "240,140,30" : "255,200,60",
          drift: Math.random() * 0.03,
        };
      },
    },
    title: {
      count: 20,
      spawn: function (w, h) {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(0.05 + Math.random() * 0.15),
          size: 0.5 + Math.random() * 1.5,
          life: 1.0,
          decay: 0.001 + Math.random() * 0.002,
          color: Math.random() > 0.5 ? "160,80,220" : "120,60,180",
          drift: Math.random() * 0.01,
        };
      },
    },
  };

  // ── Core ───────────────────────────────────────────────────────────────

  function start(newMode) {
    if (mode === newMode && canvas) return; // already running this mode
    stop();

    mode = newMode;
    var config = CONFIGS[mode];
    if (!config) return;

    // Create overlay canvas
    canvas = document.createElement("canvas");
    canvas.className = "ds-effects-canvas";
    canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
    document.body.appendChild(canvas);

    ctx = canvas.getContext("2d");
    resize();

    // Seed initial particles
    particles = [];
    for (var i = 0; i < config.count; i++) {
      var p = config.spawn(canvas.width, canvas.height);
      p.life = Math.random(); // stagger initial lifetimes
      particles.push(p);
    }

    window.addEventListener("resize", resize);
    loop();
  }

  function stop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    particles = [];
    mode = null;
    window.removeEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function loop() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var config = CONFIGS[mode];
    if (!config) return;

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];

      // Update
      p.x += p.vx + Math.sin(p.life * 6) * p.drift;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
        // Respawn
        particles[i] = config.spawn(canvas.width, canvas.height);
        continue;
      }

      // Draw
      var alpha = p.life * 0.6;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + p.color + "," + alpha + ")";
      ctx.fill();

      // Glow
      if (p.size > 1.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.color + "," + (alpha * 0.15) + ")";
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
    animId = requestAnimationFrame(loop);
  }

  // ── Screen Observer — auto-detect which screen is active ────────────

  var SCREEN_MAP = {
    "screen-title": "title",
    "screen-combat": "combat",
    "screen-rest": "rest",
  };

  function detectScreen() {
    var root = document.getElementById("game-root");
    if (!root) return;
    var screen = root.querySelector(".screen");
    if (!screen) { stop(); return; }

    var matched = null;
    for (var cls in SCREEN_MAP) {
      if (screen.classList.contains(cls)) {
        matched = SCREEN_MAP[cls];
        break;
      }
    }

    if (matched) {
      start(matched);
    } else {
      stop();
    }
  }

  // Watch for screen changes via MutationObserver
  function observe() {
    var root = document.getElementById("game-root");
    if (!root) return;

    var observer = new MutationObserver(function () {
      detectScreen();
    });

    observer.observe(root, { childList: true, subtree: false });
    detectScreen(); // initial check
  }

  // Auto-start observer when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
  } else {
    observe();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  DS.Effects = {
    start: start,
    stop: stop,
  };

})();
