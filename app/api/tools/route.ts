import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('added_at', { ascending: false })

  if (error) {
    console.error('[api/tools]', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
