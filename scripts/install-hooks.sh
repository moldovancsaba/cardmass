#!/bin/bash
#
# Install Git hooks for cardmass
#
# WHAT: Copies pre-commit hook to .git/hooks directory
# WHY: Automates version synchronization on every commit

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "[hooks] Installing Git hooks..."

# Check if .git directory exists
if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "[hooks] ERROR: .git directory not found. Are you in a Git repository?"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-commit hook
if [ -f "$SCRIPT_DIR/pre-commit" ]; then
  cp "$SCRIPT_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
  chmod +x "$HOOKS_DIR/pre-commit"
  echo "[hooks] ✓ Installed pre-commit hook"
else
  echo "[hooks] ERROR: scripts/pre-commit not found"
  exit 1
fi

echo "[hooks] ✓ All hooks installed successfully"
echo ""
echo "The pre-commit hook will automatically:"
echo "  1. Bump version to next MINOR (x.Y.0)"
echo "  2. Update timestamps across all documentation"
echo "  3. Stage the updated files"
echo ""
echo "To bypass the hook (not recommended):"
echo "  git commit --no-verify"
