/**
 * Extraction fixtures from *The Indigo Book: A Manual of Legal Citation*.
 *
 * Source: Christopher Sprigman & Jennifer Romig et al. eds., *The Indigo Book:
 * A Manual of Legal Citation* (Public.Resource.Org 2d ed. 2021, 2023 update),
 * <https://law.resource.org/pub/us/code/blue/indigobook-2.1.html>, and the
 * First Edition (2016),
 * <https://law.resource.org/pub/us/code/blue/IndigoBook.html>.
 *
 * The Indigo Book is published under a CC0 public domain dedication — "No
 * Rights Reserved … we waive all copyright and related rights in this work" —
 * so its examples can be copied exactly as printed into a BSD-2-Clause
 * project. The Bluebook itself is copyrighted and is not used here. Cornell's
 * *Introduction to Basic Legal Citation*, the other obvious candidate, carries
 * "All Rights Reserved © Peter W. Martin" on every page and contributed
 * nothing to this file.
 *
 * **What this corpus is for.** The existing suites are built from citations
 * chosen to exercise the tokenizer. These were chosen by someone else, for a
 * different purpose: each one is printed in a citation manual as an example of
 * the rule it obeys. That makes it an outside check on coverage — the manual
 * decides what a lawyer is likely to write, and this file records how much of
 * it the library reads.
 *
 * Every `text` appears verbatim in the edition named, including its
 * typographic apostrophes and en dashes.
 *
 * Where the extraction is demonstrably wrong, `defect` says so and the test
 * asserts the wrong answer anyway. That is deliberate: a known defect that is
 * asserted cannot drift, and fixing one is then a visible change to this file
 * rather than a silent change in behaviour.
 *
 * Seven fixtures carried one when this file was written. Three have been
 * fixed, all of them the same defect: a section number was truncated at its
 * first letter. `42 U.S.C. § 2000ff-5(a)` came back as section `2000`, so
 * three distinct subsections of one Act extracted identically;
 * `21 U.S.C. §§ 301-399i` came back as `301-399`, a different range; and
 * `17 C.F.R. § 240.10b-5` came back as `240.10`, a different rule.
 *
 * Four remain, and they are coverage rather than wrong answers: a span written
 * with `to`, a state code cited by title, C.F.R. parts, and rules of
 * procedure.
 */

/** The class name `getCitations` returns for a fixture. */
export type IndigoCitationType =
  | 'FullCaseCitation'
  | 'FullLawCitation'
  | 'FullJournalCitation'
  | 'ShortCaseCitation'
  | 'IdCitation'
  | 'SupraCitation'
  | 'ReferenceCitation'
  | 'UnknownCitation'

export interface IndigoExtraction {
  readonly type: IndigoCitationType
  /** `matchedText()`, exactly. */
  readonly matched: string
  /** The `groups` the citation carries. Asserted in full. */
  readonly groups: Readonly<Record<string, string>>
}

export interface IndigoFixture {
  readonly id: string
  /** The rule or table the example is printed under, e.g. `"R12.3.1"`. */
  readonly rule: string
  /** Which edition of the manual prints it. */
  readonly edition: '1.0' | '2.1'
  readonly text: string
  /** What `getCitations` returns, in order. */
  readonly expect: readonly IndigoExtraction[]
  /** Set where the extraction above is wrong, and how. */
  readonly defect?: string
  /** Set where the extraction is right but worth explaining. */
  readonly note?: string
}

export const INDIGO_FIXTURES: readonly IndigoFixture[] = [
  {
    id: 'r11-1-halleck',
    rule: 'R11.1',
    edition: '2.1',
    text: 'Manhattan Cmty. Access Corp. v. Halleck, 139 S. Ct. 1921 (2019).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '139 S. Ct. 1921',
        groups: { volume: '139', reporter: 'S. Ct.', page: '1921' },
      },
    ],
  },
  {
    id: 'r11-1-green-day',
    rule: 'R11.1',
    edition: '2.1',
    text: 'Seltzer v. Green Day, 725 F.3d 1170 (9th Cir. 2013).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '725 F.3d 1170',
        groups: { volume: '725', reporter: 'F.3d', page: '1170' },
      },
    ],
  },
  {
    id: 'r11-1-pepsico',
    rule: 'R11.1',
    edition: '2.1',
    text: 'Leonard v. Pepsico, Inc., 88 F. Supp. 2d 116, 127 (S.D.N.Y. 1999).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '88 F. Supp. 2d 116',
        groups: { volume: '88', reporter: 'F. Supp. 2d', page: '116' },
      },
    ],
  },
  {
    id: 'r11-1-scigrip',
    rule: 'R11.1',
    edition: '2.1',
    text: 'SciGrip, Inc. v. Osae, 838 S.E.2d 334 (N.C. 2020).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '838 S.E.2d 334',
        groups: { volume: '838', reporter: 'S.E.2d', page: '334' },
      },
    ],
  },
  {
    id: 'r11-1-lucero',
    rule: 'R11.1',
    edition: '2.1',
    text: 'People v. Lucero, 747 P.2d 660 (Colo. 1987).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '747 P.2d 660',
        groups: { volume: '747', reporter: 'P.2d', page: '660' },
      },
    ],
  },
  {
    id: 'r11-1-stofer',
    rule: 'R11.1',
    edition: '2.1',
    text: 'Mercer Univ. v. Stofer, 841 S.E.2d 224 (Ga. Ct. App. 2020).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '841 S.E.2d 224',
        groups: { volume: '841', reporter: 'S.E.2d', page: '224' },
      },
    ],
  },
  {
    id: 'r11-1-1-parallel-georgia',
    rule: 'R11.1.1',
    edition: '2.1',
    text: 'Mercer Univ. v. Stofer, 306 Ga. 191, 830 S.E.2d 169 (2019).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '306 Ga. 191',
        groups: { volume: '306', reporter: 'Ga.', page: '191' },
      },
      {
        type: 'FullCaseCitation',
        matched: '830 S.E.2d 169',
        groups: { volume: '830', reporter: 'S.E.2d', page: '169' },
      },
    ],
  },
  {
    id: 'r11-1-1-parallel-utah',
    rule: 'R11.1.1',
    edition: '2.1',
    text: 'USA Power LLC v. PacifiCorp, 2016 UT 20, 372 P.3d 629.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '2016 UT 20',
        groups: { volume: '2016', reporter: 'UT', page: '20' },
      },
      {
        type: 'FullCaseCitation',
        matched: '372 P.3d 629',
        groups: { volume: '372', reporter: 'P.3d', page: '629' },
      },
    ],
  },
  {
    id: 'r11-1-1-parallel-ohio',
    rule: 'R11.1.1',
    edition: '2.1',
    text: 'State ex rel. Pilarczyk v. Geauga Cty., 2019-Ohio-2880, 157 Ohio St. 3d 191, 134 N.E.3d 142.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '2019-Ohio-2880',
        groups: { volume: '2019', reporter: 'Ohio', page: '2880' },
      },
      {
        type: 'FullCaseCitation',
        matched: '157 Ohio St. 3d 191',
        groups: { volume: '157', reporter: 'Ohio St. 3d', page: '191' },
      },
      {
        type: 'FullCaseCitation',
        matched: '134 N.E.3d 142',
        groups: { volume: '134', reporter: 'N.E.3d', page: '142' },
      },
    ],
    note: "Ohio's medium-neutral citation is read as volume 2019, reporter `Ohio`, page 2880 — the shape of a reporter citation rather than a neutral one, but every component lands in the right field.",
  },
  {
    id: 'r11-1-3-subsequent-history',
    rule: 'R11.1.3',
    edition: '2.1',
    text: 'Leonard v. Pepsico, Inc., 88 F. Supp. 2d 116, 127 (S.D.N.Y. 1999), aff’d, 210 F.3d 88 (2d Cir. 2000) (per curiam).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '88 F. Supp. 2d 116',
        groups: { volume: '88', reporter: 'F. Supp. 2d', page: '116' },
      },
      {
        type: 'FullCaseCitation',
        matched: '210 F.3d 88',
        groups: { volume: '210', reporter: 'F.3d', page: '88' },
      },
    ],
  },
  {
    id: 'r11-6-terrible',
    rule: 'R11.6',
    edition: '2.1',
    text: 'Terrible v. Terrible, 534 P.2d 919 (Nev. 1975).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '534 P.2d 919',
        groups: { volume: '534', reporter: 'P.2d', page: '919' },
      },
    ],
  },
  {
    id: 'r11-6-1-baal',
    rule: 'R11.6.1',
    edition: '2.1',
    text: 'Demosthenes v. Baal, 495 U.S. 731 (1990).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '495 U.S. 731',
        groups: { volume: '495', reporter: 'U.S.', page: '731' },
      },
    ],
  },
  {
    id: 'r11-6-1-currency',
    rule: 'R11.6.1',
    edition: '2.1',
    text: 'United States v. $124,570 U.S. Currency, 873 F.2d 1240 (9th Cir. 1989).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '873 F.2d 1240',
        groups: { volume: '873', reporter: 'F.2d', page: '1240' },
      },
    ],
  },
  {
    id: 'r11-6-1-gucci',
    rule: 'R11.6.1',
    edition: '2.1',
    text: 'Gucci America, Inc. v. Guess?, Inc., 831 F. Supp. 2d 723 (S.D.N.Y. 2011).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '831 F. Supp. 2d 723',
        groups: { volume: '831', reporter: 'F. Supp. 2d', page: '723' },
      },
    ],
  },
  {
    id: 'r11-6-1-hamburger',
    rule: 'R11.6.1',
    edition: '2.1',
    text: 'Hamburger v. Fry, 338 P.2d 1088 (Okla. 1958).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '338 P.2d 1088',
        groups: { volume: '338', reporter: 'P.2d', page: '1088' },
      },
    ],
  },
  {
    id: 'r11-6-1-camp',
    rule: 'R11.6.1',
    edition: '2.1',
    text: 'Camp v. Superman, 119 Vt. 62 (1955).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '119 Vt. 62',
        groups: { volume: '119', reporter: 'Vt.', page: '62' },
      },
    ],
  },
  {
    id: 'r11-6-3-parallel-illinois',
    rule: 'R11.6.3',
    edition: '2.1',
    text: 'Harden v. Playboy Enterprises, Inc., 261 Ill. App. 3d 443, 633 N.E.2d 764 (1993).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '261 Ill. App. 3d 443',
        groups: { volume: '261', reporter: 'Ill. App. 3d', page: '443' },
      },
      {
        type: 'FullCaseCitation',
        matched: '633 N.E.2d 764',
        groups: { volume: '633', reporter: 'N.E.2d', page: '764' },
      },
    ],
  },
  {
    id: 'r11-6-3-parallel-illinois-pincites',
    rule: 'R11.6.3',
    edition: '2.1',
    text: 'Harden v. Playboy Enterprises, Inc., 261 Ill. App. 3d 443, 444, 633 N.E.2d 764, 765 (1993).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '261 Ill. App. 3d 443',
        groups: { volume: '261', reporter: 'Ill. App. 3d', page: '443' },
      },
      {
        type: 'FullCaseCitation',
        matched: '633 N.E.2d 764',
        groups: { volume: '633', reporter: 'N.E.2d', page: '764' },
      },
    ],
  },
  {
    id: 'r11-7-mattel',
    rule: 'R11.7',
    edition: '2.1',
    text: 'Mattel, Inc. v. MCA Records, Inc., 296 F.3d 894, 908 (9th Cir. 2002) (“The parties are advised to chill.”).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '296 F.3d 894',
        groups: { volume: '296', reporter: 'F.3d', page: '894' },
      },
    ],
  },
  {
    id: 'r11-7-1-multiple-pages',
    rule: 'R11.7.1',
    edition: '2.1',
    text: 'Gordon v. Secretary of State of New Jersey, 460 F. Supp. 1026, 1026, 1028 (D.N.J. 1978) (dismissing a complaint charging that plaintiff, by reason of his illegal incarceration in jail, had been deprived of the office of the President of the United States).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '460 F. Supp. 1026',
        groups: { volume: '460', reporter: 'F. Supp.', page: '1026' },
      },
    ],
  },
  {
    id: 'r11-7-2-page-span',
    rule: 'R11.7.2',
    edition: '2.1',
    text: 'Helton v. State, 311 So. 2d 381, 382-84 (Fla. Dist. Ct. App. 1975) (reciting the prosecutor’s closing arguments in a parody of “’Twas the Night Before Christmas”).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '311 So. 2d 381',
        groups: { volume: '311', reporter: 'So. 2d', page: '381' },
      },
    ],
  },
  {
    id: 'r11-7-3-medium-neutral-paragraph',
    rule: 'R11.7.3',
    edition: '2.1',
    text: 'Couch v. Durrani, 2021-Ohio-726, ¶ 9 (Ct. App. 2021).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '2021-Ohio-726',
        groups: { volume: '2021', reporter: 'Ohio', page: '726' },
      },
    ],
  },
  {
    id: 'r12-1-learning-curve',
    rule: 'R12.1',
    edition: '2.1',
    text: 'Learning Curve Toys, Inc. v. PlayWood Toys, Inc., 342 F.3d 714 (7th Cir. 2003).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '342 F.3d 714',
        groups: { volume: '342', reporter: 'F.3d', page: '714' },
      },
    ],
  },
  {
    id: 'r12-1-mga',
    rule: 'R12.1',
    edition: '2.1',
    text: 'Mattel, Inc. v. MGA Ent. Inc., 782 F. Supp. 2d 911 (C.D. Cal. 2011).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '782 F. Supp. 2d 911',
        groups: { volume: '782', reporter: 'F. Supp. 2d', page: '911' },
      },
    ],
  },
  {
    id: 'r12-1-alexander',
    rule: 'R12.1',
    edition: '2.1',
    text: 'Alexander v. Gen. Acc. Fire & Life Assurance Corp., 98 So. 2d 730 (La. Ct. App. 1957).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '98 So. 2d 730',
        groups: { volume: '98', reporter: 'So. 2d', page: '730' },
      },
    ],
  },
  {
    id: 'r12-2-two-pesos',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Two Pesos, Inc. v. Taco Cabana, Inc., 505 U.S. 763 (1992).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '505 U.S. 763',
        groups: { volume: '505', reporter: 'U.S.', page: '763' },
      },
    ],
  },
  {
    id: 'r12-2-google',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Google LLC v. Oracle Am., Inc., 141 S. Ct. 1183 (2021).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '141 S. Ct. 1183',
        groups: { volume: '141', reporter: 'S. Ct.', page: '1183' },
      },
    ],
  },
  {
    id: 'r12-2-batman',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Batman v. Commissioner, 189 F.2d 107 (5th Cir. 1951).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '189 F.2d 107',
        groups: { volume: '189', reporter: 'F.2d', page: '107' },
      },
    ],
  },
  {
    id: 'r12-2-nance',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Nance v. United States, 299 F.2d 122, 124 (D.C. Cir. 1962) (“How do you know it was me, when I had a handkerchief over my face?”).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '299 F.2d 122',
        groups: { volume: '299', reporter: 'F.2d', page: '122' },
      },
    ],
  },
  {
    id: 'r12-2-frigaliment',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Frigaliment Importing Co. v. B.N.S. Int’l Sales Corp., 190 F. Supp. 116, 117 (S.D.N.Y. 1960).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '190 F. Supp. 116',
        groups: { volume: '190', reporter: 'F. Supp.', page: '116' },
      },
    ],
  },
  {
    id: 'r12-2-cartier',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Cartier v. Aaron Faber Inc., 512 F. Supp. 2d 165 (S.D.N.Y. 2007).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '512 F. Supp. 2d 165',
        groups: { volume: '512', reporter: 'F. Supp. 2d', page: '165' },
      },
    ],
  },
  {
    id: 'r12-2-rambler',
    rule: 'R12.2',
    edition: '2.1',
    text: 'State v. One 1970 2-Door Sedan Rambler, 136 N.W. 59 (Neb. 1974).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '136 N.W. 59',
        groups: { volume: '136', reporter: 'N.W.', page: '59' },
      },
    ],
  },
  {
    id: 'r12-2-swindell',
    rule: 'R12.2',
    edition: '2.1',
    text: 'Brown v. Swindell, 198 So. 2d 432, 434 (La. Ct. App. 1967).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '198 So. 2d 432',
        groups: { volume: '198', reporter: 'So. 2d', page: '432' },
      },
    ],
  },
  {
    id: 'r12-2-stroud',
    rule: 'R12.2',
    edition: '2.1',
    text: 'State v. Stroud, 30 Wash. App. 392 (1981).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '30 Wash. App. 392',
        groups: { volume: '30', reporter: 'Wash. App.', page: '392' },
      },
    ],
  },
  {
    id: 'r12-3-1-division-correct',
    rule: 'R12.3.1',
    edition: '2.1',
    text: "Hamel v. Emp. Sec. Dep't, 966 P.2d 1282 (Wash. Ct. App. 1998).",
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '966 P.2d 1282',
        groups: { volume: '966', reporter: 'P.2d', page: '1282' },
      },
    ],
  },
  {
    id: 'r12-3-1-division-incorrect',
    rule: 'R12.3.1',
    edition: '2.1',
    text: "Hamel v. Emp. Sec. Dep't, 966 P.2d 1282 (Wash. Ct. App., Div. 2 1998).",
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '966 P.2d 1282',
        groups: { volume: '966', reporter: 'P.2d', page: '1282' },
      },
    ],
  },
  {
    id: 'r12-3-1-court-in-reporter-us',
    rule: 'R12.3.1',
    edition: '2.1',
    text: 'Kewanee Oil Corp. v. Bicron Co., 416 U.S. 470 (1974).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '416 U.S. 470',
        groups: { volume: '416', reporter: 'U.S.', page: '470' },
      },
    ],
  },
  {
    id: 'r12-3-1-court-in-reporter-pa',
    rule: 'R12.3.1',
    edition: '2.1',
    text: 'Wexler v. Greenberg, 399 Pa. 569, 160 A.2d 430 (1960).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '399 Pa. 569',
        groups: { volume: '399', reporter: 'Pa.', page: '569' },
      },
      {
        type: 'FullCaseCitation',
        matched: '160 A.2d 430',
        groups: { volume: '160', reporter: 'A.2d', page: '430' },
      },
    ],
  },
  {
    id: 'r12-3-2-year-in-neutral',
    rule: 'R12.3.2',
    edition: '2.1',
    text: 'Water & Energy Sys. Tech., Inc. v. Keil, 1999 UT 16, 979 P.2d 829.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '1999 UT 16',
        groups: { volume: '1999', reporter: 'UT', page: '16' },
      },
      {
        type: 'FullCaseCitation',
        matched: '979 P.2d 829',
        groups: { volume: '979', reporter: 'P.2d', page: '829' },
      },
    ],
  },
  {
    id: 'r12-4-1-lexis',
    rule: 'R12.4.1',
    edition: '2.1',
    text: 'Yates v. United States, No. 13–7451, 2015 U.S. LEXIS 1503, at *40 (Feb. 25, 2015).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '2015 U.S. LEXIS 1503',
        groups: { volume: '2015', reporter: 'U.S. LEXIS', page: '1503' },
      },
    ],
    note: 'A LEXIS identifier is modelled as a reporter, so `2015 U.S. LEXIS 1503` extracts as volume, reporter and page. The docket number in front of it is not part of the citation.',
  },
  {
    id: 'r12-4-1-westlaw',
    rule: 'R12.4.1',
    edition: '2.1',
    text: 'State v. Green, No. 2012AP1475–CR, 2013 WL 5811261, at *7 (Wis. Ct. App. Oct. 30, 2013).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '2013 WL 5811261',
        groups: { volume: '2013', reporter: 'WL', page: '5811261' },
      },
    ],
    note: 'A Westlaw identifier is modelled as a reporter in the same way.',
  },
  {
    id: 'r13-1-unpublished-table',
    rule: 'R13.1',
    edition: '2.1',
    text: 'United States v. Leggett, 23 F.3d 409 (6th Cir. 1994) (unpublished table decision).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '23 F.3d 409',
        groups: { volume: '23', reporter: 'F.3d', page: '409' },
      },
    ],
  },
  {
    id: 'r13-1-dissent',
    rule: 'R13.1',
    edition: '2.1',
    text: 'Ward v. Rock Against Racism, 491 U.S. 781 (1989) (Marshall, J., dissenting).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '491 U.S. 781',
        groups: { volume: '491', reporter: 'U.S.', page: '781' },
      },
    ],
  },
  {
    id: 'r13-1-two-parentheticals',
    rule: 'R13.1',
    edition: '2.1',
    text: 'Dep’t of Revenue v. James B. Beam Distilling Co., 377 U.S. 341, 349 (1964) (7–2 decision) (Black, J., dissenting).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '377 U.S. 341',
        groups: { volume: '377', reporter: 'U.S.', page: '341' },
      },
    ],
  },
  {
    id: 'r13-2-app-div',
    rule: 'R13.2',
    edition: '2.1',
    text: 'Stambovsky v. Ackley, 572 N.Y.S.2d 672, 674 (App. Div. 1991) (“[A]s a matter of law, the house is haunted.”).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '572 N.Y.S.2d 672',
        groups: { volume: '572', reporter: 'N.Y.S.2d', page: '672' },
      },
    ],
  },
  {
    id: 'r13-2-foranyic',
    rule: 'R13.2',
    edition: '2.1',
    text: 'People v. Foranyic, 74 Cal. Rptr. 2d 804, 807 (Ct. App. 1998) (holding that police have probable cause to detain someone they see riding a bike at 3 a.m., carrying an axe).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '74 Cal. Rptr. 2d 804',
        groups: { volume: '74', reporter: 'Cal. Rptr. 2d', page: '804' },
      },
    ],
  },
  {
    id: 'r14-3-sub-nom-correct',
    rule: 'R14.3',
    edition: '2.1',
    text: 'United States v. Schmuck, 840 F.2d 384 (7th Cir. 1988), aff’d, 489 U.S. 705 (1989).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '840 F.2d 384',
        groups: { volume: '840', reporter: 'F.2d', page: '384' },
      },
      {
        type: 'FullCaseCitation',
        matched: '489 U.S. 705',
        groups: { volume: '489', reporter: 'U.S.', page: '705' },
      },
    ],
  },
  {
    id: 'r14-3-sub-nom-incorrect',
    rule: 'R14.3',
    edition: '2.1',
    text: 'United States v. Schmuck, 840 F.2d 384 (7th Cir. 1988), aff’d, Schmuck v. United States, 489 U.S. 705 (1989).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '840 F.2d 384',
        groups: { volume: '840', reporter: 'F.2d', page: '384' },
      },
      {
        type: 'FullCaseCitation',
        matched: '489 U.S. 705',
        groups: { volume: '489', reporter: 'U.S.', page: '705' },
      },
    ],
  },
  {
    id: 'r14-4-enslaved-persons',
    rule: 'R14.4',
    edition: '2.1',
    text: 'Rives v. Wilborne, 6 Ala. 45, 47 (1844) (enslaved people at issue).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '6 Ala. 45',
        groups: { volume: '6', reporter: 'Ala.', page: '45' },
      },
    ],
  },
  {
    id: 'r15-3-1-id-same-page',
    rule: 'R15.3.1',
    edition: '2.1',
    text: 'When the author of a work is a judge or legislator, it carries the force of law and cannot be copyrighted. Georgia v. Public.Resource.org, 140 S. Ct. 1498, 1513 (2020). To hold otherwise would be to discourage the use of “official legal works that illuminate the law we are all presumed to know and understand.” Id.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '140 S. Ct. 1498',
        groups: { volume: '140', reporter: 'S. Ct.', page: '1498' },
      },
      {
        type: 'IdCitation',
        matched: 'Id.',
        groups: {},
      },
    ],
  },
  {
    id: 'r15-3-2-id-different-page',
    rule: 'R15.3.2',
    edition: '2.1',
    text: 'Fair use is ultimately a legal question because the question “primarily involves legal work.” Google LLC v. Oracle Am., Inc., 141 S. Ct. 1183, 1199 (2021). Although “subsidiary factual questions” may be involved, the ultimate question is legal rather than factual. Id. at 1200.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '141 S. Ct. 1183',
        groups: { volume: '141', reporter: 'S. Ct.', page: '1183' },
      },
      {
        type: 'IdCitation',
        matched: 'Id.',
        groups: {},
      },
    ],
  },
  {
    id: 'r15-3-3-id-after-string-incorrect',
    rule: 'R15.3.3',
    edition: '2.1',
    text: 'In examining the third factor—the proximity of the parties’ products in the marketplace—courts assess whether the parties occupy “distinct merchandising markets.” Hormel Foods Corp. v. Jim Henson Prods., Inc., 73 F.3d 497, 504 (2d Cir. 1996); Naked Cowboy v. CBS, 844 F. Supp. 2d 510, 517-18 (S.D.N.Y. 2012). For example, would an unsophisticated viewer confuse the source of the long-running daytime television series with another party’s street performances or his souvenirs? Id.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '73 F.3d 497',
        groups: { volume: '73', reporter: 'F.3d', page: '497' },
      },
      {
        type: 'FullCaseCitation',
        matched: '844 F. Supp. 2d 510',
        groups: { volume: '844', reporter: 'F. Supp. 2d', page: '510' },
      },
      {
        type: 'IdCitation',
        matched: 'Id.',
        groups: {},
      },
    ],
    note: 'Both citations of the string cite are found, then the `Id.` — which the manual labels incorrect here precisely because two authorities precede it. The library reports the `Id.` without judging that, which is the right division of labour: finding is not grading.',
  },
  {
    id: 'r15-3-3-short-form-correct',
    rule: 'R15.3.3',
    edition: '2.1',
    text: 'In examining the third factor—the proximity of the parties’ products in the marketplace—courts assess whether the parties occupy “distinct merchandising markets.” Hormel Foods Corp. v. Jim Henson Prods., Inc., 73 F.3d 497, 504 (2d Cir. 1996); Naked Cowboy v. CBS, 844 F. Supp. 2d 510, 517-18 (S.D.N.Y. 2012). For example, would an unsophisticated viewer confuse the source of the long-running daytime television series with another party’s street performances or his souvenirs? Naked Cowboy, 844 F. Supp. 2d at 517-18.',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '73 F.3d 497',
        groups: { volume: '73', reporter: 'F.3d', page: '497' },
      },
      {
        type: 'FullCaseCitation',
        matched: '844 F. Supp. 2d 510',
        groups: { volume: '844', reporter: 'F. Supp. 2d', page: '510' },
      },
      {
        type: 'ShortCaseCitation',
        matched: '844 F. Supp. 2d at 517',
        groups: { volume: '844', reporter: 'F. Supp. 2d', page: '517' },
      },
    ],
  },
  {
    id: 'r5-1-1-single-page',
    rule: 'R5.1.1',
    edition: '2.1',
    text: 'The Supreme Court held that a state cannot copyright its official annotated code because “whatever work that judge or legislator produces in the course of his judicial or legislative duties is not copyrightable” Georgia v. Public.Resource.org, Inc., 140 S. Ct. 1498, 1513 (2020).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '140 S. Ct. 1498',
        groups: { volume: '140', reporter: 'S. Ct.', page: '1498' },
      },
    ],
  },
  {
    id: 'r5-1-2-span-selmon',
    rule: 'R5.1.2',
    edition: '2.1',
    text: 'Selmon v. Hasbro Bradley, Inc., 669 F. Supp. 1267, 1272-73 (S.D.N.Y. 1987).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '669 F. Supp. 1267',
        groups: { volume: '669', reporter: 'F. Supp.', page: '1267' },
      },
    ],
  },
  {
    id: 'r5-1-2-span-mcdonnell',
    rule: 'R5.1.2',
    edition: '2.1',
    text: 'McDonnell Douglas Corp. v. Green, 411 U.S. 792, 799-801 (1973).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '411 U.S. 792',
        groups: { volume: '411', reporter: 'U.S.', page: '792' },
      },
    ],
  },
  {
    id: 'r5-1-3-footnote',
    rule: 'R5.1.3',
    edition: '2.1',
    text: 'Cunningham v. State, 822 S.E.2d 281, 285 n.4 (Ga. 2018) (Hunstein, J.) (“And that’s all she wrote.”).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '822 S.E.2d 281',
        groups: { volume: '822', reporter: 'S.E.2d', page: '281' },
      },
    ],
  },
  {
    id: 'r5-1-3-figure',
    rule: 'R5.1.3',
    edition: '2.1',
    text: 'U.S. v. Rentz, 777 F.3d 1105, 1110 fig. (10th Cir. 2015) (Gorsuch, J.) (diagramming 18 U.S.C. § 924(c)).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '777 F.3d 1105',
        groups: { volume: '777', reporter: 'F.3d', page: '1105' },
      },
      {
        type: 'FullLawCitation',
        matched: '18 U.S.C. § 924',
        groups: { title: '18', reporter: 'U.S.C.', section: '924' },
      },
    ],
  },
  {
    id: 'r5-2-1-usc-section',
    rule: 'R5.2.1',
    edition: '2.1',
    text: '21 U.S.C. § 343.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '21 U.S.C. § 343',
        groups: { title: '21', reporter: 'U.S.C.', section: '343' },
      },
    ],
  },
  {
    id: 'r5-2-1-cfr-section',
    rule: 'R5.2.1',
    edition: '2.1',
    text: '21 C.F.R. § 164.150 (2020).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '21 C.F.R. § 164.150 (2020)',
        groups: { chapter: '21', reporter: 'C.F.R.', section: '164.150', year: '2020' },
      },
    ],
  },
  {
    id: 'r5-2-2-subsection',
    rule: 'R5.2.2',
    edition: '2.1',
    text: '42 U.S.C. § 2000ff–5(a).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '42 U.S.C. § 2000ff–5',
        groups: { title: '42', reporter: 'U.S.C.', section: '2000ff–5' },
      },
    ],
    note: 'The section number keeps its letter suffix and its en dash. It used to be truncated at the first letter -- `2000ff-5(a)` came back as section `2000` -- so this and the fixture below extracted identically despite being different authorities. The trailing `(a)` is still not part of the section, by design: subsections belong to the pincite.',
  },
  {
    id: 'r5-2-2-nested-subsection',
    rule: 'R5.2.2',
    edition: '2.1',
    text: '42 U.S.C. § 2000ff–1(b)(2)(A).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '42 U.S.C. § 2000ff–1',
        groups: { title: '42', reporter: 'U.S.C.', section: '2000ff–1' },
      },
    ],
    note: 'Distinct from `2000ff–5(a)` above, which it was not before: both used to come back as section `2000`.',
  },
  {
    id: 'r5-2-3-span-dropped-digits',
    rule: 'R5.2.3',
    edition: '2.1',
    text: '18 U.S.C. §§ 3681-82.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '18 U.S.C. §§ 3681-82',
        groups: { title: '18', reporter: 'U.S.C.', section: '3681-82' },
      },
    ],
  },
  {
    id: 'r5-2-3-span-written-to',
    rule: 'R5.2.3',
    edition: '2.1',
    text: 'The Genetic Information Nondiscrimination Act of 2008, 42 U.S.C. §§ 2000ff to 2000ff-11.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '42 U.S.C. §§ 2000ff',
        groups: { title: '42', reporter: 'U.S.C.', section: '2000ff' },
      },
    ],
    defect:
      'R5.2.3 permits `to` as a span separator and nothing here reads it, so the citation stops at the first section and the second half of the span is lost.',
  },
  {
    id: 'r5-2-3-cfr-part',
    rule: 'R5.2.3',
    edition: '2.1',
    text: '21 C.F.R. pt. 133 (2020).',
    expect: [],
    defect:
      'A collected span of regulations cited by part rather than section yields nothing at all.',
  },
  {
    id: 'r16-1-1-usc-107',
    rule: 'R16.1.1',
    edition: '2.1',
    text: '17 U.S.C. § 107.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '17 U.S.C. § 107',
        groups: { title: '17', reporter: 'U.S.C.', section: '107' },
      },
    ],
  },
  {
    id: 'r16-1-1-usc-1030',
    rule: 'R16.1.1',
    edition: '2.1',
    text: '18 U.S.C. § 1030.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '18 U.S.C. § 1030',
        groups: { title: '18', reporter: 'U.S.C.', section: '1030' },
      },
    ],
  },
  {
    id: 'r16-1-1-usc-span-letter-suffix',
    rule: 'R16.1.1',
    edition: '2.1',
    text: 'Federal Food, Drug, and Cosmetic Act, 21 U.S.C. §§ 301-399i.',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '21 U.S.C. §§ 301-399i',
        groups: { title: '21', reporter: 'U.S.C.', section: '301-399i' },
      },
    ],
    note: 'The span keeps the trailing letter. It used to come back as `301-399`, which is a different range of sections.',
  },
  {
    id: 'r16-1-3-supplement',
    rule: 'R16.1.3',
    edition: '2.1',
    text: 'Communications Act of 1934, 47 U.S.C. § 223 (2012 & Supp. I 2013).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '47 U.S.C. § 223',
        groups: { title: '47', reporter: 'U.S.C.', section: '223' },
      },
    ],
  },
  {
    id: 'r16-1-5-usca',
    rule: 'R16.1.5',
    edition: '2.1',
    text: '5 U.S.C.A. § 572 (West).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '5 U.S.C.A. § 572',
        groups: { title: '5', reporter: 'U.S.C.A.', section: '572' },
      },
    ],
  },
  {
    id: 'r16-1-7-session-law',
    rule: 'R16.1.7',
    edition: '2.1',
    text: 'Patient Protection and Affordable Care Act, Pub. L. No. 111-148, § 1101, 124 Stat. 119, 141-43 (2010).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: 'Pub. L. No. 111-148, § 1101',
        groups: { reporter: 'Pub. L.', title: '111-148', section: '1101' },
      },
      {
        type: 'FullLawCitation',
        matched: '124 Stat. 119',
        groups: { volume: '124', reporter: 'Stat.', page: '119' },
      },
    ],
  },
  {
    id: 'r17-2-1-florida',
    rule: 'R17.2.1',
    edition: '2.1',
    text: 'Fla. Stat. § 90.506 (2020).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: 'Fla. Stat. § 90.506 (2020)',
        groups: { reporter: 'Fla. Stat.', section: '90.506', year: '2020' },
      },
    ],
  },
  {
    id: 'r17-3-delaware',
    rule: 'R17.3',
    edition: '2.1',
    text: 'Del. Code tit. 8, § 145 (2021).',
    expect: [
      {
        type: 'UnknownCitation',
        matched: '§',
        groups: {},
      },
    ],
    defect:
      'A state code cited by title comes back as an `UnknownCitation` holding the bare section symbol. `Fla. Stat. § 90.506` extracts correctly two fixtures above, so what defeats it is the `tit. 8,` between the code name and the symbol.',
  },
  {
    id: 'r18-1-1-federal-rule',
    rule: 'R18.1.1',
    edition: '2.1',
    text: 'Fed. R. Civ. P. 12(b)(1).',
    expect: [],
    defect:
      'Rules of procedure are not extracted. The Bluebook cites them by name and number with no section symbol and no reporter, which shares no shape with anything the tokenizer looks for.',
  },
  {
    id: 'v1-r16-lanham-span',
    rule: 'R16',
    edition: '1.0',
    text: 'Lanham (Trademark) Act, 15 U.S.C. §§ 1051-1141n (2012).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '15 U.S.C. §§ 1051-1141n (2012)',
        groups: { title: '15', reporter: 'U.S.C.', section: '1051-1141n', year: '2012' },
      },
    ],
    note: 'Keeps the trailing `n`, and now reaches the year parenthetical it used to stop short of.',
  },
  {
    id: 'v1-r16-stored-communications-span',
    rule: 'R16',
    edition: '1.0',
    text: 'Stored Communications Act, 18 U.S.C.A. §§ 2701-2711 (West 2000).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '18 U.S.C.A. §§ 2701-2711 (West 2000)',
        groups: {
          title: '18',
          reporter: 'U.S.C.A.',
          section: '2701-2711',
          publisher: 'West',
          year: '2000',
        },
      },
    ],
  },
  {
    id: 'v1-r16-mineral-leasing-span',
    rule: 'R16',
    edition: '1.0',
    text: 'Mineral Leasing Act of 1920, 30 U.S.C.S. §§ 181-287 (LexisNexis 2015).',
    expect: [
      {
        type: 'FullLawCitation',
        matched: '30 U.S.C.S. §§ 181-287',
        groups: { title: '30', reporter: 'U.S.C.S.', section: '181-287' },
      },
    ],
  },
  {
    id: 'r7-2-ordinal-2d-correct',
    rule: 'R7.2',
    edition: '2.1',
    text: 'Hormel Foods Corp. v. Jim Henson Prods., Inc., 73 F.3d 497, 504 (2d Cir. 1996).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '73 F.3d 497',
        groups: { volume: '73', reporter: 'F.3d', page: '497' },
      },
    ],
  },
  {
    id: 'r7-2-ordinal-2nd-incorrect',
    rule: 'R7.2',
    edition: '2.1',
    text: 'Hormel Foods Corp. v. Jim Henson Prods., Inc., 73 F.3d 497, 504 (2nd Cir. 1996).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '73 F.3d 497',
        groups: { volume: '73', reporter: 'F.3d', page: '497' },
      },
    ],
    note: 'The ordinal error is in the court parenthetical, which does not affect extraction: this and the correct form yield the same citation.',
  },
  {
    id: 'r7-2-ordinal-3d-correct',
    rule: 'R7.2',
    edition: '2.1',
    text: 'Lerman v. Comm’r, 939 F.2d 44 (3d Cir. 1991), rev’d sub nom. Horn v. Comm’r, 968 F.2d 1229 (D.C. Cir. 1992).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '939 F.2d 44',
        groups: { volume: '939', reporter: 'F.2d', page: '44' },
      },
      {
        type: 'FullCaseCitation',
        matched: '968 F.2d 1229',
        groups: { volume: '968', reporter: 'F.2d', page: '1229' },
      },
    ],
  },
  {
    id: 'r7-2-ordinal-3rd-incorrect',
    rule: 'R7.2',
    edition: '2.1',
    text: 'Lerman v. Comm’r, 939 F.2d 44 (3rd Cir. 1991), rev’d sub nom. Horn v. Comm’r, 968 F.2d 1229 (D.C. Cir. 1992).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '939 F.2d 44',
        groups: { volume: '939', reporter: 'F.2d', page: '44' },
      },
      {
        type: 'FullCaseCitation',
        matched: '968 F.2d 1229',
        groups: { volume: '968', reporter: 'F.2d', page: '1229' },
      },
    ],
  },
  {
    id: 'r12-3-1-redundant-court-derived',
    rule: 'R12.3.1',
    edition: '2.1',
    text: 'Kewanee Oil Corp. v. Bicron Co., 416 U.S. 470 (U.S. 1974).',
    expect: [
      {
        type: 'FullCaseCitation',
        matched: '416 U.S. 470',
        groups: { volume: '416', reporter: 'U.S.', page: '470' },
      },
    ],
  },
]

/** Fixtures whose recorded extraction is known to be wrong. */
export const INDIGO_DEFECTS = INDIGO_FIXTURES.filter((f) => f.defect !== undefined)

/** Fixtures the library extracts nothing from. */
export const INDIGO_EMPTY = INDIGO_FIXTURES.filter((f) => f.expect.length === 0)
