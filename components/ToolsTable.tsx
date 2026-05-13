'use client'

import { useState, useMemo } from 'react'
import type { Tool } from '@/lib/types'

type SortKey = 'name' | 'type' | 'category' | 'interest' | 'added_at'
type SortDir = 'asc' | 'desc'

const INTEREST_ORDER: Record<string, number> = { 'Faible': 0, 'Moyen': 1, 'Élevé': 2, 'Très élevé': 3 }

interface Props {
  tools: Tool[]
  query: string
  selectedCategory: string
  selectedType: string
  onRowClick: (tool: Tool) => void
}

export default function ToolsTable({ tools, query, selectedCategory, selectedType, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('added_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="sort-icon">↕</span>
    return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return tools.filter((t) => {
      const matchQuery = !q || [t.name, t.category, ...(t.keywords ?? [])].some((v) => v.toLowerCase().includes(q))
      const matchCat = !selectedCategory || t.category === selectedCategory
      const matchType = !selectedType || t.type === selectedType
      return matchQuery && matchCat && matchType
    })
  }, [tools, query, selectedCategory, selectedType])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number = a[sortKey] ?? ''
      let bVal: string | number = b[sortKey] ?? ''
      if (sortKey === 'interest') {
        aVal = INTEREST_ORDER[a.interest] ?? -1
        bVal = INTEREST_ORDER[b.interest] ?? -1
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  function getInterestClass(interest: string) {
    if (interest === 'Élevé' || interest === 'Très élevé') return 'interest-badge interest-high'
    if (interest === 'Moyen') return 'interest-badge interest-medium'
    return 'interest-badge interest-low'
  }

  if (sorted.length === 0) {
    return <div className="empty">Aucun outil ne correspond.</div>
  }

  return (
    <table>
      <thead>
        <tr>
          {(['name', 'type', 'category'] as SortKey[]).map((key) => (
            <th
              key={key}
              onClick={() => toggleSort(key)}
              className={sortKey === key ? `sort-${sortDir}` : ''}
            >
              {key === 'name' ? 'Outil' : key === 'type' ? 'Type' : 'Catégorie'}
              {' '}<SortIcon col={key} />
            </th>
          ))}
          <th>Mots-clés</th>
          <th
            onClick={() => toggleSort('interest')}
            className={sortKey === 'interest' ? `sort-${sortDir}` : ''}
          >
            Intérêt 40-60 <SortIcon col="interest" />
          </th>
          <th>Implémentation</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((tool) => (
          <tr key={tool.id} onClick={() => onRowClick(tool)}>
            <td className="tool-name">{tool.name}</td>
            <td><span className="badge">{tool.type}</span></td>
            <td><span className="badge">{tool.category}</span></td>
            <td>
              <div className="tags">
                {(tool.keywords ?? []).map((kw) => (
                  <span key={kw} className="tag">{kw}</span>
                ))}
              </div>
            </td>
            <td><span className={getInterestClass(tool.interest)}>{tool.interest}</span></td>
            <td style={{ color: 'var(--text-dim)', fontSize: 13 }}>{tool.implementation_time ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
