/**
 * Benchmark harness: `bun run bench`
 *
 * Reports cold start (module import + first extraction) separately from steady
 * state, because the two are dominated by different costs.
 */
import { LARGE_DOCUMENT, MARKUP_DOCUMENT, PROSE_DOCUMENT, SNIPPETS } from './corpus'

const importStart = performance.now()
const { getCitations } = await import('../src/index')
const importMs = performance.now() - importStart

function time(fn: () => unknown): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

function bench(label: string, fn: () => unknown, iterations: number): void {
  for (let i = 0; i < Math.min(iterations, 5); i++) fn() // warm up
  const samples: number[] = []
  for (let i = 0; i < iterations; i++) samples.push(time(fn))
  samples.sort((a, b) => a - b)
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const p50 = samples[Math.floor(samples.length / 2)]
  console.log(
    `${label.padEnd(28)} mean ${mean.toFixed(3).padStart(9)} ms   ` +
      `p50 ${p50.toFixed(3).padStart(9)} ms   min ${samples[0].toFixed(3).padStart(9)} ms`,
  )
}

console.log(`\n=== cold start ===`)
console.log(`module import               ${importMs.toFixed(1)} ms`)
console.log(`first getCitations()        ${time(() => getCitations(SNIPPETS[0][1])).toFixed(1)} ms`)

console.log(`\n=== snippets (1000 iterations each) ===`)
for (const [name, text] of SNIPPETS) {
  bench(name, () => getCitations(text), 1000)
}

console.log(`\n=== documents ===`)
bench(`large (${LARGE_DOCUMENT.length} chars)`, () => getCitations(LARGE_DOCUMENT), 50)
bench(`prose (${PROSE_DOCUMENT.length} chars)`, () => getCitations(PROSE_DOCUMENT), 50)
bench('markup', () => getCitations('', false, undefined, MARKUP_DOCUMENT, ['html', 'all_whitespace']), 200)

const throughputChars = LARGE_DOCUMENT.length
const throughputMs = time(() => getCitations(LARGE_DOCUMENT))
console.log(
  `\nthroughput ${((throughputChars / throughputMs) * 1000 / 1_000_000).toFixed(2)} MB/s on the large document\n`,
)
