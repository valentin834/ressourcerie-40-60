import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

async function ping(): Promise<string | null> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from('tools').select('id').limit(1)
  return error ? error.message : null
}

export async function GET() {
  // First attempt
  let errMsg = await ping()
  if (!errMsg) {
    console.log('[keepalive] Supabase ping OK')
    return NextResponse.json({ ok: true })
  }

  // Supabase may be cold-starting — wait 20 s and retry once
  console.warn('[keepalive] First ping failed, retrying in 20s:', errMsg)
  await new Promise(r => setTimeout(r, 20_000))
  errMsg = await ping()

  if (errMsg) {
    console.error('[keepalive] Supabase still unreachable after retry:', errMsg)
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
  }

  console.log('[keepalive] Supabase ping OK (after retry)')
  return NextResponse.json({ ok: true, retried: true })
}
