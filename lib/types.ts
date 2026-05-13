export type ToolType = 'Outil' | 'Plugin' | 'Skill' | 'Tip' | 'Ressource'
export type InterestLevel = 'Faible' | 'Moyen' | 'Élevé' | 'Très élevé'

export const TOOL_TYPES: ToolType[] = ['Outil', 'Plugin', 'Skill', 'Tip', 'Ressource']
export const INTEREST_LEVELS: InterestLevel[] = ['Faible', 'Moyen', 'Élevé', 'Très élevé']

export interface Tool {
  id: string
  name: string
  url: string
  type: ToolType
  category: string
  keywords: string[]
  interest: InterestLevel
  implementation_time: string | null
  what_is_it: string
  what_for: string
  studio_interest: string
  added_by: string | null
  added_at: string
}

export interface Category {
  id: number
  name: string
}

export interface GeminiAnalysis {
  name: string
  type: ToolType
  category: string
  keywords: string[]
  interest: InterestLevel
  implementation_time: string
  what_is_it: string
  what_for: string
  studio_interest: string
}
