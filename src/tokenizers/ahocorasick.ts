import { AhoCorasick } from './aho-corasick'
import type { TokenExtractor } from './base'
import { Tokenizer } from './base'

/**
 * Tokenizer that only runs the extractors whose literal strings actually occur
 * in the text.
 *
 * Every extractor declares the literal abbreviations its regex requires (`U.S.`,
 * `F.3d`, `Harv. L. Rev.`, ...). Those literals are loaded into an Aho-Corasick
 * automaton, so one pass over the text selects the handful of relevant
 * extractors out of the thousands registered.
 *
 * The filter is a strict superset of what could possibly match: an extractor is
 * skipped only when a literal its regex cannot match without is absent. Selected
 * extractors are returned in registration order, so the resulting tokens — and
 * the tie-breaking between tokens covering the same span — are identical to
 * running every extractor.
 */
export class AhocorasickTokenizer extends Tokenizer {
  private automaton?: AhoCorasick
  /** Pattern id -> indices into `this.extractors`. */
  private patternExtractors: number[][] = []
  /** Extractors with no literal requirement; always run. */
  private unfilteredIndices: number[] = []
  /**
   * Per-extractor generation stamps, so selecting extractors for a text does not
   * allocate a fresh set on every call.
   */
  private selectionStamps = new Int32Array(0)
  private generation = 0

  constructor(extractors: TokenExtractor[] = []) {
    super(extractors)
  }

  /** Drop the automaton so it is rebuilt on next use. */
  private invalidateIndex(): void {
    this.automaton = undefined
  }

  private ensureIndex(): AhoCorasick {
    // Rebuild when invalidated, or when `extractors` was mutated in place.
    if (this.automaton && this.selectionStamps.length === this.extractors.length) {
      return this.automaton
    }

    const automaton = new AhoCorasick()
    const patternIds = new Map<string, number>()
    this.patternExtractors = []
    this.unfilteredIndices = []

    for (let index = 0; index < this.extractors.length; index++) {
      const extractor = this.extractors[index]
      let indexed = false

      if (extractor.strings) {
        for (const str of extractor.strings) {
          if (!str) continue
          // Lower-casing both patterns and text keeps the filter a superset for
          // case-sensitive extractors too, at the cost of a few extra regex runs.
          const key = str.toLowerCase()
          let patternId = patternIds.get(key)
          if (patternId === undefined) {
            patternId = this.patternExtractors.length
            patternIds.set(key, patternId)
            this.patternExtractors.push([])
            automaton.add(key, patternId)
          }
          this.patternExtractors[patternId].push(index)
          indexed = true
        }
      }

      // No usable literal means we cannot rule the extractor out.
      if (!indexed) this.unfilteredIndices.push(index)
    }

    automaton.build()
    this.automaton = automaton
    this.selectionStamps = new Int32Array(this.extractors.length)
    this.generation = 0
    return automaton
  }

  addExtractor(extractor: TokenExtractor): void {
    super.addExtractor(extractor)
    this.invalidateIndex()
  }

  addExtractors(extractors: TokenExtractor[]): void {
    super.addExtractors(extractors)
    this.invalidateIndex()
  }

  removeExtractor(extractor: TokenExtractor): boolean {
    const result = super.removeExtractor(extractor)
    if (result) this.invalidateIndex()
    return result
  }

  removeExtractors(predicate: (extractor: TokenExtractor) => boolean): number {
    const result = super.removeExtractors(predicate)
    if (result > 0) this.invalidateIndex()
    return result
  }

  setExtractors(extractors: TokenExtractor[]): void {
    super.setExtractors(extractors)
    this.invalidateIndex()
  }

  clearExtractors(): void {
    super.clearExtractors()
    this.invalidateIndex()
  }

  modifyExtractorPatterns(
    modifier: (regex: string, extractor: TokenExtractor) => string,
    filter?: (extractor: TokenExtractor) => boolean,
  ): void {
    super.modifyExtractorPatterns(modifier, filter)
    this.invalidateIndex()
  }

  getExtractors(text: string): TokenExtractor[] {
    const automaton = this.ensureIndex()

    const stamps = this.selectionStamps
    if (this.generation === 0x7fffffff) {
      stamps.fill(0)
      this.generation = 0
    }
    const stamp = ++this.generation

    for (const index of this.unfilteredIndices) {
      stamps[index] = stamp
    }

    const { patternExtractors } = this
    automaton.search(text.toLowerCase(), (patternId) => {
      for (const index of patternExtractors[patternId]) {
        stamps[index] = stamp
      }
    })

    // Registration order is preserved so token precedence matches the unfiltered
    // tokenizer exactly.
    const selected: TokenExtractor[] = []
    for (let index = 0; index < this.extractors.length; index++) {
      if (stamps[index] === stamp) selected.push(this.extractors[index])
    }
    return selected
  }
}
