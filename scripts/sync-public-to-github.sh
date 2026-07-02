#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${BLOG_BACKUP_REPO_DIR:-/opt/blog-new}"
SOURCE_DIR="${BLOG_BACKUP_SOURCE_DIR:-/var/www/blog}"
TARGET_DIR="${BLOG_BACKUP_TARGET_DIR:-$REPO_DIR/public}"
BRANCH="${BLOG_BACKUP_BRANCH:-main}"
COMMIT_PREFIX="${BLOG_BACKUP_COMMIT_PREFIX:-backup: sync published articles}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "git repository not found: $REPO_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"

rsync -a --delete "$SOURCE_DIR"/ "$TARGET_DIR"/

if [ -z "$(git -C "$REPO_DIR" status --porcelain -- "$TARGET_DIR")" ]; then
  echo "no article changes to sync"
  exit 0
fi

git -C "$REPO_DIR" add "$TARGET_DIR"
git -C "$REPO_DIR" commit -m "$COMMIT_PREFIX $(date +%F)"
git -C "$REPO_DIR" push origin "$BRANCH"
