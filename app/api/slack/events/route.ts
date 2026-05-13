import { NextRequest, NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { verifySlackSignature, extractUrls, buildDetectionBlocks } from '@/lib/slack'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const signature = req.headers.get('x-slack-signature') ?? ''

  if (!verifySlackSignature(rawBody, timestamp, signature, process.env.SLACK_SIGNING_SECRET!)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = JSON.parse(rawBody)

  // Slack sends a challenge on first setup — respond with it
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge })
  }

  const event = body.event

  // Ignore bot messages, edits, and non-message events
  if (!event || event.type !== 'message' || event.bot_id || event.subtype) {
    return new NextResponse('', { status: 200 })
  }

  const urls = extractUrls(event.text ?? '')
  if (urls.length === 0) {
    return new NextResponse('', { status: 200 })
  }

  // Post button for first URL only (fire-and-forget)
  slack.chat.postMessage({
    channel: event.channel,
    thread_ts: event.ts,
    ...buildDetectionBlocks(urls[0]),
  }).catch(console.error)

  return new NextResponse('', { status: 200 })
}
