# Darkspire II

Joel explicitly authorized a ground-up TypeScript/Phaser rebuild on 2026-09-12. This directory is the new game; the parent vanilla runtime and its published 1.0 release must remain intact.

- Read `.agent/STATE.md` and `README.md` before continuing.
- Keep authoritative combat and campaign rules in `src/engine.ts`, with no Phaser or DOM dependencies. Presentation consumes resolved events; it cannot decide damage or rewards.
- Use `npm run check` for behavior tests, strict types, and production build. Use `npm run simulate` for bounded seeded expeditions. Simulated victory rates are not evidence of human fun or finished balance.
- Source art belongs in `assets/source`; only reviewed exports under `public/assets/exported` reach runtime. Check actual alpha, not the appearance of a checkerboard. Parent asset source recipes remain in `../assets/source`.
- Preserve the four-hero positional game and the original design's permanent heroes/equipment, death costs, gold, and camp/run split.
- Save key `darkspire-2-campaign-v1` is independent of 1.0. Never read or migrate 1.0 saves implicitly.
- Desktop first, 1600×900 logical stage scaled to fit. Essential actions must remain inside the viewport. Mark limitations honestly; this is an expanding vertical slice, not full 1.0 parity.
- Do not publish over 1.0, include personal run archives, or commit unrelated parent work.
