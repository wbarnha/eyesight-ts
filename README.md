# eyesight-ts

[![npm version](https://badge.fury.io/js/eyesight-ts.svg)](https://badge.fury.io/js/eyesight-ts)
[![License: BSD-2-Clause](https://img.shields.io/badge/License-BSD%202--Clause-orange.svg)](https://opensource.org/licenses/BSD-2-Clause)

A TypeScript library for extracting legal citations from text strings. This is a complete port of the Python [eyecite](https://github.com/freelawproject/eyecite) library, providing fast and accurate legal citation extraction for JavaScript and TypeScript applications.

> This repository is automatically synced from `freelawproject/eyecite`'s `eyecite-ts/` subtree. Once upstream updates are synced, publishing only requires creating a manual GitHub Release.

## Features

- **Comprehensive citation extraction**: Identifies all major citation types including case, statutory, and journal citations
- **Rich metadata extraction**: Extracts case names, pin cites, years, courts, and parentheticals
- **Robust parsing**: Handles complex citation formats, nested parentheticals, and parallel citations
- **Law citations**: Full support for statutory citations (U.S.C., state codes, etc.)
- **Journal citations**: Recognizes law review and journal citations
- **HTML annotation**: Built-in system for marking up citations in HTML documents
- **High performance**: Literal pre-filtering means only the handful of relevant reporter patterns run against a document
- **TypeScript-first**: Full type definitions and excellent IDE support
- **Well-tested**: Comprehensive test suite with 302 passing tests

## Installation

```bash
npm install eyesight-ts
```

```bash
yarn add eyesight-ts
```

```bash
pnpm add eyesight-ts
```

```bash
bun add eyesight-ts
```

## Quick Start

```typescript
import { getCitations } from 'eyesight-ts'

const text = 'See Lissner v. Test, 1 U.S. 1, 5 (1982).'
const citations = getCitations(text)

console.log(citations[0].toString()) // "1 U.S. 1"
console.log(citations[0].metadata.plaintiff) // "Lissner"
console.log(citations[0].metadata.defendant) // "Test"
console.log(citations[0].metadata.pinCite) // "5"
console.log(citations[0].year) // 1982
```

## Supported Citation Types

### Full Case Citations
Extracts complete case citations with case names, reporters, and metadata:

```typescript
const citations = getCitations('Lissner v. Test, 1 U.S. 1, 5 (1982)')
// Extracts: volume=1, reporter=U.S., page=1, pinCite=5, year=1982
```

### Short Form Citations
Handles abbreviated citations referring to previously cited cases:

```typescript
const citations = getCitations('1 U.S. at 5')
// Extracts short form with pin cite
```

### Supra Citations
Identifies supra references:

```typescript
const citations = getCitations('Lissner, supra, at 5')
// Extracts supra citation with antecedent and pin cite
```

### Id Citations
Recognizes id. citations:

```typescript
const citations = getCitations('Id. at 5')
// Extracts id citation with pin cite
```

### Law Citations
Extracts statutory citations:

```typescript
const citations = getCitations('42 U.S.C. § 1983')
// Extracts: title=42, code=U.S.C., section=1983
```

### Journal Citations
Identifies law review and journal citations:

```typescript
const citations = getCitations('123 Harv. L. Rev. 456 (2010)')
// Extracts: volume=123, journal=Harv. L. Rev., page=456, year=2010
```

## Advanced Usage

### Text Cleaning
Clean text before citation extraction:

```typescript
import { getCitations, cleanText } from 'eyesight-ts'

const dirtyText = 'See  Lissner   v.   Test,   1   U.S.   1'
const cleanedText = cleanText(dirtyText, ['all_whitespace'])
const citations = getCitations(cleanedText)
```

### Custom Tokenization
Use custom tokenizers for specialized needs:

```typescript
import { getCitations, DefaultTokenizer } from 'eyesight-ts'

// DefaultTokenizer builds its extractors from the bundled reporter,
// law and journal datasets.
const customTokenizer = new DefaultTokenizer()
const citations = getCitations(text, false, customTokenizer)
```

### Parallel Citations
Handle parallel citations with metadata sharing:

```typescript
const text = 'Lissner v. Test, 1 U.S. 1, 1 S. Ct. 2 (1982)'
const citations = getCitations(text)
// Both citations share metadata (year, case names, etc.)
```

### HTML Annotation
Add markup to citations in HTML documents:

```typescript
import { getCitations, annotateCitations } from 'eyesight-ts'

const text = 'See Lissner v. Test, 1 U.S. 1 (1982).'
const citations = getCitations(text)
const annotated = annotateCitations(text, citations)
// Returns: 'See Lissner v. Test, <span class="citation">1 U.S. 1</span> (1982).'
```

## API Reference

### `getCitations(text, removeAmbiguous?, tokenizer?, markupText?, cleanSteps?)`

Main function to extract citations from text.

**Parameters:**
- `text` (string): The text to extract citations from
- `removeAmbiguous` (boolean, optional): Whether to remove ambiguous citations
- `tokenizer` (Tokenizer, optional): Custom tokenizer instance
- `markupText` (string, optional): HTML markup version of the text
- `cleanSteps` (string[], optional): Text cleaning steps to apply

**Returns:** `CitationBase[]` - Array of extracted citations

### Citation Types

- `FullCaseCitation`: Complete case citations with full metadata
- `ShortCaseCitation`: Abbreviated citations (e.g., "1 U.S. at 5")
- `SupraCitation`: Supra references
- `IdCitation`: Id. citations
- `FullLawCitation`: Statutory citations (e.g., "42 U.S.C. § 1983")
- `FullJournalCitation`: Law review and journal citations
- `ReferenceCitation`: Case name references extracted from resolved citations
- `UnknownCitation`: Unrecognized citation patterns

### Utility Functions

- `cleanText(text, steps)`: Clean text using specified cleaning steps
- `resolveCitations(citations)`: Resolve supra and id citations
- `filterCitations(citations)`: Remove overlapping citations
- `annotateCitations(text, citations, options?)`: Add HTML markup to citations
- `extractReferenceCitations(text, resolvedCitations)`: Extract case name references

## Implementation Status

eyecite-ts provides comprehensive support for case citations with the following features:

### ✅ Fully Implemented
- **Full case citations** with complete metadata extraction
- **Short form citations** including "at" format
- **Supra and Id citations** with antecedent resolution
- **Parallel citations** with metadata sharing
- **Nested parentheticals** with balanced parsing
- **Citation filtering** and overlap detection
- **Text cleaning** utilities
- **Custom tokenization** support
- **Reference citation extraction** using resolved case names
- **Law citations**: Statutory citations (e.g., "42 U.S.C. § 1983") with LAWS data integration
- **Journal citations**: Law review citations with JOURNALS data integration
- **HTML annotation**: Complete citation markup system for HTML documents

## Performance

The library registers roughly 8,500 citation patterns. Rather than running them
all, it loads the literal abbreviation each pattern requires (`U.S.`, `F.3d`,
`Harv. L. Rev.`, ...) into an Aho-Corasick automaton and makes a single pass
over the text to decide which patterns are worth running — typically a few dozen
out of 8,500. Extraction after that is linear in document length.

Measured with `bun run bench` (bun 1.3, Linux x64):

| Workload | Time |
| --- | --- |
| One-line citation | ~0.06–0.11 ms |
| Mixed paragraph (case, law, journal, id, supra) | ~0.33 ms |
| 42 KB document, 880 citations | ~25 ms (1.7 MB/s) |
| 21 KB of prose with no citations | ~2.3 ms |
| HTML with markup annotation | ~0.24 ms |
| Module import | ~130 ms |
| First `getCitations()` (builds the automaton) | ~53 ms |

The automaton is built lazily on first use, so importing the library without
extracting anything does not pay for it.

### Benchmarking

```bash
# Timing across snippets, documents and the markup path
bun run bench

# Record a golden snapshot of every extracted citation, then verify
# a change did not alter any output
bun run bench:golden write /tmp/golden.json
bun run bench:golden check /tmp/golden.json
```

## Testing

The library includes a comprehensive test suite with 302 tests covering all citation types and edge cases:

```bash
# Using Bun (recommended)
bun test

# Using npm
npm test

# Run specific test file
bun test tests/find.test.ts

# Run tests in watch mode
bun test --watch
```

## Development

This project uses [Bun](https://bun.sh) as the primary runtime and package manager.

### Setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Format and lint with Biome
bun run check

# Build for production
bun run build
```

### Project Structure

```
eyecite-ts/
├── src/
│   ├── models/        # Citation and token type definitions
│   ├── tokenizers/    # Text tokenization logic
│   ├── find.ts        # Citation extraction
│   ├── resolve.ts     # Citation resolution
│   ├── clean.ts       # Text cleaning utilities
│   ├── helpers.ts     # Helper functions
│   └── data/          # Reporter and court databases
├── tests/             # Comprehensive test suite
├── bench/             # Benchmark and golden-output harnesses
└── dist/              # Built output (ESM + CJS)
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the [GitHub repository](https://github.com/wbarnha/eyesight-ts).

## License

This project is licensed under the BSD-2-Clause License - see the [LICENSE](LICENSE) file for details.

## Credits

This is a TypeScript port of the Python [eyecite](https://github.com/freelawproject/eyecite) library created by the [Free Law Project](https://free.law/). The original library is used to process millions of legal documents for [CourtListener](https://www.courtlistener.com/) and Harvard's [Caselaw Access Project](https://case.law/).

## Support

- 📚 [Documentation](https://github.com/wbarnha/eyesight-ts#readme)
- 🐛 [Issue Tracker](https://github.com/wbarnha/eyesight-ts/issues)
- 💬 [Discussions](https://github.com/wbarnha/eyesight-ts/discussions)