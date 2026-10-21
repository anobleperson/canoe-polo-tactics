"""Regenerate the file list and version in sw.js.

The version is a hash of every cached file, so any change to the app gives
the service worker a new version and devices download the update.

Usage: python3 tools/update-sw.py   (run from anywhere)
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATTERNS = ["index.html", "manifest.webmanifest", "icon.svg", "css/*.css", "js/*.js", "icons/*.png"]


def main():
    files = sorted({p for pat in PATTERNS for p in ROOT.glob(pat)})
    digest = hashlib.sha256()
    for path in files:
        digest.update(path.relative_to(ROOT).as_posix().encode())
        digest.update(path.read_bytes())
    version = digest.hexdigest()[:12]

    names = ["./"] + [p.relative_to(ROOT).as_posix() for p in files]
    listing = "\n".join(f"  '{n}'," for n in names)
    block = f"// BEGIN GENERATED\nconst VERSION = '{version}';\nconst FILES = [\n{listing}\n];\n// END GENERATED"

    sw = ROOT / "sw.js"
    text = sw.read_text()
    new = re.sub(r"// BEGIN GENERATED.*?// END GENERATED", lambda _: block, text, flags=re.S)
    if new != text:
        sw.write_text(new)
        print(f"sw.js updated: version {version}, {len(names)} files")
    else:
        print(f"sw.js already up to date: version {version}")


if __name__ == "__main__":
    main()
