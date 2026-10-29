#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./new-post.sh \"Your Post Title\" [tag1,tag2]"
  exit 1
fi

TITLE="$1"
TAGS="${2:-systems, engineering}"
DATE="$(date +%Y-%m-%d)"
SLUG="$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
FILE="posts/${DATE}-${SLUG}.md"

if [ -f "$FILE" ]; then
  echo "Error: Post already exists at $FILE"
  exit 1
fi

cat <<EOF > "$FILE"
---
title: ${TITLE}
date: ${DATE}
tags: ${TAGS}
summary: Brief one-sentence summary of what this log covers.
---

Write your post here in **Markdown**.

## Section Heading

- Bullet point one
- Bullet point two

\`\`\`c
#include <stdint.h>

void kernel_entry(void) {
    // Example code block
}
\`\`\`
EOF

python3 build.py
echo "Created new post: $FILE"
echo "Edit $FILE, then run ./publish.sh to deploy to GitHub Pages!"
