/**
 * Golden-output harness: `bun run bench/golden.ts write|check [file]`
 *
 * Serializes every citation the library extracts from the corpus so that
 * performance work can be proven behaviour-preserving down to the field.
 */
import { LARGE_DOCUMENT, MARKUP_DOCUMENT, PROSE_DOCUMENT, SNIPPETS } from './corpus'
import { getCitations } from '../src/index'
import { annotateCitations } from '../src/annotate'
import { resolveCitations } from '../src/resolve'
import { cleanText } from '../src/clean'

function serializeCitation(citation: any): unknown {
  const sorted = (object: Record<string, unknown> | undefined) => {
    if (!object) return null
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(object).sort()) {
      const value = (object as any)[key]
      if (value !== undefined) result[key] = value
    }
    return result
  }
  return {
    type: citation.constructor.name,
    text: citation.matchedText?.(),
    span: citation.span?.(),
    index: citation.index,
    groups: sorted(citation.groups),
    metadata: sorted(citation.metadata ? { ...citation.metadata } : undefined),
    year: citation.year ?? null,
    editionGuess: citation.editionGuess?.reporter?.editionStr ?? null,
    allEditions: citation.allEditions?.map((e: any) => e.reporter?.editionStr) ?? null,
  }
}

function snapshot(): unknown {
  const cases: Array<[string, string]> = [
    ...SNIPPETS,
    ['large-document', LARGE_DOCUMENT],
    ['prose-document', PROSE_DOCUMENT],
  ]

  const result: Record<string, unknown> = {}
  for (const [name, text] of cases) {
    const citations = getCitations(text)
    result[name] = {
      citations: citations.map(serializeCitation),
      annotated: annotateCitations(text, citations),
      resolved: [...resolveCitations(citations as any).entries()].map(([resource, group]) => [
        (resource as any)?.citation?.matchedText?.() ?? String(resource),
        group.map((c: any) => c.matchedText?.()),
      ]),
    }
  }

  // Markup path exercises SpanUpdater and the HTML cleaners.
  const markupCitations = getCitations('', false, undefined, MARKUP_DOCUMENT, ['html', 'all_whitespace'])
  result['markup'] = {
    citations: markupCitations.map(serializeCitation),
    cleaned: cleanText(MARKUP_DOCUMENT, ['html', 'all_whitespace']),
  }

  return result
}

const mode = process.argv[2] ?? 'check'
const file = process.argv[3] ?? '/tmp/eyesight-golden.json'
const serialized = JSON.stringify(snapshot(), null, 2)

if (mode === 'write') {
  await Bun.write(file, serialized)
  console.log(`wrote golden snapshot -> ${file} (${serialized.length} bytes)`)
} else {
  const expected = await Bun.file(file).text()
  if (expected === serialized) {
    console.log('golden snapshot MATCHES')
  } else {
    const a = expected.split('\n')
    const b = serialized.split('\n')
    let shown = 0
    for (let i = 0; i < Math.max(a.length, b.length) && shown < 40; i++) {
      if (a[i] !== b[i]) {
        console.log(`line ${i + 1}:\n  - ${a[i]}\n  + ${b[i]}`)
        shown++
      }
    }
    console.error('golden snapshot DIFFERS')
    process.exit(1)
  }
}
