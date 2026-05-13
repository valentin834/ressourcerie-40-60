'use client'

import { useState, useRef, useEffect } from 'react'
import type { Tool } from '@/lib/types'
import { TOOL_TYPES, INTEREST_LEVELS } from '@/lib/types'
import { createSupabaseClient } from '@/lib/supabase'

interface Props {
  tool: Tool | null
  categories: string[]
  onClose: () => void
  onUpdated: (tool: Tool) => void
}

type EditableField = keyof Pick<Tool, 'name' | 'type' | 'category' | 'interest' | 'implementation_time' | 'what_is_it' | 'what_for' | 'studio_interest'>

export default function ToolModal({ tool, categories, onClose, onUpdated }: Props) {
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null)

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (editingField) setEditingField(null); else onClose() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [editingField, onClose])

  if (!tool) return null

  async function saveField(field: EditableField, value: string) {
    if (!tool) return
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('tools')
      .update({ [field]: value })
      .eq('id', tool.id)
      .select()
      .single()
    if (!error && data) onUpdated(data as Tool)
    setEditingField(null)
  }

  function startEdit(field: EditableField) {
    setDraft(String(tool![field] ?? ''))
    setEditingField(field)
  }

  function getInterestClass(interest: string) {
    if (interest === 'Élevé' || interest === 'Très élevé') return 'interest-badge interest-high'
    if (interest === 'Moyen') return 'interest-badge interest-medium'
    return 'interest-badge interest-low'
  }

  function EditableText({ field }: { field: EditableField }) {
    const value = String(tool![field] ?? '')
    if (editingField === field) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className="editable-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => saveField(field, draft)}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null) }}
        />
      )
    }
    return (
      <span className="editable" onClick={() => startEdit(field)}>
        {value || <em style={{ color: 'var(--text-dim)' }}>Cliquer pour éditer…</em>}
      </span>
    )
  }

  function EditableSelect({ field, options }: { field: EditableField; options: string[] }) {
    const value = String(tool![field] ?? '')
    if (editingField === field) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          className="editable-select"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => saveField(field, draft)}
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return <span className="editable badge" onClick={() => startEdit(field)}>{value}</span>
  }

  const allCategoryOptions = [...new Set([...categories, tool.category])]

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>
          <EditableText field="name" />
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <EditableSelect field="type" options={TOOL_TYPES} />
          <EditableSelect field="category" options={allCategoryOptions} />
          <span
            className={getInterestClass(tool.interest)}
            onClick={() => startEdit('interest')}
            style={{ cursor: 'pointer' }}
          >
            {editingField === 'interest' ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                className="editable-select"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => saveField('interest', draft)}
              >
                {INTEREST_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : tool.interest}
          </span>
        </div>

        <h3 style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: 15 }}>
          Qu&apos;est-ce que c&apos;est ?
        </h3>
        <p style={{ margin: '0 0 20px' }}><EditableText field="what_is_it" /></p>

        <h3 style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: 15 }}>
          À quoi ça sert
        </h3>
        <p style={{ margin: '0 0 20px' }}><EditableText field="what_for" /></p>

        <h3 style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: 15 }}>
          Intérêt pour 40-60
        </h3>
        <p style={{ margin: '0 0 20px' }}><EditableText field="studio_interest" /></p>

        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-dim)' }}>
          <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            {tool.url}
          </a>
          {tool.added_by && ` · Ajouté par ${tool.added_by}`}
        </div>
      </div>
    </div>
  )
}
