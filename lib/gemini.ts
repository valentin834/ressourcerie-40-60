import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ScrapedContent } from './scraper'
import type { GeminiAnalysis } from './types'

const SYSTEM_CONTEXT = `Tu es un assistant qui analyse des outils et ressources pour 40-60 Studio, une agence spécialisée en UX/UI design et développement web/mobile. L'équipe travaille sur des projets clients (interfaces, applications mobiles, sites web), utilise des outils de design (Figma, etc.), de développement (React, Next.js, TypeScript) et s'intéresse aux intelligences artificielles génératives pour accélérer la production créative et technique.`

const JSON_SCHEMA = `{
  "name": "Nom de l'outil ou ressource",
  "type": "un parmi : Outil | Plugin | Skill | Tip | Ressource",
  "category": "une parmi : Création vidéo & image | Design & branding | Dev & code | Productivité | Automatisation",
  "keywords": ["mot-clé 1", "mot-clé 2"],
  "interest": "un parmi : Faible | Moyen | Élevé | Très élevé",
  "implementation_time": "estimation ex: '30 min – 2h' ou 'N/A (méthodo)'",
  "what_is_it": "2-3 phrases claires expliquant ce qu'est cet outil/ressource",
  "what_for": "2-3 phrases sur ce à quoi ça sert concrètement",
  "studio_interest": "2-3 phrases sur la valeur spécifique pour 40-60 Studio (UX/UI + dev)"
}`

export function buildGeminiPrompt(content: ScrapedContent): string {
  return `${SYSTEM_CONTEXT}

À partir du contenu de la page web ci-dessous, génère une fiche JSON avec exactement ces champs :

${JSON_SCHEMA}

Réponds UNIQUEMENT avec le JSON, sans markdown, sans explication.

Titre : ${content.title}
Description : ${content.description}
Contenu : ${content.body}`
}

export function parseGeminiResponse(raw: string): GeminiAnalysis {
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()
  return JSON.parse(cleaned) as GeminiAnalysis
}

export async function analyzeUrl(content: ScrapedContent): Promise<GeminiAnalysis> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const prompt = buildGeminiPrompt(content)
  const result = await model.generateContent(prompt)
  return parseGeminiResponse(result.response.text())
}
