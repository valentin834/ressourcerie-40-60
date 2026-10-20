import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { updateToolField } from '@/lib/github-storage'
import type { Tool } from '@/lib/types'

export async function GET() {
  try {
    const raw = readFileSync(join(process.cwd(), 'data/tools.json'), 'utf8')
    const tools = JSON.parse(raw) as Tool[]
    return NextResponse.json(tools)
  } catch (err) {
    console.error('[api/tools] read error:', (err as Error).message)
    return NextResponse.json([], { status: 200 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, field, value } = await req.json() as { id: string; field: string; value: string }
    if (!id || !field || value === undefined) {
      return NextResponse.json({ error: 'id, field and value required' }, { status: 400 })
    }
    const updated = await updateToolField(id, field, value)
    if (!updated) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[api/tools PATCH]', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
