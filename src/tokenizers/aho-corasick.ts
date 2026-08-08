/**
 * Aho-Corasick automaton used to pre-filter token extractors.
 *
 * Every citation extractor's regex contains a literal reporter/journal/law
 * abbreviation (e.g. `U.S.`, `F.3d`, `Harv. L. Rev.`). A regex therefore cannot
 * match unless that literal appears in the text, so we can decide which of the
 * thousands of extractors are worth running by locating all of those literals in
 * a single left-to-right pass over the text.
 *
 * The automaton is built once and reused. Matching is O(text length + matches)
 * regardless of how many patterns are registered, which replaces the
 * O(patterns x text length) scan a naive `text.includes(pattern)` loop performs.
 */

/**
 * Stride used to pack `(node, charCode)` into a single numeric map key. It is
 * the size of the Unicode code space, so any code unit fits without collisions
 * and the key stays well inside the safe integer range.
 */
const ALPHABET_STRIDE = 0x110000

export class AhoCorasick {
  /** Packed `node * ALPHABET_STRIDE + charCode` -> child node. */
  private readonly transitions = new Map<number, number>()
  /**
   * Children as a first-child / next-sibling linked list rather than an array
   * per node: only the failure-link BFS needs to enumerate children, and a
   * per-node array would allocate once for every node in the trie.
   */
  private firstChild: number[] = [-1]
  private nextSibling: number[] = [-1]
  /** Incoming code unit of each node, used when walking the sibling list. */
  private incomingCode: number[] = [-1]
  /** Pattern id terminating at each node, or -1. */
  private terminals: number[] = [-1]
  private nodeCount = 1
  private built = false

  private failure = new Int32Array(0)
  /** Nearest proper suffix node that terminates a pattern, or 0. */
  private dictionaryLink = new Int32Array(0)
  /**
   * Generation stamps let a search skip nodes it has already reported without
   * reallocating a "visited" array on every call.
   */
  private visitStamp = new Int32Array(0)
  private generation = 0

  /**
   * Register a pattern. Patterns must be added before the first search; adding
   * the same string twice registers it twice, so callers should de-duplicate.
   */
  add(pattern: string, patternId: number): void {
    if (this.built) {
      // build() releases the trie's child links, so growing the automaton
      // afterwards would silently corrupt it. Callers build a fresh instance.
      throw new Error('AhoCorasick: cannot add patterns after build()')
    }
    if (pattern.length === 0) return

    let node = 0
    for (let i = 0; i < pattern.length; i++) {
      const code = pattern.charCodeAt(i)
      const key = node * ALPHABET_STRIDE + code
      let next = this.transitions.get(key)
      if (next === undefined) {
        next = this.nodeCount++
        this.transitions.set(key, next)
        this.firstChild.push(-1)
        this.incomingCode.push(code)
        this.terminals.push(-1)
        // Link the new node into its parent's child list.
        this.nextSibling.push(this.firstChild[node])
        this.firstChild[node] = next
      }
      node = next
    }
    this.terminals[node] = patternId
  }

  /** Compute failure and dictionary links. Idempotent. */
  build(): void {
    if (this.built) return

    const failure = new Int32Array(this.nodeCount)
    const dictionaryLink = new Int32Array(this.nodeCount)
    const queue = new Int32Array(this.nodeCount)
    let head = 0
    let tail = 0

    // Depth-1 nodes fail to the root.
    for (let child = this.firstChild[0]; child !== -1; child = this.nextSibling[child]) {
      failure[child] = 0
      queue[tail++] = child
    }

    while (head < tail) {
      const node = queue[head++]

      // A node inherits its failure node's dictionary link, extending it when
      // the failure node itself terminates a pattern.
      const nodeFailure = failure[node]
      dictionaryLink[node] =
        this.terminals[nodeFailure] >= 0 ? nodeFailure : dictionaryLink[nodeFailure]

      for (let child = this.firstChild[node]; child !== -1; child = this.nextSibling[child]) {
        const code = this.incomingCode[child]

        // Follow failure links until some suffix of the path to `node` can be
        // extended by `code`; reaching the root ends the walk.
        let candidate = failure[node]
        let fallback = this.transitions.get(candidate * ALPHABET_STRIDE + code)
        while (fallback === undefined && candidate !== 0) {
          candidate = failure[candidate]
          fallback = this.transitions.get(candidate * ALPHABET_STRIDE + code)
        }
        failure[child] = fallback === undefined || fallback === child ? 0 : fallback

        queue[tail++] = child
      }
    }

    this.failure = failure
    this.dictionaryLink = dictionaryLink
    this.visitStamp = new Int32Array(this.nodeCount)
    this.generation = 0
    // Child links are only needed for the BFS above.
    this.firstChild = []
    this.nextSibling = []
    this.incomingCode = []
    this.built = true
  }

  /**
   * Report every registered pattern that occurs in `text`. Each pattern is
   * reported at most once per call, in no particular order.
   */
  search(text: string, onMatch: (patternId: number) => void): void {
    if (!this.built) this.build()
    if (this.nodeCount === 1) return

    const { transitions, failure, dictionaryLink, terminals, visitStamp } = this
    const stamp = ++this.generation
    let node = 0

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)

      let next = transitions.get(node * ALPHABET_STRIDE + code)
      while (next === undefined && node !== 0) {
        node = failure[node]
        next = transitions.get(node * ALPHABET_STRIDE + code)
      }
      node = next === undefined ? 0 : next
      if (node === 0) continue

      // Walk the dictionary-link chain, stopping at the first already-visited
      // node: everything above it was reported when that node was stamped.
      let current = node
      while (current !== 0 && visitStamp[current] !== stamp) {
        visitStamp[current] = stamp
        const patternId = terminals[current]
        if (patternId >= 0) onMatch(patternId)
        current = dictionaryLink[current]
      }
    }
  }
}
