#!/bin/sh
# Builds the Chrome Web Store upload: the CONTENTS of src/ at the zip root
# (manifest.json at the top level), without macOS junk or tool/debug files.
#
# Usage, from anywhere:   sh store/tools/make-zip.sh [output-folder]
# Output:                 doxie-arcade-<version>.zip (default folder: store/)

set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SRC="$ROOT/src"
OUTDIR="${1:-$ROOT/store}"
mkdir -p "$OUTDIR"
OUTDIR="$(cd "$OUTDIR" && pwd)"

VERSION="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$SRC/manifest.json")"
ZIP="$OUTDIR/doxie-arcade-$VERSION.zip"
rm -f "$ZIP"

cd "$SRC"
zip -r -X -q "$ZIP" . \
  -x '.DS_Store' '*/.DS_Store' \
  -x '_tool*' '*/_tool*' \
  -x '__MACOSX/*' '*/.*'

echo "Made $ZIP"
echo "Contents:"
unzip -l "$ZIP"
if ! unzip -l "$ZIP" | awk '{print $4}' | grep -qx 'manifest.json'; then
  echo "ERROR: manifest.json is not at the zip root" >&2
  exit 1
fi
