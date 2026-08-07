# Publishing Guide

This package is published to npm as `eyesight-ts`.

## Normal workflow

1. Let the scheduled `sync-upstream` GitHub Actions workflow pull changes from `freelawproject/eyecite` automatically.
2. Review the synced commit(s) in this repository.
3. Create a GitHub Release with the version tag you want to publish, for example `v2.7.6`.
4. The release workflow will run tests, build the package, set `package.json` to the release tag version, and publish to npm.

## Required GitHub secret

Add an `NPM_TOKEN` repository secret with permission to publish the `eyesight-ts` package.

## Manual sync

You can trigger a sync locally or in GitHub Actions:

```bash
npm run sync:upstream
```

Pass a specific upstream ref if needed:

```bash
node ./scripts/sync-upstream.mjs bb8d1e5b2edc0edd4aa1982b5901933feabe29aa
```

## Notes

- Upstream source: `https://github.com/wbarnha/eyesight-ts` mirrors `freelawproject/eyecite`'s `eyecite-ts/` directory.
- Releases are manual by design.
- The release tag should start with `v`, such as `v2.7.6`.
