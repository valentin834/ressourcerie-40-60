import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'

export async function GET() {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return NextResponse.json({ error: 'no token' }, { status: 500 })
  const slack = new WebClient(token)
  const res = await slack.auth.test()
  return NextResponse.json({
    ok: res.ok,
    user_id: res.user_id,
    bot_id: res.bot_id,
    team: res.team,
    user: res.user,
    url: res.url,
    team_id: res.team_id,
  })
}
