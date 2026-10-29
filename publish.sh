#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-Update journal posts}"

echo "==> Rebuilding blog index from posts/*.md..."
python3 build.py

echo "==> Staging changes..."
git add .

if git diff --cached --quiet; then
  echo "==> No changes to commit."
else
  echo "==> Committing with message: '$MSG'"
  git commit -m "$MSG"
fi

echo "==> Pushing to GitHub (origin main)..."
git push origin main

echo "==> Published! GitHub Pages will update within ~30-60 seconds."
