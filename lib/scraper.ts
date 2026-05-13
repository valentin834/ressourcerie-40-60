import * as cheerio from 'cheerio'

export interface ScrapedContent {
  title: string
  description: string
  body: string
}

export function extractTextContent(html: string): ScrapedContent {
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, noscript').remove()

  const title =
    $('title').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    ''

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''

  const body = ($('main, article, [role="main"], body').first().text() || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)

  return { title, description, body }
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 40-60Studio-Bot/1.0)' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`)
  }

  const html = await response.text()
  return extractTextContent(html)
}
