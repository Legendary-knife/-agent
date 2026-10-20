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
DATA_DIR="${WORKBENCH_DATA_DIR:-$ROOT_DIR/data}"
UPLOAD_DIR="$DATA_DIR/uploads"
DB_PATH="$DATA_DIR/agent_workbench.sqlite3"
WORK_DIR="$ROOT_DIR/.tmp/knowledge-sync-repo"

if [[ ! -d "$UPLOAD_DIR" ]]; then
  echo "No upload directory found: $UPLOAD_DIR"
  exit 1
fi

rm -rf "$WORK_DIR"
mkdir -p "$(dirname "$WORK_DIR")"
git clone --branch "$BRANCH" "$REPO_URL" "$WORK_DIR"

mkdir -p "$WORK_DIR/$TARGET_DIR/uploads"
rsync -a --delete "$UPLOAD_DIR/" "$WORK_DIR/$TARGET_DIR/uploads/"

if [[ -f "$DB_PATH" ]]; then
  python3 - "$DB_PATH" "$WORK_DIR/$TARGET_DIR/manifest.json" <<'PY'
import json
import sqlite3
import sys

db_path, manifest_path = sys.argv[1], sys.argv[2]
connection = sqlite3.connect(db_path)
connection.row_factory = sqlite3.Row
rows = connection.execute(
    """
    SELECT id, title, type, scope, owner, updated_at, source, file_path
    FROM documents
    ORDER BY updated_at DESC
    """
).fetchall()
payload = [
    {
        "id": row["id"],
        "title": row["title"],
        "type": row["type"],
        "scope": row["scope"],
        "owner": row["owner"],
        "updatedAt": row["updated_at"],
        "source": row["source"],
        "filePath": row["file_path"],
    }
    for row in rows
]
with open(manifest_path, "w", encoding="utf-8") as output:
    json.dump(payload, output, ensure_ascii=False, indent=2)
PY
fi

cd "$WORK_DIR"
git add "$TARGET_DIR"
if git diff --cached --quiet; then
  echo "No knowledge file changes to commit."
  exit 0
fi

git commit -m "sync knowledge base files"
git push origin "$BRANCH"
echo "Knowledge files synced to $REPO_URL ($BRANCH:$TARGET_DIR)"
