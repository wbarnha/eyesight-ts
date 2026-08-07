import { describe, expect, test } from 'bun:test'
import {
  LOCAL_PACKAGE_NAME,
  LOCAL_REPOSITORY_URL,
  UPSTREAM_SUBDIR,
  applyPackageOverrides,
  applyReadmeOverrides,
  createPublishingGuide,
} from '../scripts/sync-upstream.mjs'

describe('sync-upstream helpers', () => {
  test('applyPackageOverrides rewrites repository metadata and keeps sync script', () => {
    const updated = applyPackageOverrides({
      name: '@beshkenadze/eyecite',
      version: '2.7.6-alpha.2',
      scripts: {
        build: 'bun run build',
        postversion: 'git push && git push --tags',
      },
    })

    expect(updated.name).toBe(LOCAL_PACKAGE_NAME)
    expect(updated.homepage).toBe(`${LOCAL_REPOSITORY_URL}#readme`)
    expect(updated.repository.url).toBe(`git+${LOCAL_REPOSITORY_URL}.git`)
    expect(updated.bugs.url).toBe(`${LOCAL_REPOSITORY_URL}/issues`)
    expect(updated.scripts.build).toBe('bun run build')
    expect(updated.scripts['sync:upstream']).toBe('node ./scripts/sync-upstream.mjs')
    expect(updated.scripts.postversion).toBeUndefined()
  })

  test('applyReadmeOverrides rewrites package references and adds sync note', () => {
    const updated = applyReadmeOverrides(`# @beshkenadze/eyecite

Install with npm install @beshkenadze/eyecite.
Repository: github.com/beshkenadze/eyecite
`)

    expect(updated).toContain(`# ${LOCAL_PACKAGE_NAME}`)
    expect(updated).toContain('npm install eyesight-ts')
    expect(updated).toContain('github.com/wbarnha/eyesight-ts')
    expect(updated).toContain(`automatically synced from \`freelawproject/eyecite\`'s \`${UPSTREAM_SUBDIR}/\` subtree`)
  })

  test('createPublishingGuide documents manual GitHub Release flow', () => {
    const guide = createPublishingGuide()

    expect(guide).toContain(`published to npm as \`${LOCAL_PACKAGE_NAME}\``)
    expect(guide).toContain('Create a GitHub Release')
    expect(guide).toContain('NPM_TOKEN')
  })
})
