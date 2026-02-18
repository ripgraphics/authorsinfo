#!/usr/bin/env bash
set -euo pipefail

echo "Removing tmpclaude-* files in repo root..."
shopt -s nullglob 2>/dev/null || true
for f in tmpclaude-*; do
  if [ -e "$f" ]; then
    rm -rf -- "$f"
    echo "Removed $f"
  fi
done

echo "Done."
