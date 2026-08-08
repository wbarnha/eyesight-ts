import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const UPSTREAM_OWNER = 'freelawproject'
export const UPSTREAM_REPO = 'eyecite'
export const UPSTREAM_SUBDIR = 'eyecite-ts'
export const LOCAL_PACKAGE_NAME = 'eyesight-ts'
export const LOCAL_REPOSITORY_URL = 'https://github.com/wbarnha/eyesight-ts'
export const METADATA_PATH = '.upstream-sync.json'

const LOCAL_ONLY_PATHS = new Set([
  '.git',
  '.github',
  '.upstream-sync.json',
  'dist',
  'node_modules',
  'coverage',
  'scripts/sync-upstream.mjs',
  'tests/upstream-sync.test.ts',
])

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    const stdout = result.stdout?.trim()
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        stdout ? `stdout:\n${stdout}` : '',
        stderr ? `stderr:\n${stderr}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    )
  }

  return result.stdout.trim()
}

function resolveUpstreamSha(upstreamRef) {
  if (/^[0-9a-f]{40}$/i.test(upstreamRef)) {
    return upstreamRef
  }

  const output = run('git', [
    'ls-remote',
    `https://github.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}.git`,
    upstreamRef,
  ])
  const [sha] = output.split(/\s+/)

  if (!sha) {
    throw new Error(`Unable to resolve upstream ref: ${upstreamRef}`)
  }

  return sha
}

function walkFiles(rootDir, currentDir = rootDir) {
  const results = []

  for (const entry of readdirSync(currentDir)) {
    const absolutePath = join(currentDir, entry)
    const relativePath = relative(rootDir, absolutePath)
    const stats = statSync(absolutePath)

    if (stats.isDirectory()) {
      results.push(...walkFiles(rootDir, absolutePath))
      continue
    }

    results.push(relativePath)
  }

  return results.sort()
}

function ensureParentDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true })
}

export function applyPackageOverrides(packageJson) {
  const scripts = {
    ...packageJson.scripts,
    'sync:upstream': 'node ./scripts/sync-upstream.mjs',
  }

  delete scripts.postversion

  return {
    ...packageJson,
    name: LOCAL_PACKAGE_NAME,
    description:
      'TypeScript port of Free Law Project\'s eyecite library, automatically synced from upstream.',
    homepage: `${LOCAL_REPOSITORY_URL}#readme`,
    repository: {
      type: 'git',
      url: `git+${LOCAL_REPOSITORY_URL}.git`,
    },
    bugs: {
      url: `${LOCAL_REPOSITORY_URL}/issues`,
    },
    scripts,
  }
}

export function applyReadmeOverrides(readme) {
  let next = readme
    .replace(/^# .+$/m, `# ${LOCAL_PACKAGE_NAME}`)
    .replaceAll('https://badge.fury.io/js/%40beshkenadze%2Feyecite.svg', 'https://badge.fury.io/js/eyesight-ts.svg')
    .replaceAll('https://badge.fury.io/js/%40beshkenadze%2Feyecite', 'https://badge.fury.io/js/eyesight-ts')
    .replaceAll('@beshkenadze/eyecite', LOCAL_PACKAGE_NAME)
    .replaceAll('github.com/beshkenadze/eyecite', 'github.com/wbarnha/eyesight-ts')

  if (!next.includes('automatically synced from `freelawproject/eyecite`')) {
    next = next.replace(
      /^(# .*\n\n(?:.*\n){0,5})/,
      `$1> This repository is automatically synced from \`freelawproject/eyecite\`'s \`${UPSTREAM_SUBDIR}/\` subtree. Once upstream updates are synced, publishing only requires creating a manual GitHub Release.\n\n`
    )
  }

  return next
}

export function createPublishingGuide() {
  return `# Publishing Guide

This package is published to npm as \`${LOCAL_PACKAGE_NAME}\`.

## Normal workflow

1. Let the scheduled \`sync-upstream\` GitHub Actions workflow pull changes from \`freelawproject/eyecite\` onto the \`upstream\` vendor branch automatically.
2. Review the \`upstream\` -> default branch pull request it opens and merge it **with a merge commit**. See \`docs/UPSTREAM_SYNC.md\`.
3. Create a GitHub Release with the version tag you want to publish, for example \`v2.7.6\`.
4. The release workflow will run tests, build the package, set \`package.json\` to the release tag version, and publish to npm.

## Required GitHub secret

Add an \`NPM_TOKEN\` repository secret with permission to publish the \`${LOCAL_PACKAGE_NAME}\` package.

## Manual sync

Run the sync on the \`upstream\` vendor branch, then merge that branch — the
script overwrites files rather than merging them, so running it on a branch that
carries local changes discards them:

\`\`\`bash
git checkout upstream
npm run sync:upstream
git commit -am "chore: sync upstream eyecite-ts"
git checkout main && git merge upstream
\`\`\`

Pass a specific upstream ref if needed:

\`\`\`bash
node ./scripts/sync-upstream.mjs bb8d1e5b2edc0edd4aa1982b5901933feabe29aa
\`\`\`

## Notes

- Upstream source: \`${LOCAL_REPOSITORY_URL}\` mirrors \`${UPSTREAM_OWNER}/${UPSTREAM_REPO}\`'s \`${UPSTREAM_SUBDIR}/\` directory.
- Releases are manual by design.
- The release tag should start with \`v\`, such as \`v2.7.6\`.
- How upstream changes reach the default branch without overwriting local work
  is documented in \`docs/UPSTREAM_SYNC.md\`.
`
}

function readPreviousMetadata(repoRoot) {
  const metadataPath = join(repoRoot, METADATA_PATH)

  if (!existsSync(metadataPath)) {
    return { managedFiles: [] }
  }

  return JSON.parse(readFileSync(metadataPath, 'utf8'))
}

function shouldManagePath(path) {
  if (path.startsWith('.github/')) {
    return false
  }

  return !LOCAL_ONLY_PATHS.has(path)
}

function syncManagedFiles(repoRoot, sourceRoot, managedFiles, previousManagedFiles) {
  const nextManagedSet = new Set(managedFiles)

  for (const staleFile of previousManagedFiles) {
    if (LOCAL_ONLY_PATHS.has(staleFile) || nextManagedSet.has(staleFile)) {
      continue
    }

    rmSync(join(repoRoot, staleFile), { force: true })
  }

  for (const relativePath of managedFiles) {
    const sourcePath = join(sourceRoot, relativePath)
    const destinationPath = join(repoRoot, relativePath)
    ensureParentDir(destinationPath)
    copyFileSync(sourcePath, destinationPath)
  }
}

export function syncFromExtractedSource({ repoRoot, sourceRoot, upstreamRef, upstreamSha }) {
  const previousMetadata = readPreviousMetadata(repoRoot)
  const upstreamFiles = walkFiles(sourceRoot).filter(shouldManagePath)

  syncManagedFiles(repoRoot, sourceRoot, upstreamFiles, previousMetadata.managedFiles ?? [])

  const packageJsonPath = join(repoRoot, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const overriddenPackageJson = applyPackageOverrides(packageJson)
  writeFileSync(packageJsonPath, `${JSON.stringify(overriddenPackageJson, null, 2)}\n`)

  const readmePath = join(repoRoot, 'README.md')
  writeFileSync(readmePath, applyReadmeOverrides(readFileSync(readmePath, 'utf8')))

  writeFileSync(join(repoRoot, 'PUBLISHING.md'), createPublishingGuide())

  const metadata = {
    upstream: {
      owner: UPSTREAM_OWNER,
      repo: UPSTREAM_REPO,
      subdir: UPSTREAM_SUBDIR,
      ref: upstreamRef,
      sha: upstreamSha,
      syncedAt: new Date().toISOString(),
      version: overriddenPackageJson.version,
    },
    managedFiles: upstreamFiles,
  }

  writeFileSync(join(repoRoot, METADATA_PATH), `${JSON.stringify(metadata, null, 2)}\n`)
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url)
  const repoRoot = resolve(dirname(currentFile), '..')
  const upstreamRef = process.argv[2] || process.env.UPSTREAM_REF || 'main'

  const tempRoot = mkdtempSync(join(tmpdir(), 'eyesight-ts-sync-'))
  const archivePath = join(tempRoot, 'upstream.tar.gz')

  try {
    run('curl', ['-fsSL', `https://codeload.github.com/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/tar.gz/${upstreamRef}`, '-o', archivePath])
    run('tar', ['-xzf', archivePath, '-C', tempRoot])

    const extractedRootName = readdirSync(tempRoot).find(
      entry => entry !== 'upstream.tar.gz'
    )

    if (!extractedRootName) {
      throw new Error('Unable to locate extracted upstream archive contents.')
    }

    const extractedRoot = join(tempRoot, extractedRootName)
    const sourceRoot = join(extractedRoot, UPSTREAM_SUBDIR)

    if (!existsSync(sourceRoot)) {
      throw new Error(`Upstream subtree not found at ${UPSTREAM_SUBDIR}`)
    }

    const upstreamSha = resolveUpstreamSha(upstreamRef)
    syncFromExtractedSource({ repoRoot, sourceRoot, upstreamRef, upstreamSha })
    process.stdout.write(`Synced ${UPSTREAM_OWNER}/${UPSTREAM_REPO}@${upstreamSha} (${upstreamRef})\n`)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
