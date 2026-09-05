"""Offline asset export. Editable crop, padding and grading recipe.

Requires resvg-py==0.5.0 (export tool only; no game dependency).
Run: python assets/source/vector/export-campfire.py
Review/provenance: assets/source/ai-reference/campfire-art-review.md
"""
from pathlib import Path
import resvg_py

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path(__file__).resolve().parent
EXPORT = ROOT / 'assets' / 'exported'
# Reviewed cell bounds; ranger's bow needs 12 extra pixels to the right.
CELLS = {
    'fighter': (0, 0, 384, 480), 'cleric': (384, 0, 384, 480),
    'rogue': (768, 0, 384, 480), 'wizard': (1152, 0, 384, 480),
    'barbarian': (0, 480, 384, 544), 'ranger': (384, 480, 396, 544),
    'necromancer': (780, 480, 372, 544), 'paladin': (1152, 480, 384, 544)
}

def export(name, svg, folder):
    target = EXPORT / folder / (name + '.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(resvg_py.svg_to_bytes(svg_string=svg, resources_dir=str(SOURCE)))
    print(target.relative_to(ROOT))

if __name__ == '__main__':
    export('campfire-environment', (SOURCE / 'campfire-environment.svg').read_text(encoding='utf-8'), 'renders')
    for cls, (x, y, width, height) in CELLS.items():
        # Uniform output canvas and baseline; nothing from adjacent cells ships.
        # Original alpha is preserved. Grading quiets orange highlights and lets
        # CSS firelight unify the figures with the background at gameplay scale.
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          width="360" height="500" viewBox="-16 -8 {width + 32} {height + 22}">
          <defs><clipPath id="cell"><path d="M0 0H{width}V{height}H0Z"/></clipPath>
          <filter id="ink-grade"><feColorMatrix type="saturate" values=".67"/></filter></defs>
          <g clip-path="url(#cell)" filter="url(#ink-grade)">
          <image xlink:href="../ai-reference/campfire-heroes-raw.png" x="{-x}" y="{-y}" width="1536" height="1024"/>
          </g></svg>'''
        export('campfire-' + cls, svg, 'sprites')
