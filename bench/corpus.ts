/**
 * Shared benchmark/verification corpus.
 *
 * Covers every citation family the library extracts so that benchmark numbers
 * and golden-output comparisons exercise the same code paths as real documents.
 */

export const SNIPPETS: Array<[name: string, text: string]> = [
  ['full-case', 'See Lissner v. Test, 1 U.S. 1, 5 (1982).'],
  ['parallel', 'Lissner v. Test, 1 U.S. 1, 1 S. Ct. 2 (1982) (holding that a thing is so).'],
  ['short-form', 'The court reasoned as much. 1 U.S. at 5.'],
  ['supra', 'Lissner, supra, at 5, was not followed.'],
  ['id', 'Id. at 5. Ibid. See id.'],
  ['law', 'Section 1983 claims arise under 42 U.S.C. § 1983 (2018).'],
  ['journal', 'See generally 123 Harv. L. Rev. 456, 478 (2010).'],
  ['no-citations', 'The quick brown fox jumps over the lazy dog. '.repeat(6)],
  [
    'court-paren',
    'Bush v. Gore, 531 U.S. 98 (2000); United States v. Nixon, 418 U.S. 683 (1974) (D.C. Cir.); ' +
      'Smith v. Jones, 123 F.3d 456 (9th Cir. 1997); Doe v. Roe, 1 Cal. 4th 1 (Cal. 1990).',
  ],
  [
    'mixed',
    'See Lissner v. Test, 1 U.S. 1, 5 (1982); accord Brown v. Board of Education, 347 U.S. 483 (1954). ' +
      'But see 42 U.S.C. § 1983; 123 Harv. L. Rev. 456 (2010). Id. at 7. Lissner, supra, at 9. ' +
      'The rule in 1 U.S. at 5 controls, see also 5 F.3d 100, 105 (2d Cir. 1993).',
  ],
]

/** A ~20KB document built from the snippets, approximating a real brief. */
export const LARGE_DOCUMENT = Array.from({ length: 40 }, (_, i) =>
  `Part ${i + 1}. ${SNIPPETS.map(([, text]) => text).join(' ')}`,
).join('\n\n')

/** Prose with no citations at all — measures the pre-filter fast path. */
export const PROSE_DOCUMENT = (
  'The parties dispute whether the agreement was validly formed and whether ' +
  'the doctrine of promissory estoppel applies to the facts of this dispute. '
).repeat(140)

export const MARKUP_DOCUMENT =
  '<p>See <em>Lissner v. Test</em>, 1 U.S. 1, 5 (1982). ' +
  'And <i>Brown v. Board</i>, 347 U.S. 483 (1954).</p>'
