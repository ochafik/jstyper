#!/bin/bash
set -eu

readonly TEMP_DIR="$PWD/tmp/ochafik.com"
readonly RELATIVE_DEMO="assets/typer-demo.html"

npm run build

rm -fR "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"
git clone --depth 1 git@github.com:ochafik/ochafik.github.io.git "$TEMP_DIR"

cp build/index.html "${TEMP_DIR}/${RELATIVE_DEMO}"
(
  cd "${TEMP_DIR}"
  git status
  git commit -m "Update demo" "${RELATIVE_DEMO}"
  git push
)