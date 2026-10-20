import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { verifySlackSignature } from '@/lib/slack'
import { scrapeUrl } from '@/lib/scraper'
import { analyzeUrl } from '@/lib/gemini'
import { addTool } from '@/lib/slack-storage'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

async function postToSlack(responseUrl: string, text: string) {
  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replace_original: true, text }),
  })
}

async function processTool(url: string, responseUrl: string, addedBy: string) {
  // Scrape — fall back to URL-only if site is protected or unreachable
  let content
  try {
    content = await scrapeUrl(url)
  } catch (err) {
    console.warn('[actions/processTool] Scrape failed, falling back to URL-only:', (err as Error).message)
    const hostname = new URL(url).hostname
    content = { title: hostname, description: url, body: '' }
  }

  // Gemini analysis
  let analysis
  try {
    analysis = await analyzeUrl(content)
  } catch (err) {
    console.error('[actions/processTool] Gemini error:', (err as Error).message)
    await postToSlack(responseUrl, `⚠️ Analyse IA échouée — <${APP_URL}|Compléter manuellement>`)
    return
  }

  // Save to Slack storage
  try {
    const { duplicate } = await addTool(analysis, url, addedBy)
    if (duplicate) {
      await postToSlack(responseUrl, `ℹ️ *${duplicate}* est déjà dans la ressourcerie. <${APP_URL}|Voir la BDD>`)
      return
    }
  } catch (err) {
    console.error('[actions/processTool] storage error:', (err as Error).message)
    await postToSlack(responseUrl, `⚠️ Erreur de sauvegarde — <${APP_URL}|Ajouter manuellement>`)
    return
  }

  await postToSlack(responseUrl, `✅ *${analysis.name}* ajouté à la ressourcerie ! <${APP_URL}|Voir la BDD>`)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const signature = req.headers.get('x-slack-signature') ?? ''

  if (!verifySlackSignature(rawBody, timestamp, signature, process.env.SLACK_SIGNING_SECRET!)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const payload = JSON.parse(params.get('payload') ?? '{}')

  if (payload.type !== 'block_actions') {
    return new NextResponse('', { status: 200 })
  }

  const action = payload.actions?.[0]
  if (action?.action_id !== 'add_tool') {
    return new NextResponse('', { status: 200 })
  }

  const url: string = action.value
  const responseUrl: string = payload.response_url
  const addedBy: string = payload.user?.name ?? payload.user?.id ?? 'unknown'

  waitUntil(
    postToSlack(responseUrl, `⏳ Analyse de \`${new URL(url).hostname}\` en cours…`)
      .then(() => processTool(url, responseUrl, addedBy))
      .catch(async (err) => {
        console.error('processTool error:', err)
        await postToSlack(responseUrl, `⚠️ Une erreur inattendue. <${APP_URL}|Ajouter manuellement>.`)
          .catch(console.error)
      })
  )

  return new NextResponse('', { status: 200 })
}
