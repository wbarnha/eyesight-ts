import { describe, expect, test } from 'bun:test'
import { LARGE_DOCUMENT, MARKUP_DOCUMENT, PROSE_DOCUMENT, SNIPPETS } from '../bench/corpus'
import { SpanUpdater } from '../src/span-updater'
import { AhoCorasick } from '../src/tokenizers/aho-corasick'
import { AhocorasickTokenizer } from '../src/tokenizers/ahocorasick'
import { Tokenizer } from '../src/tokenizers/base'
import { defaultTokenizer } from '../src/tokenizers/default'

/** Deterministic PRNG so failures are reproducible. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

describe('AhoCorasick', () => {
  test('finds exactly the patterns a brute-force scan finds', () => {
    const random = makeRandom(0x5eed)
    const alphabet = 'abc.§ '
    const randomString = (length: number) => {
      let out = ''
      for (let i = 0; i < length; i++) {
        out += alphabet[Math.floor(random() * alphabet.length)]
      }
      return out
    }

    for (let trial = 0; trial < 200; trial++) {
      const patterns = [
        ...new Set(
          Array.from({ length: 1 + Math.floor(random() * 20) }, () =>
            randomString(1 + Math.floor(random() * 6)),
          ),
        ),
      ]

      const automaton = new AhoCorasick()
      patterns.forEach((pattern, id) => automaton.add(pattern, id))
      automaton.build()

      for (let attempt = 0; attempt < 4; attempt++) {
        const text = randomString(Math.floor(random() * 60))

        const found = new Set<number>()
        automaton.search(text, (id) => found.add(id))

        const expected = new Set(
          patterns.map((pattern, id) => (text.includes(pattern) ? id : -1)).filter((id) => id >= 0),
        )

        expect([...found].sort((a, b) => a - b)).toEqual([...expected].sort((a, b) => a - b))
      }
    }
  })

  test('reports each pattern once per search and is reusable across searches', () => {
    const automaton = new AhoCorasick()
    for (const [id, pattern] of ['ab', 'bc', 'c'].entries()) automaton.add(pattern, id)

    for (let run = 0; run < 3; run++) {
      const found: number[] = []
      automaton.search('abcabc', (id) => found.push(id))
      expect(found.sort((a, b) => a - b)).toEqual([0, 1, 2])
    }
  })

  test('rejects patterns added after build', () => {
    const automaton = new AhoCorasick()
    automaton.add('a', 0)
    automaton.build()
    expect(() => automaton.add('b', 1)).toThrow()
  })
})

describe('extractor pre-filtering', () => {
  // Running every extractor is what the filtering replaces, so it is the
  // reference implementation these tests compare against.
  class UnfilteredTokenizer extends Tokenizer {}
  const unfiltered = new UnfilteredTokenizer(defaultTokenizer.extractors)

  const documents: Array<[string, string]> = [
    ...SNIPPETS,
    ['large-document', LARGE_DOCUMENT],
    ['prose-document', PROSE_DOCUMENT],
    ['markup-document', MARKUP_DOCUMENT],
    ['empty', ''],
    ['punctuation-only', '.,;:()[]§¶—–'],
    [
      'uppercased',
      SNIPPETS.map(([, text]) => text)
        .join(' ')
        .toUpperCase(),
    ],
    [
      'lowercased',
      SNIPPETS.map(([, text]) => text)
        .join(' ')
        .toLowerCase(),
    ],
  ]

  test.each(documents)('selects a superset of the extractors that can match: %s', (_name, text) => {
    const selected = new Set(defaultTokenizer.getExtractors(text))

    // Any extractor that actually produces a match must have been selected.
    for (const extractor of unfiltered.extractors) {
      if (selected.has(extractor)) continue
      expect(extractor.getMatches(text)).toHaveLength(0)
    }
  })

  test.each(documents)(
    'produces byte-identical tokens to running every extractor: %s',
    (_name, text) => {
      const [filteredWords, filteredCitations] = defaultTokenizer.tokenize(text)
      const [allWords, allCitations] = unfiltered.tokenize(text)

      expect(filteredWords.map(String)).toEqual(allWords.map(String))
      expect(
        filteredCitations.map(([index, token]) => [index, token.start, token.end, String(token)]),
      ).toEqual(
        allCitations.map(([index, token]) => [index, token.start, token.end, String(token)]),
      )
    },
  )

  test('narrows thousands of extractors down to a handful', () => {
    expect(defaultTokenizer.extractors.length).toBeGreaterThan(1000)
    expect(
      defaultTokenizer.getExtractors('See Lissner v. Test, 1 U.S. 1, 5 (1982).').length,
    ).toBeLessThan(60)
    // Text with no citation-like content still needs the unfiltered extractors.
    expect(defaultTokenizer.getExtractors('').length).toBeLessThan(60)
  })

  test('rebuilds its index when extractors change after first use', () => {
    const usReporter = defaultTokenizer.extractors.filter((extractor) =>
      extractor.strings?.includes('U.S.'),
    )
    expect(usReporter.length).toBeGreaterThan(0)

    const tokenizer = new AhocorasickTokenizer([])
    // First use builds the index against an empty extractor set.
    expect(tokenizer.getExtractors('1 U.S. 1')).toHaveLength(0)

    tokenizer.addExtractors(usReporter)
    expect(tokenizer.getExtractors('1 U.S. 1')).toEqual(usReporter)
    // ...and the literal is still required, so unrelated text selects nothing.
    expect(tokenizer.getExtractors('nothing to see here')).toHaveLength(0)

    tokenizer.clearExtractors()
    expect(tokenizer.getExtractors('1 U.S. 1')).toHaveLength(0)
  })
})

describe('SpanUpdater', () => {
  test('leaves offsets before the first change untouched', () => {
    const updater = new SpanUpdater('abcXYZdef', 'abcdef')
    expect(updater.update(0)).toBe(0)
    expect(updater.update(1)).toBe(1)
  })

  test('shifts offsets after a deletion by the deleted length', () => {
    const updater = new SpanUpdater('abcXYZdef', 'abcdef')
    expect(updater.update(6)).toBe(3)
    expect(updater.update(9)).toBe(6)
  })

  test('shifts offsets after an insertion by the inserted length', () => {
    const updater = new SpanUpdater('foo bar', 'foo baz bar')
    expect(updater.update(0)).toBe(0)
    expect(updater.update(7)).toBe(11)
  })

  test('applies region-specific shifts rather than one global shift', () => {
    // Two separate deletions: offsets between them must shift by less than
    // offsets after both.
    const updater = new SpanUpdater('aaXbbYYcc', 'aabbcc')
    expect(updater.update(0)).toBe(0)
    expect(updater.update(3)).toBe(2) // after the 1-char deletion
    expect(updater.update(7)).toBe(4) // after the 2-char deletion as well
  })
})
