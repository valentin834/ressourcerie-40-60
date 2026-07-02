import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from('tools').select('id').limit(1)

  if (error) {
    console.error('[keepalive] Supabase ping failed:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  console.log('[keepalive] Supabase ping OK')
  return NextResponse.json({ ok: true })
}
