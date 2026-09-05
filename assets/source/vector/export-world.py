"""Reviewed world plates and enemy crops; offline resvg-py==0.5.0 only.
Run from any directory with python assets/source/vector/export-world.py.
Source layers and crop/grade decisions stay editable; runtime ships PNG only.
"""
from pathlib import Path
import resvg_py

SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[2]

def export(name, svg, folder):
    target = ROOT / 'assets' / 'exported' / folder / (name + '.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(resvg_py.svg_to_bytes(svg_string=svg, resources_dir=str(SOURCE)))
    print(target.relative_to(ROOT))

if __name__ == '__main__':
    for name in ['hamlet-environment', 'dungeon-environment']:
        export(name, (SOURCE / (name + '.svg')).read_text(encoding='utf-8'), 'renders')
    raw = SOURCE.parent / 'ai-reference' / 'enemies-raw.png'
    if raw.exists():
        # Equal reviewed 4x2 grid, preserve genuine source alpha.
        names = ['sentinel','goblin','occultist','wraith','slime','fungus','beast','spider']
        for i, name in enumerate(names):
            x, y = i % 4 * 384, i // 4 * 512
            svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="360" height="500" viewBox="-8 -8 400 528">
            <defs><clipPath id="cell"><path d="M0 0H384V512H0Z"/></clipPath><filter id="grade"><feColorMatrix type="saturate" values=".72"/></filter></defs>
            <g clip-path="url(#cell)" filter="url(#grade)"><image xlink:href="../ai-reference/enemies-raw.png" width="1536" height="1024" x="{-x}" y="{-y}"/></g></svg>'''
            export('enemy-' + name, svg, 'sprites')
