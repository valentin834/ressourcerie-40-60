import { verifySlackSignature, extractUrls, buildDetectionBlocks } from '@/lib/slack'
import { createHmac } from 'crypto'

function makeSignature(body: string, timestamp: string, secret: string) {
  const base = `v0:${timestamp}:${body}`
  const hmac = createHmac('sha256', secret).update(base).digest('hex')
  return `v0=${hmac}`
}

describe('verifySlackSignature', () => {
  it('returns true for valid signature', () => {
    const secret = 'test-secret'
    const body = 'payload=abc'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const sig = makeSignature(body, timestamp, secret)
    expect(verifySlackSignature(body, timestamp, sig, secret)).toBe(true)
  })

  it('returns false for expired timestamp', () => {
    const secret = 'test-secret'
    const body = 'payload=abc'
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 400)
    const sig = makeSignature(body, oldTimestamp, secret)
    expect(verifySlackSignature(body, oldTimestamp, sig, secret)).toBe(false)
  })

  it('returns false for wrong signature', () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    expect(verifySlackSignature('body', timestamp, 'v0=wrong', 'secret')).toBe(false)
  })
})

describe('extractUrls', () => {
  it('extracts a single URL', () => {
    expect(extractUrls('Check this https://example.com out')).toEqual(['https://example.com'])
  })

  it('deduplicates URLs', () => {
    expect(extractUrls('https://a.com https://a.com')).toHaveLength(1)
  })

  it('returns empty array for no URLs', () => {
    expect(extractUrls('no links here')).toEqual([])
  })
})

describe('buildDetectionBlocks', () => {
  it('includes the hostname in the message', () => {
    const blocks = buildDetectionBlocks('https://figma.com/some/path')
    const section = blocks.blocks[0] as { text: { text: string } }
    expect(section.text.text).toContain('figma.com')
  })

  it('sets the button value to the full URL', () => {
    const blocks = buildDetectionBlocks('https://figma.com/some/path')
    const actions = blocks.blocks[1] as { elements: Array<{ value: string }> }
    expect(actions.elements[0].value).toBe('https://figma.com/some/path')
  })
})
