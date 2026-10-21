#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_UPLOAD_KNOWLEDGE:-}" != "YES" ]]; then
  echo "Refusing to upload knowledge files."
  echo "Set CONFIRM_UPLOAD_KNOWLEDGE=YES when you are sure the target repo may contain these files."
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: CONFIRM_UPLOAD_KNOWLEDGE=YES bash scripts/sync_knowledge_to_github.sh <repo-url> [branch] [target-dir]"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"
TARGET_DIR="${3:-knowledge-base}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/knowledge-base"
WORK_DIR="$ROOT_DIR/.tmp/knowledge-sync-repo"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "No repository knowledge directory found: $SOURCE_DIR"
  exit 1
fi

rm -rf "$WORK_DIR"
mkdir -p "$(dirname "$WORK_DIR")"
git clone --branch "$BRANCH" "$REPO_URL" "$WORK_DIR"

mkdir -p "$WORK_DIR/$TARGET_DIR"
rsync -a --delete "$SOURCE_DIR/" "$WORK_DIR/$TARGET_DIR/"

cd "$WORK_DIR"
git add "$TARGET_DIR"
if git diff --cached --quiet; then
  echo "No knowledge file changes to commit."
  exit 0
fi

git commit -m "sync knowledge base files"
git push origin "$BRANCH"
echo "Knowledge files synced to $REPO_URL ($BRANCH:$TARGET_DIR)"
