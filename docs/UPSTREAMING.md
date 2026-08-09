# Upstreaming the local changes

This is a working brief for getting `wbarnha/eyesight-ts`'s local changes accepted
upstream, so the fork stops diverging and the vendor-branch merges
(`docs/UPSTREAM_SYNC.md`) stay conflict-free.

It is written to be self-contained: a session that has never seen this repository
should be able to work from it.

---

## 0. Context

`wbarnha/eyesight-ts` is a published npm package that mirrors a TypeScript port
of Free Law Project's Python `eyecite` citation extractor. `.upstream-sync.json`
records the source:

```json
{ "owner": "freelawproject", "repo": "eyecite", "subdir": "eyecite-ts",
  "sha": "bb8d1e5b2edc0edd4aa1982b5901933feabe29aa", "version": "2.7.6-alpha.2" }
```

A daily job copies that subtree over this repository. Local changes to any file
that also exists upstream are therefore repeat business: every one has to be
re-merged forever until it lands upstream. That is the reason for this document.

### Establish where the port is actually maintained — do this first

**The configured upstream is already wrong.** The sync workflow's first and only
scheduled run,
[31250648855](https://github.com/wbarnha/eyesight-ts/actions/runs/31250648855)
on 2026-08-08, failed with:

```
Upstream subtree not found at eyecite-ts
```

That is the `existsSync` guard at `scripts/sync-upstream.mjs:274-276`. The
tarball of `freelawproject/eyecite@main` downloaded and extracted successfully —
it simply contains no `eyecite-ts/` directory. `.upstream-sync.json` pins sha
`bb8d1e5b`, which presumably did have one, so the subtree was removed, renamed,
or moved after that commit.

Consequences:

- **No sync has ever succeeded, and none can until the pointer is fixed.** The
  daily cron fails identically every morning.
- Any claim that "the next sync will overwrite local work" is, for now,
  theoretical. The overwrite behaviour is real and worth fixing
  (`docs/UPSTREAM_SYNC.md`), but nothing is arriving to overwrite anything.

**Do not assume `freelawproject/eyecite` is the right place to send PRs.**
`scripts/sync-upstream.mjs:126-142` rewrites `@beshkenadze/eyecite` package
references and `github.com/beshkenadze/eyecite` URLs out of the README on every
sync. Combined with the missing subtree, the likeliest story is that the port
originated at `beshkenadze/eyecite`, was vendored into `freelawproject/eyecite`
for a while, and has since moved or been dropped there.

Resolve this before writing any patch:

```bash
gh repo view freelawproject/eyecite
gh api repos/freelawproject/eyecite/contents/eyecite-ts --jq '.[].name'   # does the subtree still exist?
gh repo view beshkenadze/eyecite
gh api repos/beshkenadze/eyecite/contents/src --jq '.[].name'
```

Compare a file that this repository did **not** modify — say `src/clean.ts` or
`src/annotate.ts` — against both candidates. Whichever matches is the upstream.
Then read that repo's `CONTRIBUTING.md`, issue templates, and CI config, and
follow its conventions rather than this repository's.

Whatever you find, **fix `UPSTREAM_OWNER` / `UPSTREAM_REPO` / `UPSTREAM_SUBDIR`
in `scripts/sync-upstream.mjs:17-19` to match**, or the workflow keeps failing
daily regardless of anything else in this document.

If the port turns out to be unmaintained in both places, the fallback is to stop
syncing (drop the workflow, delete `.upstream-sync.json`) and own the code
outright — at which point this document is moot and the local changes are simply
the code. That is a decision for the repository owner, not something to assume.

---

## 1. What to send, in priority order

The local work splits into four tranches. Send them as **separate pull
requests** in this order — the early ones are self-evident bugs that build
credibility for the larger performance change, and they are independently
valuable even if the rest is rejected.

### Tranche A — bugs that exist upstream right now, independent of any perf work

These are defects in the port, small, and each is worth its own issue + PR.
Two of them were found while optimizing but are **not** fixed in this repository,
so they still need writing:

| # | Bug | Where | Status here |
| --- | --- | --- | --- |
| A1 | `SpanUpdater` returns one global shift for every offset | `src/span-updater.ts` | **Fixed** — port the fix |
| A2 | Python `{,4}` quantifier is a literal in JavaScript, so three law patterns never match | `src/utils/regex-templates.ts` | **Not fixed** — report/fix upstream |
| A3 | `createCitationExtractor` drops a 6th argument, so `caseSensitive: false` silently produces a case-sensitive extractor | `src/tokenizers/custom.ts:78-85` vs `src/tokenizers/extractors.ts:79-97` | **Not fixed** — report/fix upstream |
| A4 | A section number is truncated at its first letter, so `§ 2000ff-5(a)` extracts as section `2000` and `§ 240.10b-5` as `240.10` | `src/utils/regex-templates.ts` (`law_section`) | **Fixed** — port the fix |

**A1 — `SpanUpdater`.** Every updater was an arrow function capturing the same
two `let` bindings declared outside the loop, so all of them read back the
*final* offsets. Every offset received one global shift instead of a
region-specific one.

```js
new SpanUpdater('abcXYZdef', 'abcdef').update(0)   // returned -3, correct answer is 0
```

The fix stores per-step deltas as plain numbers and returns `offset` unchanged
when it precedes the first change. It also removes one closure allocation per
diff step. Reproducer and expectations are in `tests/prefilter.test.ts`
(`describe('SpanUpdater')`).

**A2 — `{,4}`.** `getLawRegexVariables()` builds `law_subject` as
`[A-Z][.\-'A-Za-z]*(?: [A-Z][.\-'A-Za-z]*| &){,4}`. In Python `{,4}` means
`{0,4}`; in JavaScript it is not a quantifier at all and matches the literal
text `{,4}`. Consequence:

```js
getCitations('Cal. Penal Code § 187')     // -> ['UnknownCitation'], no FullLawCitation
getCitations('N.Y. Penal Law § 125.25')   // -> ['UnknownCitation']
getCitations('Tex. Penal Code Ann. § 19.02') // -> ['UnknownCitation']
```

Whole families of state statutory citations are silently unextractable. The fix
is `{0,4}`, plus a test for each affected code. Check the other Python-isms in
the same file while you are there — this is unlikely to be the only one.

**A4 — truncated section numbers.** `getLawRegexVariables()` builds
`law_section` as `\d+(?:[\-.:]\d+)*`: digits, then groups of a joiner and more
digits. Congress numbers a section inserted between two existing ones by
appending a letter, and that pattern stops dead at the first one.

```js
// section, as reported by getCitations(...)[0].groups
'42 U.S.C. § 2000ff-5(a)'      // -> '2000'      (should be '2000ff-5')
'42 U.S.C. § 2000ff-1(b)(2)(A)'// -> '2000'      (should be '2000ff-1')
'42 U.S.C. § 2000ff(2)'        // -> '2000'      (should be '2000ff')
'21 U.S.C. §§ 301-399i'        // -> '301-399'   (a different range)
'17 C.F.R. § 240.10b-5'        // -> '240.10'    (a different rule)
```

The first three are distinct provisions of the Genetic Information
Nondiscrimination Act and all three came back identical, so a consumer
resolving them could not tell them apart. The Rule 10b-5 case is worse: it
names a real but different regulation.

The fix lets each component carry a bounded letter suffix, and accepts every
dash rather than only the ASCII hyphen — the Indigo Book prints
`42 U.S.C. § 2000ff–5(a)` with an en dash, and a reader that accepts one dash
and not another reports a different section depending on which key the author
pressed:

```
(?P<section>\d+[a-zA-Z]{0,3}(?:[\-\u2010-\u2015\u2212.:]\d+[a-zA-Z]{0,3})*)
```

Trailing `(a)`-style subsections are deliberately still excluded, because this
port puts them in the pincite. The whole upstream suite passes unchanged;
expectations are in `tests/bluebook-corpus.test.ts` (`what the corpus shows`).

**A3 — dropped `flags` argument.** `CustomTokenizer.addSimpleCitationPattern`
passes six arguments to a five-parameter function; the sixth is discarded and
`flags` is hard-coded to `0`. Any consumer passing `caseSensitive: false` gets
the opposite of what they asked for. Fix is an optional `flags = 0` parameter
forwarded to the `BaseTokenExtractor` constructor — additive, no caller changes.

### Tranche B — algorithmic blowups

Each is a self-contained fix with a scaling test. All measured on bun 1.3,
Linux x64.

| # | Problem | Fix | Measured |
| --- | --- | --- | --- |
| B1 | `matchOnTokens` materializes a `words.length`-sized index array per call, though the loop stops after ~300 chars | counted loop; cache the anchored regexes; join collected parts instead of repeated prepending | was ~43% of runtime |
| B2 | `extractLawCitation` copies the document tail and scans **every** parenthetical to EOF, per law citation | match against `sourceText` at an offset with sticky/global regexes; bound the scan | 144 KB of law citations: 1354 ms → 43 ms |
| B3 | `PLACEHOLDER_CITATIONS` retries its greedy leading `[_—–-]+` at every position inside a run | anchor the run to its own start with a lookbehind | 64 KB of underscores: ~20 s → 5.9 ms |
| B4 | `findReferenceCitationsFromMarkup` is cubic — re-tests every candidate position for every (tag, citation) pair | index citations by name; compute candidate positions once per distinct emphasis text; binary search + union-find over consumed positions | 160-paragraph reference pass: 309 ms → 12 ms |
| B5 | `getCourtByParen` calls `new RegExp` for all 2,804 courts on every lookup | compile once, memoize results, defer loading the courts dataset | `court-paren` snippet 14.1 ms → 0.22 ms |

**B2 carries a deliberate behaviour change and must be disclosed in the PR.**
Bounding the scan to 300 characters — the same `MAX_MATCH_CHARS` window
`addLawMetadata` already uses for the same trailing metadata — drops
cross-citation attributions that were wrong. In the benchmark corpus,
`42 U.S.C. § 1983 (2018)` was taking parenthetical `D.C. Cir.` from 400
characters away (it belongs to *United States v. Nixon*) and publisher `Cal.`
from 484 characters away (*Doe v. Roe*), with only filler prose in between.
Citation counts are unchanged: 880 before and after. Lead with this rather than
letting a reviewer discover it.

**B3 needs its equivalence argument stated**, because reviewers are rightly
suspicious of regex changes: starting mid-run is only ever reachable when
starting at the run's start also matched, since the greedy run consumes to the
same place either way. It was verified against the original pattern on 18
hand-written cases and 20,000 random ones.

### Tranche C — the Aho-Corasick pre-filter

The headline change, and the one most likely to need discussion. Send it last,
alone.

`getCitations()` ran all ~8,575 reporter/law/journal regexes over every input.
An `AhocorasickTokenizer` class existed but was not the default and was not an
automaton — it was a `String.includes` loop over thousands of literals.

The change adds a real Aho-Corasick automaton over the literal abbreviation each
extractor's regex requires (`U.S.`, `F.3d`, `Harv. L. Rev.`) and selects
extractors in one pass — typically a few dozen of 8,575. Files:
`src/tokenizers/aho-corasick.ts` (automaton) and `src/tokenizers/ahocorasick.ts`
(the tokenizer that uses it).

Three points a reviewer will want, all already true of the implementation:

1. **Ordering is preserved.** Selected extractors are returned in registration
   order, so tokens and the tie-breaking between tokens covering the same span
   are identical to running everything.
2. **The filter is provably sound, not accidentally sound.** Skipping an
   extractor is only valid if its regex cannot match without its declared
   `strings`. That holds for 8,571 of 8,575 but **not** for four: the three law
   patterns from A2 (`Cal. Code` declared, pattern matches `Cal. Penal Code`)
   and the stop-word pattern (embeds `e.g.` with unescaped dots). The index
   checks at build time that every declared string appears in the pattern as an
   escaped literal, and always runs anything that fails. Note the interaction
   with A2: if A2 is fixed first, those three law extractors start matching, and
   the guard is what keeps the pre-filter correct when they do.
3. **Laziness.** The automaton is built on first use, so importing without
   extracting does not pay for it.

Evidence to include (baseline → after):

| Workload | Before | After |
| --- | --- | --- |
| One-line citation | 12.3 ms | 0.11 ms |
| Mixed paragraph | 17.7 ms | 0.33 ms |
| 42 KB document, 880 citations | 680 ms | 25 ms |
| Markup / HTML path | 9.4 ms | 0.24 ms |
| Module import | 752 ms | 130 ms |
| First `getCitations()` | 2590 ms | 53 ms |
| Throughput | 0.06 MB/s | 1.74 MB/s |
| Test suite | 10.6 s | 2.4 s |

### Tranche D — packaging and tests

Small, independent, easy yes:

- Drop `diff-match-patch` and `css-select` from `dependencies` — verified unused
  across `src/`, `tests/`, `examples/` and `scripts/`.
- Put `types` first in the `exports` map so TypeScript's `node16`/`bundler`
  resolution finds it, add a `default` condition and a `./package.json` entry,
  and point `main` at the CJS build (`"type": "module"` makes `dist/index.js`
  ESM, so a `require()` of `main` currently gets ESM).
- Memoize `getLawRegexVariables()`, rebuilt for each of 388 law patterns at
  startup.
- The test files: `tests/prefilter.test.ts` and the `Law Citation Trailing
  Metadata Scope` block in `tests/find.test.ts`.
- Optionally `bench/` (harness + corpus + golden-output tool).

**Do not upstream** anything the sync script overrides locally: the package
`name`, `description`, `homepage`, `repository`, `bugs`, the `sync:upstream`
script, `PUBLISHING.md`, the README's sync banner, `.upstream-sync.json`,
`scripts/sync-upstream.mjs`, `docs/UPSTREAM_SYNC.md`, or this file. They are
fork-specific by construction.

**`"sideEffects": false` is a trap — do not propose it.** It looks like free
tree-shaking, but with this module structure `bun build` shrinks the entry to
643 bytes and the bundle then throws
`Export 'AhocorasickTokenizer' is not defined in module`.

---

## 2. Where the code is

All of it is on `wbarnha/eyesight-ts`, branch
`claude/library-optimization-8jx66j` (PR #2), seven commits on top of `2e2c42d`:

```
7e84fc5 docs: update README for the measured performance and current test count
02e2cdf perf: skip root map lookups for characters that start no pattern; polish exports
7bdaa53 perf: make the HTML reference-citation pass near-linear          <- B4
9434588 fix: make the extractor pre-filter provably sound; fix quadratic placeholder regex  <- C(2), B3
c46d802 perf: bound the law-citation trailer scan instead of reading to end of document     <- B2
5205c9f perf: hoist per-call regexes; add pre-filter and SpanUpdater regression tests
0b1cd64 perf: filter extractors with an Aho-Corasick automaton and fix hot paths            <- C, B1, B5, A1, D
```

The commits are not one-per-tranche, so expect to split `0b1cd64` and `9434588`
when cherry-picking. `git log -p --follow <file>` per file is the easier route.

---

## 3. How to verify a patch in upstream's tree

Whatever you port, prove it there rather than trusting the numbers here — the
upstream tree may have moved since `bb8d1e5b`.

The two harnesses in `bench/` are the tools for this and are worth copying over
even if you do not upstream them:

```bash
# Record every citation's type, span, groups, metadata and editions, plus the
# annotated HTML and resolution groups, for a corpus.
bun run bench/golden.ts write /tmp/before.json

# ...apply the change...

bun run bench/golden.ts check /tmp/before.json   # byte-identical, or it prints the diff
bun run bench/bench.ts                           # timings
```

Every change in tranches B, C and D except B2 is byte-identical on the golden
snapshot. B2 changes it deliberately, in the way described above. If a port you
write is *not* byte-identical and you did not intend that, you have a bug.

For the pre-filter specifically, `tests/prefilter.test.ts` contains the argument
that makes it safe and should be ported with it: for each corpus document, every
extractor the filter skips is asserted to produce zero matches, and the filtered
tokenizer's tokens are compared against running all 8,575 extractors. Roughly
146,000 assertions.

---

## 4. Writing the PRs

- **One concern per PR.** A2 and A3 are two-line fixes; do not bundle them with
  the automaton.
- **Lead with the reproducer.** For A1/A2/A3 a three-line snippet showing the
  wrong output is more persuasive than any prose.
- **Give benchmark numbers a method.** State runtime, platform, input size, and
  that timings are best-of-N minimums. Include the harness so results are
  reproducible.
- **Disclose behaviour changes in the first paragraph**, not a footnote. B2 is
  the only one.
- **Do not describe the numbers as improvements to "eyecite".** They are for the
  TypeScript port; the Python implementation is a separate codebase with its own
  performance characteristics.

---

## 5. After something lands

1. Wait for the daily sync (or dispatch `sync-upstream` manually) to pull the
   accepted change onto the `upstream` vendor branch.
2. Merge the resulting `upstream` → `main` PR **with a merge commit**.
3. Expect a conflict in the file you upstreamed — both sides now carry the same
   change. Resolve by taking upstream's version, which retires the local copy
   and removes that file from the divergence permanently.
4. Cross it off in this document.

The end state worth aiming for: `main` differs from the vendor branch only by
fork-specific files, and syncs merge with no conflicts at all.
