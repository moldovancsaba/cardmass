#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, 'utf8')
}

function updateFileVersion(p, version) {
  const content = fs.readFileSync(p, 'utf8')
  const updated = content.replace(/v\d+\.\d+\.\d+/g, `v${version}`)
  if (updated !== content) {
    writeFile(p, updated)
    return true
  }
  return false
}

function ensureReleaseNotes(version, nowIso) {
  const p = path.resolve('RELEASE_NOTES.md')
  if (!fs.existsSync(p)) return
  const content = fs.readFileSync(p, 'utf8')
  const heading = `## [v${version}] — ${nowIso}`
  if (content.includes(heading)) return
  let updated
  const lines = content.split('\n')
  const insertIndex = lines.findIndex((l) => l.startsWith('## [v'))
  if (insertIndex === -1) {
    updated = `${content.trim()}\n\n${heading}\n- (update notes here)\n`
  } else {
    lines.splice(insertIndex, 0, heading, '- (update notes here)', '')
    updated = lines.join('\n')
  }
  writeFile(p, updated)
}

function main() {
  const pkg = readJSON(path.resolve('package.json'))
  const version = pkg.version
  const nowIso = new Date().toISOString()

  const files = [
    'README.md',
    'TASKLIST.md',
    'ARCHITECTURE.md',
    'LEARNINGS.md',
    'ROADMAP.md',
  ].filter((f) => fs.existsSync(path.resolve(f)))

  let changed = false
  for (const f of files) {
    if (updateFileVersion(path.resolve(f), version)) changed = true
  }

  // For minor release bumps, ensure a heading exists in RELEASE_NOTES
  ensureReleaseNotes(version, nowIso)

  if (process.argv.includes('--check')) {
    if (changed) {
      console.error('Version strings were out of sync and have been updated.')
      process.exit(1)
    }
  }
}

main()
