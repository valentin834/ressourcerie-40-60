import { WebClient } from '@slack/web-api'
import type { Tool, GeminiAnalysis } from './types'

// Dedicated channel for tool storage — C0CA5NU2M71 = #ressourcerie-bdd
const DB_CHANNEL = 'C0CA5NU2M71'

function getSlack() {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) throw new Error('SLACK_BOT_TOKEN not set')
  return new WebClient(token)
}

async function ensureJoined(slack: WebClient) {
  try {
    await slack.conversations.join({ channel: DB_CHANNEL })
  } catch {
    // Already a member or missing scope — proceed anyway
  }
}

async function fetchAllMessages(slack: WebClient): Promise<Array<{ text: string }>> {
  const messages: Array<{ text: string }> = []
  let cursor: string | undefined

  do {
    const res = await slack.conversations.history({
      channel: DB_CHANNEL,
      limit: 200,
      cursor,
    })
    const page = (res.messages ?? []) as Array<{ text?: string; cursor_next?: string }>
    for (const m of page) {
      if (m.text) messages.push({ text: m.text })
    }
    cursor = res.response_metadata?.next_cursor || undefined
  } while (cursor)

  return messages
}

export async function getTools(): Promise<Tool[]> {
  const slack = getSlack()
  await ensureJoined(slack)
  const messages = await fetchAllMessages(slack)

  const toolsById = new Map<string, Tool>()
  const updates: Array<{ id: string; field: string; value: string }> = []

  // Messages come newest-first; iterate so older messages are processed first
  for (const m of [...messages].reverse()) {
    const text = m.text
    if (text.startsWith('TOOL_DATA:')) {
      try {
        const tool = JSON.parse(text.slice('TOOL_DATA:'.length).trim()) as Tool
        toolsById.set(tool.id, tool)
      } catch { /* skip malformed */ }
    } else if (text.startsWith('TOOL_UPDATE:')) {
      try {
        const upd = JSON.parse(text.slice('TOOL_UPDATE:'.length).trim()) as { id: string; field: string; value: string }
        updates.push(upd)
      } catch { /* skip */ }
    }
  }

  // Apply updates (in order, oldest first — already reversed)
  for (const upd of updates) {
    const tool = toolsById.get(upd.id)
    if (tool) toolsById.set(upd.id, { ...tool, [upd.field]: upd.value })
  }

  return [...toolsById.values()].sort(
    (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  )
}

export async function addTool(
  analysis: GeminiAnalysis,
  url: string,
  addedBy: string,
): Promise<{ duplicate: string | null }> {
  const slack = getSlack()
  await ensureJoined(slack)

  // Duplicate check
  const existing = await getTools()
  const dup = existing.find((t) => t.url === url)
  if (dup) return { duplicate: dup.name }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const tool: Tool = {
    id,
    url,
    added_by: addedBy,
    added_at: new Date().toISOString(),
    ...analysis,
  }

  await slack.chat.postMessage({
    channel: DB_CHANNEL,
    text: `TOOL_DATA:${JSON.stringify(tool)}`,
  })

  return { duplicate: null }
}

export async function updateToolField(
  id: string,
  field: string,
  value: string,
): Promise<Tool | null> {
  const slack = getSlack()
  await ensureJoined(slack)

  const tools = await getTools()
  const tool = tools.find((t) => t.id === id)
  if (!tool) return null

  await slack.chat.postMessage({
    channel: DB_CHANNEL,
    text: `TOOL_UPDATE:${JSON.stringify({ id, field, value })}`,
  })

  return { ...tool, [field]: value }
}
