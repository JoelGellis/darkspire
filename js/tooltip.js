/*
 * DARKSPIRE — Tooltip System
 * Dynamic tooltip positioning for cards, relics, enemies, and status effects.
 *
 * Usage: Add data-tooltip="text" to any element.
 * For multi-line: use data-tooltip with \n for line breaks.
 * For rich tooltips (title + description): data-tooltip-title + data-tooltip-desc
 *
 * Namespace: DS.Tooltip
 */

(function () {
  "use strict";

  window.DS = window.DS || {};

  var tooltip = null;

  function init() {
    if (tooltip) return;

    tooltip = document.createElement("div");
    tooltip.className = "ds-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    // Event delegation — listen on body for mouseover/mouseout
    document.body.addEventListener("mouseover", function (e) {
      var target = e.target.closest("[data-tooltip], [data-tooltip-title]");
      if (!target) return;
      show(target);
    });

    document.body.addEventListener("mouseout", function (e) {
      var target = e.target.closest("[data-tooltip], [data-tooltip-title]");
      if (!target) return;
      // Check if we're moving to a child of the same target
      if (target.contains(e.relatedTarget)) return;
      hide();
    });
  }

  function show(target) {
    var title = target.getAttribute("data-tooltip-title") || "";
    var desc = target.getAttribute("data-tooltip-desc") || "";
    var text = target.getAttribute("data-tooltip") || "";

    if (!title && !text) return;

    // Build tooltip content
    var html = "";
    if (title) {
      html += '<div class="ds-tooltip-title">' + escapeHtml(title) + '</div>';
    }
    if (desc) {
      html += '<div class="ds-tooltip-desc">' + escapeHtml(desc) + '</div>';
    }
    if (text && !title) {
      // Simple text tooltip — support \n for line breaks
      html = '<div class="ds-tooltip-text">' + escapeHtml(text).replace(/\\n/g, '<br>') + '</div>';
    }

    tooltip.innerHTML = html;
    tooltip.style.display = "block";

    // Position — above the element by default, flip to below if near top
    var rect = target.getBoundingClientRect();
    var tipRect = tooltip.getBoundingClientRect();
    var tipW = tipRect.width;
    var tipH = tipRect.height;

    var left = rect.left + rect.width / 2 - tipW / 2;
    var top = rect.top - tipH - 8;

    // Flip below if too close to top
    if (top < 4) {
      top = rect.bottom + 8;
      tooltip.classList.add("ds-tooltip-below");
    } else {
      tooltip.classList.remove("ds-tooltip-below");
    }

    // Clamp horizontally
    if (left < 4) left = 4;
    if (left + tipW > window.innerWidth - 4) left = window.innerWidth - tipW - 4;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  function hide() {
    if (tooltip) {
      tooltip.style.display = "none";
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  DS.Tooltip = {
    show: show,
    hide: hide,
  };

})();
