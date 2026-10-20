import type { Tool, GeminiAnalysis } from './types'

const OWNER = 'valentin834'
const REPO = 'ressourcerie-40-60'
const FILE_PATH = 'data/tools.json'
const BRANCH = 'main'
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`

function getHeaders() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var not set')
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function getFileInfo(): Promise<{ sha: string; tools: Tool[] }> {
  const res = await fetch(API_URL, { headers: getHeaders() })
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`)
  const json = await res.json() as { sha: string; content: string }
  const decoded = Buffer.from(json.content, 'base64').toString('utf8')
  return { sha: json.sha, tools: JSON.parse(decoded) as Tool[] }
}

async function writeFile(tools: Tool[], sha: string, message: string) {
  const content = Buffer.from(JSON.stringify(tools, null, 2) + '\n').toString('base64')
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  })
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`)
}

export async function addTool(analysis: GeminiAnalysis, url: string, addedBy: string): Promise<{ duplicate: string | null }> {
  const { sha, tools } = await getFileInfo()
  const existing = tools.find((t) => t.url === url)
  if (existing) return { duplicate: existing.name }
  const now = new Date().toISOString()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const tool: Tool = { id, url, added_by: addedBy, added_at: now, ...analysis }
  tools.unshift(tool)
  await writeFile(tools, sha, `feat: add tool ${analysis.name}`)
  return { duplicate: null }
}

export async function updateToolField(id: string, field: string, value: string): Promise<Tool | null> {
  const { sha, tools } = await getFileInfo()
  const idx = tools.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tools[idx] = { ...tools[idx], [field]: value }
  await writeFile(tools, sha, `fix: update ${field} on ${tools[idx].name}`)
  return tools[idx]
}
