# Version Automation System

## Overview

Automated version/timestamp synchronization system that prevents documentation drift and enforces the versioning protocol.

## Quick Start

### Install Git Hooks (One-time setup)

```bash
npm run hooks:install
```

This installs the pre-commit hook that will automatically:
1. Bump version to next MINOR (x.Y.0)
2. Update timestamps across all documentation
3. Stage the updated files

### Daily Usage

**Starting development:**
```bash
npm run dev
```
→ Automatically bumps PATCH version (x.y.Z) before starting dev server

**Committing changes:**
```bash
git commit -m "your message"
```
→ Pre-commit hook automatically bumps MINOR version (x.Y.0) and syncs all docs

**Major release:**
```bash
npm run version:major
git commit -m "your message"
```

## npm Scripts

| Command | Purpose | Version Change |
|---------|---------|----------------|
| `npm run version:check` | Validate sync status | None (check only) |
| `npm run version:sync` | Sync current version | None (sync only) |
| `npm run version:patch` | Bump patch version | 1.5.0 → 1.5.1 |
| `npm run version:minor` | Bump minor version | 1.5.0 → 1.6.0 |
| `npm run version:major` | Bump major version | 1.5.0 → 2.0.0 |
| `npm run hooks:install` | Install git hooks | N/A |

## Files Synced Automatically

All of these files have their `Version:` and `Updated:` lines synchronized:

1. package.json
2. README.md (including version badge)
3. ARCHITECTURE.md
4. ROADMAP.md
5. TASKLIST.md
6. LEARNINGS.md
7. RELEASE_NOTES.md
8. WARP.md
9. TECH_STACK.md
10. NAMING_GUIDE.md

## Versioning Protocol

Per AI rules and governance:

- **PATCH (x.y.Z)**: Before `npm run dev` (automated)
- **MINOR (x.Y.0)**: Before `git commit` (automated via hook)
- **MAJOR (X.0.0)**: Only when explicitly instructed (manual)

## Manual Override

### Skip pre-commit hook (not recommended)
```bash
git commit --no-verify -m "your message"
```

### Manual version sync without bumping
```bash
npm run version:sync
```

### Check if files are in sync
```bash
npm run version:check
```

## How It Works

### sync-version-timestamps.mjs Script

**Features:**
- Reads version from package.json
- Optionally bumps version (--patch, --minor, --major)
- Updates all documentation files with new version and ISO 8601 timestamp
- Creates RELEASE_NOTES.md entry for version bumps
- Validation mode (--check) exits with error if files are out of sync

**Regex patterns used:**
- Version: `/^Version:\s*\d+\.\d+\.\d+$/m`
- Timestamp: `/^Updated:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/m`
- README badge: `/!\[version\]\(https:\/\/img\.shields\.io\/badge\/version-\d+\.\d+\.\d+-green\?style=flat-square\)/`

### Pre-commit Hook

**Workflow:**
1. Runs `node scripts/sync-version-timestamps.mjs --minor`
2. Checks if any documentation files were modified
3. Stages modified files automatically
4. Allows commit to proceed

**Location:** `.git/hooks/pre-commit` (after running `npm run hooks:install`)

## Troubleshooting

### "Version out of sync" error
```bash
npm run version:sync
git add .
git commit -m "your message"
```

### Hook not running
```bash
# Reinstall hooks
npm run hooks:install

# Verify hook is executable
ls -la .git/hooks/pre-commit
```

### Want to bypass automation temporarily
```bash
git commit --no-verify -m "your message"
```

## Benefits

✅ **Zero manual effort** - Version/timestamp sync is automatic
✅ **No documentation drift** - All files always in sync
✅ **Enforced protocol** - Versioning rules applied automatically
✅ **Audit trail** - RELEASE_NOTES.md entries created automatically
✅ **CI-ready** - `--check` mode for validation in CI pipelines

## Migration from Manual Versioning

If you were manually updating versions before:

1. **Stop** manually editing `Version:` and `Updated:` lines
2. **Install hooks**: `npm run hooks:install`
3. **Use npm scripts**: `npm run dev` and normal `git commit`
4. **That's it!** Everything else is automatic

## Examples

### Start dev work
```bash
npm run dev
# Version: 1.5.0 → 1.5.1 automatically
```

### Commit your changes
```bash
git add .
git commit -m "feat: add new feature"
# Pre-commit hook runs:
# Version: 1.5.1 → 1.6.0 automatically
# All docs updated automatically
# Changes staged automatically
```

### Create major release
```bash
npm run version:major
# Version: 1.6.0 → 2.0.0
# Manually update RELEASE_NOTES.md content

git add .
git commit -m "feat: major release with breaking changes"
# Pre-commit hook detects version already bumped, just syncs
```

## See Also

- WARP.md - Project commands and conventions
- ARCHITECTURE.md - System architecture details
- RELEASE_NOTES.md - Complete version history
