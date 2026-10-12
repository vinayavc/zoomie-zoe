#!/usr/bin/env python3
"""Check that FILES in src/sw.js matches the files the web game needs.

Needed = every .js, .css, .html and .webmanifest under src/, plus the icons
that index.html and manifest.webmanifest point at.
Left out on purpose: sw.js itself (the browser fetches the worker script on
its own, never through the cache), manifest.json and the icons only it uses
(Chrome extension), README.md and other docs, .DS_Store.
'./' (the start page) is also allowed in FILES.

Run:  python3 store/tools/check-precache.py
Exit code 0 when the lists match, 1 when something is missing or extra.
"""
import json
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / 'src'
CODE_EXT = {'.js', '.css', '.html', '.webmanifest'}
SKIP = {'sw.js'}


def needed_files():
    need = set()
    for p in SRC.rglob('*'):
        rel = p.relative_to(SRC).as_posix()
        if p.is_file() and p.suffix in CODE_EXT and rel not in SKIP:
            need.add(rel)
    # icons the web page and the web manifest reference
    html = (SRC / 'index.html').read_text(encoding='utf-8')
    need.update(re.findall(r'href="(icons/[^"]+)"', html))
    manifest = json.loads((SRC / 'manifest.webmanifest').read_text(encoding='utf-8'))
    need.update(icon['src'] for icon in manifest.get('icons', []))
    return need


def listed_files():
    sw = (SRC / 'sw.js').read_text(encoding='utf-8')
    block = re.search(r'const FILES = \[(.*?)\];', sw, re.S)
    if not block:
        sys.exit('Could not find "const FILES = [...]" in src/sw.js')
    return re.findall(r"'([^']+)'", block.group(1))


def main():
    need = needed_files()
    listed = listed_files()
    listed_set = set(listed) - {'./'}
    missing = sorted(need - listed_set)
    extra = sorted(listed_set - need)
    dupes = sorted({f for f in listed if listed.count(f) > 1})
    absent = sorted(f for f in listed_set if not (SRC / f).is_file())

    version = re.search(r"CACHE_VERSION = '([^']+)'", (SRC / 'sw.js').read_text(encoding='utf-8'))
    print(f'src/sw.js: {len(listed)} entries, CACHE_VERSION {version.group(1) if version else "?"}')
    print(f'needed:    {len(need)} files (+ "./")')
    for label, items in (('MISSING from FILES', missing), ('EXTRA in FILES', extra),
                         ('LISTED TWICE', dupes), ('LISTED BUT NOT ON DISK', absent)):
        for f in items:
            print(f'  {label}: {f}')
    if './' not in listed:
        print('  MISSING from FILES: ./ (the start page)')
    ok = not (missing or extra or dupes or absent) and './' in listed
    print('OK: FILES matches src/' if ok else 'FIX NEEDED')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
