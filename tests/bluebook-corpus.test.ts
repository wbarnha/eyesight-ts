/**
 * `getCitations` run over a published citation manual.
 *
 * See `fixtures/indigo-book.ts` for provenance and licence. The short version:
 * eighty-two citations printed in *The Indigo Book* — a CC0 reimplementation of
 * the Bluebook's system — chosen by its authors as examples of the rules they
 * were teaching rather than by us as examples of what the tokenizer handles.
 *
 * Every fixture asserts the full extraction: the class, the matched text and
 * the groups, in order. That includes the seven whose extraction is wrong,
 * which are asserted exactly as they behave today and carry a written
 * `defect`. A known defect that is asserted cannot drift, and fixing one is
 * then a visible edit to the fixture rather than a silent change.
 */

import { describe, expect, test } from 'bun:test'

import { getCitations } from '../src/find'
import {
  INDIGO_DEFECTS,
  INDIGO_EMPTY,
  INDIGO_FIXTURES,
  type IndigoFixture,
} from './fixtures/indigo-book'

function extract(fixture: IndigoFixture) {
  return getCitations(fixture.text).map((citation) => ({
    type: citation.constructor.name,
    matched: citation.matchedText(),
    groups: { ...((citation as { groups?: Record<string, string> }).groups ?? {}) },
  }))
}

describe('Indigo Book corpus', () => {
  describe('the fixture file itself', () => {
    test('gives every fixture a unique id and a rule', () => {
      const ids = INDIGO_FIXTURES.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(INDIGO_FIXTURES.every((f) => f.rule.length > 0)).toBe(true)
    })

    test('draws on both editions of the manual', () => {
      const editions = new Set(INDIGO_FIXTURES.map((f) => f.edition))
      expect([...editions].sort()).toEqual(['1.0', '2.1'])
    })

    test('records what it covers and what it gets wrong', () => {
      // These numbers are the file's summary, not an accident of arithmetic.
      // Moving one is fine; moving it silently is not.
      expect(INDIGO_FIXTURES.length).toBe(82)
      expect(INDIGO_FIXTURES.reduce((n, f) => n + f.expect.length, 0)).toBe(101)
      expect(INDIGO_DEFECTS.length).toBe(7)
      expect(INDIGO_EMPTY.length).toBe(2)
    })

    test('explains every fixture it extracts nothing from', () => {
      const unexplained = INDIGO_EMPTY.filter((f) => f.defect === undefined)
      expect(unexplained.map((f) => f.id)).toEqual([])
    })
  })

  describe('extraction', () => {
    for (const fixture of INDIGO_FIXTURES.filter((f) => f.defect === undefined)) {
      test(`${fixture.rule} ${fixture.id}`, () => {
        expect(extract(fixture)).toEqual([...fixture.expect])
      })
    }
  })

  describe('extraction that is wrong, recorded so it cannot drift', () => {
    for (const fixture of INDIGO_DEFECTS) {
      test(`${fixture.rule} ${fixture.id}: ${fixture.defect}`, () => {
        expect(extract(fixture)).toEqual([...fixture.expect])
      })
    }
  })

  describe('what the corpus shows', () => {
    test('reads a section number only as far as its first letter', () => {
      // Indigo R5.2.2 is about preserving a subsection exactly as the source
      // writes it. These three sections of the Genetic Information
      // Nondiscrimination Act are distinct authorities and extract identically.
      const sections = [
        '42 U.S.C. § 2000ff–5(a).',
        '42 U.S.C. § 2000ff–1(b)(2)(A).',
        '42 U.S.C. § 2000ff(2).',
      ].map((text) => {
        const [citation] = getCitations(text)
        return (citation as unknown as { groups: Record<string, string> }).groups.section
      })

      expect(sections).toEqual(['2000', '2000', '2000'])
    })

    test('keeps a span of sections but drops a trailing letter from it', () => {
      const [plain] = getCitations('18 U.S.C. §§ 3681-82.')
      const [suffixed] = getCitations('21 U.S.C. §§ 301-399i.')

      const section = (c: unknown) => (c as { groups: Record<string, string> }).groups.section

      // A span of bare digits survives intact.
      expect(section(plain)).toBe('3681-82')
      // One with a letter on the end does not, and 399 is a different section
      // from 399i.
      expect(section(suffixed)).toBe('301-399')
    })

    test('reads medium-neutral citations as reporter citations', () => {
      // Indigo R11.1.1 and R11.7.3. The shape is not a reporter citation, but
      // every component lands in the field it belongs in, which is what a
      // consumer of this library needs.
      const neutral = ['2019-Ohio-2880', '2016 UT 20', '2021-Ohio-726'].map((text) => {
        const [citation] = getCitations(text)
        return (citation as unknown as { groups: Record<string, string> }).groups
      })

      expect(neutral).toEqual([
        { volume: '2019', reporter: 'Ohio', page: '2880' },
        { volume: '2016', reporter: 'UT', page: '20' },
        { volume: '2021', reporter: 'Ohio', page: '726' },
      ])
    })

    test('finds the unofficial federal codes as well as the official one', () => {
      // Indigo R16.1.5. Cited in the manual with the publisher in a
      // parenthetical, which the extractor reads as well.
      const [usca] = getCitations('5 U.S.C.A. § 572 (West).')
      const [uscs] = getCitations('30 U.S.C.S. §§ 181-287 (LexisNexis 2015).')

      const groups = (c: unknown) => (c as { groups: Record<string, string> }).groups
      expect(groups(usca).reporter).toBe('U.S.C.A.')
      expect(groups(uscs).reporter).toBe('U.S.C.S.')
      expect(groups(uscs).section).toBe('181-287')
    })
  })
})
