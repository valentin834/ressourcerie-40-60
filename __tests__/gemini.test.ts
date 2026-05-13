import { buildGeminiPrompt, parseGeminiResponse } from '@/lib/gemini'

describe('buildGeminiPrompt', () => {
  it('includes tool title in prompt', () => {
    const prompt = buildGeminiPrompt({ title: 'My Tool', description: 'Desc', body: 'Body' })
    expect(prompt).toContain('My Tool')
  })

  it('includes 40-60 Studio context', () => {
    const prompt = buildGeminiPrompt({ title: '', description: '', body: '' })
    expect(prompt).toContain('40-60 Studio')
  })
})

describe('parseGeminiResponse', () => {
  it('parses valid JSON response', () => {
    const raw = JSON.stringify({
      name: 'Figma',
      type: 'Outil',
      category: 'Design & branding',
      keywords: ['design', 'UI'],
      interest: 'Élevé',
      implementation_time: '5 min',
      what_is_it: 'A design tool.',
      what_for: 'For UI design.',
      studio_interest: 'Very useful.',
    })
    const result = parseGeminiResponse(raw)
    expect(result.name).toBe('Figma')
    expect(result.type).toBe('Outil')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n{"name":"Tool","type":"Outil","category":"Dev & code","keywords":[],"interest":"Moyen","implementation_time":"1h","what_is_it":"x","what_for":"y","studio_interest":"z"}\n```'
    const result = parseGeminiResponse(raw)
    expect(result.name).toBe('Tool')
  })
})
