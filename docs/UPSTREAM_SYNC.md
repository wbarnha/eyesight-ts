# Upstream sync

This repository mirrors `freelawproject/eyecite`'s `eyecite-ts/` subtree. Local
changes — bug fixes, performance work, packaging tweaks — live alongside that
mirrored code, so the sync has to bring upstream changes in *without* discarding
them.

## How it works

Upstream lands on a dedicated **vendor branch** (`upstream`) that contains
nothing but the synced subtree, and reaches `main` through a **merge**.

```
main       2e2c42d ──── local work ──── local work ──── merge ← ...
                    \                                  /
upstream             ╰── sync ──── sync ──── sync ────╯
```

`.github/workflows/sync-upstream.yml` runs daily:

1. Check out `upstream`.
2. Run `scripts/sync-upstream.mjs`, which copies the upstream subtree over the
   working tree.
3. Commit and push to `upstream`.
4. Trial-merge `upstream` into `main`, run `bun test` and `bun run build` on the
   merged tree.
5. Open (or update) a pull request `upstream` → `main` reporting the result.

Because `upstream` only ever contains upstream content, the merge base of
`upstream` and `main` is the last commit where they agreed. Git can therefore do
a real three-way merge: local edits survive wherever upstream did not touch the
same lines, and a genuine overlap becomes a conflict you resolve deliberately.

## Why not sync straight onto `main`

`scripts/sync-upstream.mjs` does an unconditional `copyFileSync` for every file
present in the upstream subtree. It has no notion of local modifications — it is
a file copy, not a merge. Run against `main`, it reverts every locally modified
file that also exists upstream.

Two things about that are worth knowing:

- **`managedFiles` in `.upstream-sync.json` is not a protection list.** It is
  regenerated from the upstream file listing on every run and is only read to
  decide which files to *delete* because upstream dropped them. Editing it does
  not stop anything from being overwritten.
- **The only exclusion lever is `LOCAL_ONLY_PATHS`** in
  `scripts/sync-upstream.mjs`, plus the `.github/` prefix rule in
  `shouldManagePath`. Paths listed there are never copied — which also means
  they never receive upstream fixes again. That is the right trade for
  genuinely local files (the sync script, the workflows) and the wrong one for
  files like `src/find.ts` that this repository wants to keep tracking.

Note that `LOCAL_ONLY_PATHS` is matched with `Set.has()` on the exact relative
path, so directory names in it do not filter files beneath them.

## Rules

- **Merge the sync PR with a merge commit.** Squashing or rebasing rewrites the
  commits and destroys the ancestry between `upstream` and `main`, which is
  exactly what makes the next sync a clean three-way merge instead of a pile of
  spurious conflicts. If the repository has "allow merge commits" disabled, turn
  it back on or merge that PR locally.
- **Never commit local work to `upstream`.** It exists to be a faithful copy of
  the subtree. Anything committed there will look like an upstream change.
- **Resolve conflicts on a branch off `main`**, then merge that branch. Do not
  resolve them by editing `upstream`.

## The configured upstream is currently wrong

As of 2026-08-08 the sync cannot run at all. Its only scheduled run,
[31250648855](https://github.com/wbarnha/eyesight-ts/actions/runs/31250648855),
failed at the sync step:

```
Upstream subtree not found at eyecite-ts
```

The archive of `freelawproject/eyecite@main` downloads and extracts fine but
contains no `eyecite-ts/` directory, so `syncFromExtractedSource` is never
reached. Until `UPSTREAM_OWNER` / `UPSTREAM_REPO` / `UPSTREAM_SUBDIR` in
`scripts/sync-upstream.mjs` point somewhere that exists, no upstream change can
arrive — the vendor branch below is the right destination for when they can
again, not a fix for this. See `docs/UPSTREAMING.md` for how to work out where
the port actually lives.

## Bootstrapping

The vendor branch has to start at the last commit where this repository and
upstream agreed — the most recent sync commit. If `upstream` does not exist, the
workflow fails with an explicit error rather than guessing.

```bash
# <last-sync-commit> is the commit whose tree came straight from a sync.
git branch upstream <last-sync-commit>
git push -u origin upstream
```

Getting this wrong is not dangerous, just noisy: too old a base produces
conflicts for changes already applied, too new a base silently drops upstream
changes made in between.

## Running a sync by hand

```bash
# Sync upstream main into the vendor branch.
git checkout upstream
node ./scripts/sync-upstream.mjs
git commit -am "chore: sync upstream eyecite-ts"

# Bring it into your working branch.
git checkout main
git merge upstream
```

Pass a ref to pin a specific upstream commit:

```bash
node ./scripts/sync-upstream.mjs bb8d1e5b2edc0edd4aa1982b5901933feabe29aa
```

## CI on the sync pull request

A pull request opened with the default `GITHUB_TOKEN` does not trigger workflow
runs, so `ci.yml` may not run on the sync PR. The workflow therefore verifies the
merged tree itself and reports the outcome in the PR body.

To get native CI on the PR instead, add a repository secret named `SYNC_PAT`
holding a personal access token with `contents: write` and `pull-requests: write`
on this repository. The workflow prefers it when present. The built-in
verification still runs, as a second opinion.

## When upstream and local work collide

The sync PR tells you which case you are in:

| PR says | Meaning | What to do |
| --- | --- | --- |
| Merge clean, checks pass | Upstream and local work are independent | Merge it |
| Merge clean, checks fail | Upstream changed behaviour local code relies on | Fix on a branch off `main`, merge that first, then merge the sync PR |
| Conflicts | Upstream edited lines that are also modified locally | Resolve on a branch off `main`, keeping both intents where possible |

If a local change keeps colliding with upstream, that is a signal to send it
upstream so the divergence goes away. See `docs/UPSTREAMING.md`.
