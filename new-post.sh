#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./new-post.sh \"Post Title\""
  exit 1
fi

TITLE="$1"
DATE="$(date +%Y-%m-%d)"
SLUG="$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
FILE="posts/${DATE}-${SLUG}.md"

if [ -f "$FILE" ]; then
  echo "Error: $FILE already exists"
  exit 1
fi

cat <<EOF > "$FILE"
---
title: ${TITLE}
date: ${DATE}
---

Write your post here in Markdown.
EOF

echo "Created $FILE"
