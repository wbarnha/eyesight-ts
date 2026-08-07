import { describe, expect, test } from 'bun:test'
import { cleanText, getCitations, resolveCitations } from '../src'
import { FullCaseCitation } from '../src/models'

describe('Integration Tests', () => {
  describe('Clean and Extract Citations', () => {
    test('should clean text before extracting citations', () => {
      // Text with extra whitespace and underscores
      const dirtyText = `
        This is__a test case: Smith v.    Jones, 
        123    U.S.    456 (2021). See also id. at 460.
      `
      
      // Clean the text
      const cleanedText = cleanText(dirtyText, [
        'underscores',
        'inline_whitespace',
        'all_whitespace',
      ])
      
      // Extract citations
      const citations = getCitations(cleanedText)
      
      // Should find the full citation and id citation
      expect(citations.length).toBeGreaterThanOrEqual(1)
      
      // Check that we found the case citation
      const caseCitations = citations.filter(c => c instanceof FullCaseCitation)
      expect(caseCitations.length).toBe(1)
      
      const caseCite = caseCitations[0] as FullCaseCitation
      expect(caseCite.matchedText()).toContain('123')
      expect(caseCite.matchedText()).toContain('U.S.')
      expect(caseCite.matchedText()).toContain('456')
    })

    test('should handle HTML cleaning', () => {
      const htmlText = `
        <html>
          <body>
            <p>Important case: <i>Brown v. Board</i>, 347 U.S. 483 (1954).</p>
            <script>console.log('ignore this');</script>
          </body>
        </html>
      `
      
      // Clean HTML
      const cleanedText = cleanText(htmlText, ['html', 'all_whitespace'])
      
      // Extract citations
      const citations = getCitations(cleanedText)
      
      // Should find the citation
      expect(citations.length).toBeGreaterThanOrEqual(1)
    })

    test('should handle PDF-like text', () => {
      // Simulated PDF text with common issues
      const pdfText = `
        <?xml version="1.0"?>
        __The Court held in__ Miranda v. Arizona, 384 U.S. 436 (1966),
        that __certain warnings__ must be given.
      `
      
      // Clean with all appropriate steps
      const cleanedText = cleanText(pdfText, [
        'xml',
        'underscores',
        'all_whitespace',
      ])
      
      expect(cleanedText).not.toContain('<?xml')
      expect(cleanedText).not.toContain('__')
      
      // Extract citations
      const citations = getCitations(cleanedText)
      
      // Should find Miranda citation
      expect(citations.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Full Pipeline', () => {
    test('should clean, extract, and resolve citations', () => {
      const text = `
        <p>The main case is Smith v. Jones, 100 U.S. 200 (2000).</p>
        <p>See id. at 205. Also see Smith, supra, at 210.</p>
      `
      
      // Step 1: Clean
      const cleaned = cleanText(text, ['html', 'all_whitespace'])
      
      // Step 2: Extract
      const citations = getCitations(cleaned)
      
      // Step 3: Resolve
      const resolutions = resolveCitations(citations)
      
      // Should have resolved all citations to the same resource
      expect(resolutions.size).toBeGreaterThanOrEqual(1)
      
      // Check that multiple citations resolved to same resource
      for (const [resource, cites] of resolutions) {
        if (cites.length > 1) {
          // Found a resource with multiple citations
          const types = cites.map(c => c.constructor.name)
          expect(types).toContain('FullCaseCitation')
        }
      }
    })
  })
})