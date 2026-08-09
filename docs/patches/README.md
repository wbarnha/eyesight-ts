# Patches to send upstream

Three patches for one defect: **a statute section number is read only as far
as its first letter.** Congress numbers a section inserted between two
existing ones by appending a letter, so this is not an edge case — it takes
out the core prohibition of Title VII, the whole Genetic Information
Nondiscrimination Act, Rule 10b-5, and any state code that letters its titles.

Apply with `git am`, or `git apply` if you would rather write your own commit
message.

| # | Patch | Target repository | What it does |
| --- | --- | --- | --- |
| 1 | `0001-reporters-db-law-section.patch` | `freelawproject/reporters-db` | The root fix: `law.section` in `regexes.json`, plus four `examples` that lock it in |
| 2 | `0002-eyecite-law-section-coverage.patch` | `freelawproject/eyecite` | Regression tests, `CHANGES.md`, dependency floor |
| 3 | `0003-eyecite-ts-law-section.patch` | `beshkenadze/eyecite`, subdir `eyecite-ts/` | The TypeScript port, which overrides the variable and so needs its own fix |

---

## Read this first: the upstream in `.upstream-sync.json` is the wrong repo

`.upstream-sync.json` names `freelawproject/eyecite`, subdir `eyecite-ts`, at
sha `bb8d1e5b2edc0edd4aa1982b5901933feabe29aa`. **Free Law Project has never
maintained a TypeScript port.** That sha resolves under the Free Law Project
URL only because GitHub serves any commit in a fork network under the parent's
address. It is the single commit of
[`freelawproject/eyecite#287`](https://github.com/freelawproject/eyecite/pull/287),
"feat: Add TypeScript port of eyecite library", from `beshkenadze:feat/typescript-port`
— **closed without merging** on 15 July 2025, with the author's own comment:

> Oops, wrong repo :)

That is why the sync job fails with `Upstream subtree not found at eyecite-ts`:
the subtree was never there. The `managedFiles` list in `.upstream-sync.json`
matches `beshkenadze/eyecite`'s `eyecite-ts/` tree exactly, and the pinned
version `2.7.6-alpha.2` is from that fork's npm package,
`@beshkenadze/eyecite`. **That tree is dead** — three commits, last one
18 July 2025.

Separately, the npm name `eyecite-ts` today belongs to
[`medelman17/eyecite-ts`](https://github.com/medelman17/eyecite-ts) (v0.34.2),
an independent reimplementation with its own hand-written statute patterns. It
is **not affected by this defect** — checked, and it returns `2000e-2`,
`240.10b-5`, `13A-12-5` and `301-399i` correctly. It is also not a
continuation of this codebase, so re-pointing the sync at it would be a
rewrite rather than a re-point.

So patch 3 goes to `beshkenadze/eyecite`, which is where this repository's code
actually comes from, and the fix is already applied here.

---

## The defect

`law.section` in reporters-db's `regexes.json`:

```
(?P<section>(?:\d+(?:[\-.:]\d+){,3})|(?:\d+(?:\((?:[a-zA-Z]{1}|\d{1,2})\))+))
```

Digits, then groups of a joiner and more digits. Nothing accepts a letter, so
the match stops at the first one — and where the surrounding template then
fails, the engine backtracks to a shorter section or gives up entirely.

Measured with eyecite 2.7.8 against reporters-db 3.2.66:

| Citation | Result | Should be |
| --- | --- | --- |
| `42 U.S.C. § 2000e-2(a)(1)` | `UnknownCitation` | section `2000e-2` |
| `42 U.S.C. § 2000e-5(f)(3)` | `UnknownCitation` | section `2000e-5` |
| `42 U.S.C. § 2000ff-1(b)` | `UnknownCitation` | section `2000ff-1` |
| `Ala. Code § 13A-12-5` | `UnknownCitation` | section `13A-12-5` |
| `17 C.F.R. § 240.10b-5` | section `240` | section `240.10b-5` |
| `17 C.F.R. § 240.14a-9` | section `240` | section `240.14a-9` |
| `21 U.S.C. §§ 301-399i` | section `301` | section `301-399i` |

Seven of ten sampled citations wrong. The regulation rows are worse than
truncation: part 240 is a real but different authority, so the citation
resolves to something the document did not cite.

The TypeScript port does not consume this variable — it overrides it in
`getLawRegexVariables()` with `\d+(?:[\-.:]\d+)*`, which has the same defect
independently. There it truncates rather than failing, so
`§ 2000ff-5(a)`, `§ 2000ff-1(b)(2)(A)` and `§ 2000ff(2)` all came back as
section `2000` — three distinct provisions of one Act, indistinguishable.

## The fix

Each component may carry up to three trailing letters:

```
(?P<section>(?:\d+[a-zA-Z]{0,3}(?:[\-.:]\d+[a-zA-Z]{0,3}){,3})|(?:\d+(?:\((?:[a-zA-Z]{1}|\d{1,2})\))+))
```

The second alternative — parenthesised subsections — is untouched, and so is
the ordering between the two. That matters: eyecite relies on the first
alternative matching before the second so that `LAW_PIN_CITE_REGEX` can claim
the subsection, and `29 U.S.C. § 1132(a)(1)(B)` still yields section `1132`
with pin cite `(a)(1)(B)` rather than one long section.

The port's patch additionally accepts every dash rather than only the ASCII
hyphen, because the Indigo Book prints `42 U.S.C. § 2000ff–5(a)` with an en
dash and word processors substitute one for the other unasked.

## Sequencing — patch 2 is blocked on patch 1

reporters-db is a plain floating dependency (`reporters-db>=3.2.53`), consumed
live at import in `eyecite/tokenizers.py`. So the fix reaches eyecite
automatically, but **the tests in patch 2 fail until reporters-db ships the
fix**. Land them in this order:

1. reporters-db PR merges and releases.
2. Update the floor in patch 2 — it is written as `reporters-db>=3.2.67`, a
   **placeholder**; set it to whatever version actually carries the fix.
3. eyecite PR.

Patch 3 is independent of both and can go at any time.

## House rules for each target

- **reporters-db** — no CLA. Tests are `python tests.py`; `regexes.json` has no
  `examples` field of its own and no test that compiles it, so the regression
  cases go in `laws.json`, where `check_regexes` already requires every example
  to match. `tests.py` also enforces exact JSON formatting; run with
  `FIX_JSON=1` once and commit the result. Lint is ruff + ruff-format at
  line-length 79.
- **eyecite** — signed CLA required (`contributor_license_agreement.txt`,
  emailed to legal@free.law); a bot gates the PR. Tests are
  `python3 -m unittest discover -s tests -p 'test_*.py'`. CI **requires every
  PR to modify `CHANGES.md`**, which patch 2 does. Lint is ruff + ruff-format
  (line-length 79) and `mypy .`. A benchmark runs automatically on PRs.
- **the port** — no CLA. `bun test`, `biome check`.

## Verification

Each patch was applied to a fresh clone of its target and the target's own
suite run.

| Target | Before | After |
| --- | --- | --- |
| reporters-db | 23 passed, 1553 subtests | 23 passed, 1553 subtests |
| eyecite | 55 passed, 428 subtests | 55 passed, **436** subtests |
| the port | 252 passed | 252 passed |

eyecite additionally reports 202 failures both before and after; every one is
`HyperscanTokenizer`, whose `hyperscan` dependency is optional and was not
installed. There are **zero** non-Hyperscan failures either side of the change.

The four cases added to `tests/test_FindTest.py` were run against unpatched
reporters-db and fail there, so they are a regression test rather than a
description of current behaviour.
