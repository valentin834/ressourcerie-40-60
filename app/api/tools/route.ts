import { NextRequest, NextResponse } from 'next/server'
import { getTools, updateToolField } from '@/lib/slack-storage'

export async function GET() {
  try {
    const tools = await getTools()
    return NextResponse.json(tools)
  } catch (err) {
    console.error('[api/tools GET]', (err as Error).message)
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
