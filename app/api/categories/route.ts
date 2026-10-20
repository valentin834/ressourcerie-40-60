import { NextResponse } from 'next/server'
import type { Category } from '@/lib/types'

const CATEGORIES: Category[] = [
  { id: 1, name: 'Création vidéo & image' },
  { id: 2, name: 'Design & branding' },
  { id: 3, name: 'Dev & code' },
  { id: 4, name: 'Productivité' },
  { id: 5, name: 'Automatisation' },
]

export async function GET() {
  return NextResponse.json(CATEGORIES)
}
