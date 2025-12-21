#!/usr/bin/env node
/**
 * Version and Timestamp Synchronization Script
 * 
 * WHAT: Automatically synchronizes version numbers and timestamps across all documentation files
 * WHY: Prevents documentation drift and enforces versioning protocol
 * 
 * Features:
 * - Updates version in package.json and all documentation
 * - Updates timestamps to ISO 8601 with milliseconds (UTC)
 * - Supports automatic version bumping (--patch, --minor, --major)
 * - Validation mode (--check) for CI/pre-commit hooks
 * 
 * Usage:
 *   Check sync status:      node scripts/sync-version-timestamps.mjs --check
 *   Sync current version:   node scripts/sync-version-timestamps.mjs
 *   Bump patch (x.y.Z):     node scripts/sync-version-timestamps.mjs --patch
 *   Bump minor (x.Y.0):     node scripts/sync-version-timestamps.mjs --minor
 *   Bump major (X.0.0):     node scripts/sync-version-timestamps.mjs --major
 * 
 * Aligned with versioning protocol:
 * - Before npm run dev: increment PATCH
 * - Before commit: increment MINOR (reset PATCH to 0)
 * - Major: only when explicitly instructed
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

/**
 * WHAT: Generate ISO 8601 timestamp with milliseconds in UTC
 * WHY: Mandatory timestamp format per governance rules
 */
function getTimestamp() {
  return new Date().toISOString()
}

/**
 * WHAT: Read and parse package.json
 */
function readPackageJson() {
  const pkgPath = path.join(rootDir, 'package.json')
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
}

/**
 * WHAT: Write updated package.json
 */
function writePackageJson(pkg) {
  const pkgPath = path.join(rootDir, 'package.json')
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

/**
 * WHAT: Bump version according to semver rules
 * WHY: Automatic version bumping per versioning protocol
 */
function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
    default:
      return currentVersion
  }
}

/**
 * WHAT: List of all documentation files that need version/timestamp sync
 */
const DOC_FILES = [
  'README.md',
  'ARCHITECTURE.md',
  'ROADMAP.md',
  'TASKLIST.md',
  'LEARNINGS.md',
  'RELEASE_NOTES.md',
  'WARP.md',
  'TECH_STACK.md',
  'NAMING_GUIDE.md',
]

/**
 * WHAT: Update version and timestamp in a markdown file
 * WHY: Ensures all documentation reflects current version and update time
 */
function updateDocFile(filePath, version, timestamp) {
  if (!fs.existsSync(filePath)) {
    return { updated: false, reason: 'not found' }
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let updated = false

  // Update "Version: X.Y.Z" lines
  const versionRegex = /^Version:\s*\d+\.\d+\.\d+$/m
  if (versionRegex.test(content)) {
    const newContent = content.replace(versionRegex, `Version: ${version}`)
    if (newContent !== content) {
      content = newContent
      updated = true
    }
  }

  // Update "Updated: ISO timestamp" lines
  const timestampRegex = /^Updated:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/m
  if (timestampRegex.test(content)) {
    const newContent = content.replace(timestampRegex, `Updated: ${timestamp}`)
    if (newContent !== content) {
      content = newContent
      updated = true
    }
  }

  // Special case: README.md version badge
  if (filePath.endsWith('README.md')) {
    const badgeRegex = /!\[version\]\(https:\/\/img\.shields\.io\/badge\/version-\d+\.\d+\.\d+-green\?style=flat-square\)/
    if (badgeRegex.test(content)) {
      const newContent = content.replace(
        badgeRegex,
        `![version](https://img.shields.io/badge/version-${version}-green?style=flat-square)`
      )
      if (newContent !== content) {
        content = newContent
        updated = true
      }
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8')
  }

  return { updated, reason: updated ? 'synced' : 'no changes' }
}

/**
 * WHAT: Ensure RELEASE_NOTES.md has a section for the current version
 * WHY: Required for tracking releases per versioning protocol
 */
function ensureReleaseNotesEntry(version, timestamp) {
  const filePath = path.join(rootDir, 'RELEASE_NOTES.md')
  if (!fs.existsSync(filePath)) return false

  let content = fs.readFileSync(filePath, 'utf8')
  const versionHeading = `## [v${version}]`
  
  // If heading already exists, don't add duplicate
  if (content.includes(versionHeading)) return false

  // Find first existing version heading to insert before it
  const lines = content.split('\n')
  const insertIndex = lines.findIndex((line) => line.startsWith('## [v'))
  
  const newEntry = [
    `## [v${version}] — ${timestamp}`,
    '- (update notes here)',
    '',
  ].join('\n')

  if (insertIndex === -1) {
    // No existing entries, append to end
    content = content.trim() + '\n\n' + newEntry
  } else {
    // Insert before first existing entry
    lines.splice(insertIndex, 0, ...newEntry.split('\n'))
    content = lines.join('\n')
  }

  fs.writeFileSync(filePath, content, 'utf8')
  return true
}

/**
 * WHAT: Main synchronization logic
 */
function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')
  const bumpType = args.find(arg => ['--patch', '--minor', '--major'].includes(arg))?.slice(2)

  console.log('[sync-version] Starting version/timestamp synchronization...')
  
  // Step 1: Determine target version
  const pkg = readPackageJson()
  let targetVersion = pkg.version
  
  if (bumpType) {
    targetVersion = bumpVersion(pkg.version, bumpType)
    console.log(`[sync-version] Bumping ${bumpType}: ${pkg.version} → ${targetVersion}`)
    
    if (!checkOnly) {
      pkg.version = targetVersion
      writePackageJson(pkg)
      console.log('[sync-version] ✓ Updated package.json')
    }
  } else {
    console.log(`[sync-version] Current version: ${targetVersion}`)
  }

  // Step 2: Generate timestamp
  const timestamp = getTimestamp()
  console.log(`[sync-version] Timestamp: ${timestamp}`)

  // Step 3: Update all documentation files
  const results = []
  for (const filename of DOC_FILES) {
    const filePath = path.join(rootDir, filename)
    const result = updateDocFile(filePath, targetVersion, timestamp)
    results.push({ filename, ...result })
    
    if (result.updated) {
      console.log(`[sync-version] ✓ ${filename}: ${result.reason}`)
    } else if (result.reason !== 'not found') {
      console.log(`[sync-version] • ${filename}: ${result.reason}`)
    }
  }

  // Step 4: Ensure RELEASE_NOTES entry (only for version bumps)
  if (bumpType && !checkOnly) {
    const added = ensureReleaseNotesEntry(targetVersion, timestamp)
    if (added) {
      console.log('[sync-version] ✓ Added RELEASE_NOTES.md entry')
    }
  }

  // Step 5: Summary
  const updatedCount = results.filter(r => r.updated).length
  const notFoundCount = results.filter(r => r.reason === 'not found').length
  
  console.log(`\n[sync-version] Summary:`)
  console.log(`  - Updated: ${updatedCount} files`)
  console.log(`  - Unchanged: ${results.length - updatedCount - notFoundCount} files`)
  if (notFoundCount > 0) {
    console.log(`  - Not found: ${notFoundCount} files`)
  }

  // Step 6: Check mode validation
  if (checkOnly) {
    if (updatedCount > 0 || (bumpType && pkg.version !== targetVersion)) {
      console.error('\n[sync-version] ERROR: Version/timestamp out of sync!')
      console.error('Run `node scripts/sync-version-timestamps.mjs` to fix.')
      process.exit(1)
    } else {
      console.log('\n[sync-version] ✓ All files in sync')
      process.exit(0)
    }
  }

  console.log('\n[sync-version] Complete!')
}

main()
