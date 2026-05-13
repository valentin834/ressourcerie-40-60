import { extractTextContent } from '@/lib/scraper'

describe('extractTextContent', () => {
  it('extracts title from HTML', () => {
    const html = '<html><head><title>My Tool</title></head><body><p>Description here</p></body></html>'
    const result = extractTextContent(html)
    expect(result.title).toBe('My Tool')
  })

  it('falls back to og:title when no title tag', () => {
    const html = '<html><head><meta property="og:title" content="OG Title" /></head><body></body></html>'
    const result = extractTextContent(html)
    expect(result.title).toBe('OG Title')
  })

  it('extracts meta description', () => {
    const html = '<html><head><meta name="description" content="A cool tool" /></head><body></body></html>'
    const result = extractTextContent(html)
    expect(result.description).toBe('A cool tool')
  })

  it('removes script tags from body', () => {
    const html = '<html><body><script>alert(1)</script><p>Real content</p></body></html>'
    const result = extractTextContent(html)
    expect(result.body).not.toContain('alert')
    expect(result.body).toContain('Real content')
  })

  it('truncates body to 5000 chars', () => {
    const longText = 'a'.repeat(10000)
    const html = `<html><body><p>${longText}</p></body></html>`
    const result = extractTextContent(html)
    expect(result.body.length).toBeLessThanOrEqual(5000)
  })
})
