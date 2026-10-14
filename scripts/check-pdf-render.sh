#!/bin/sh
# Optional release check; requires Poppler's pdftoppm on PATH.
set -eu
for pdf in artifacts/guard.pdf artifacts/travel.pdf artifacts/guard-compact.pdf artifacts/travel-compact.pdf artifacts/guard-uncommon.pdf; do
  log="${pdf%.pdf}.render.log"
  pdftoppm -f 1 -singlefile -scale-to 900 -png "$pdf" "${pdf%.pdf}-render" 2> "$log"
  if grep -Eiq 'Syntax Error|invalid|Couldn.t create a font' "$log"; then
    cat "$log"
    exit 1
  fi
  printf 'Render passed: %s\n' "$pdf"
done
