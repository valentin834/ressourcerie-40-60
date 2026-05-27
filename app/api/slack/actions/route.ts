import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { verifySlackSignature } from '@/lib/slack'
import { scrapeUrl } from '@/lib/scraper'
import { analyzeUrl } from '@/lib/gemini'
import { createSupabaseClient } from '@/lib/supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

async function postToSlack(responseUrl: string, text: string) {
  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replace_original: true, text }),
  })
}

async function processTool(url: string, responseUrl: string, addedBy: string) {
  const supabase = createSupabaseClient()

  // Duplicate check
  const { data: existing, error: lookupError } = await supabase
    .from('tools')
    .select('id, name')
    .eq('url', url)
    .maybeSingle()

  if (lookupError) {
    console.error('[actions/processTool] DB lookup error:', lookupError.message, lookupError.code)
    throw lookupError
  }

  if (existing) {
    await postToSlack(responseUrl, `ℹ️ *${existing.name}* est déjà dans la ressourcerie. <${APP_URL}|Voir la BDD>`)
    return
  }

  // Scrape
  let content
  try {
    content = await scrapeUrl(url)
  } catch {
    await postToSlack(responseUrl, `⚠️ Impossible d'accéder à ce lien.`)
    return
  }

  // Gemini analysis
  let analysis
  try {
    analysis = await analyzeUrl(content)
  } catch (err) {
    console.error('[actions/processTool] Gemini error:', err)
    await postToSlack(responseUrl, `⚠️ Analyse incomplète — <${APP_URL}|Compléter manuellement>`)
    return
  }

  // Save to DB
  const { error } = await supabase.from('tools').insert({ ...analysis, url, added_by: addedBy })
  if (error) {
    console.error('[actions/processTool] DB insert error:', error.message, error.code)
    throw error
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

  // Acknowledge Slack immediately (within 3s), process in background
  waitUntil(
    postToSlack(responseUrl, `⏳ Analyse de \`${new URL(url).hostname}\` en cours…`)
      .then(() => processTool(url, responseUrl, addedBy))
      .catch(async (err) => {
        console.error('processTool error:', err)
        await postToSlack(responseUrl, `⚠️ Une erreur s'est produite. <${APP_URL}|Ajouter manuellement>.`)
          .catch(console.error)
      })
  )

  return new NextResponse('', { status: 200 })
}
