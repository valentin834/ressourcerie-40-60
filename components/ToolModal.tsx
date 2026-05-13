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

interface EditableTextProps {
  field: EditableField
  value: string
  isEditing: boolean
  draft: string
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onStartEdit: (field: EditableField, value: string) => void
  onDraftChange: (v: string) => void
  onSave: (field: EditableField, value: string) => void
  onCancelEdit: () => void
}

function EditableText({ field, value, isEditing, draft, inputRef, onStartEdit, onDraftChange, onSave, onCancelEdit }: EditableTextProps) {
  if (isEditing) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        className="editable-textarea"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={() => onSave(field, draft)}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit() }}
      />
    )
  }
  return (
    <span className="editable" onClick={() => onStartEdit(field, value)}>
      {value || <em style={{ color: 'var(--text-dim)' }}>Cliquer pour éditer…</em>}
    </span>
  )
}

interface EditableSelectProps {
  field: EditableField
  value: string
  options: string[]
  isEditing: boolean
  draft: string
  inputRef: React.RefObject<HTMLSelectElement | null>
  onStartEdit: (field: EditableField, value: string) => void
  onDraftChange: (v: string) => void
  onSave: (field: EditableField, value: string) => void
  className?: string
}

function EditableSelect({ field, value, options, isEditing, draft, inputRef, onStartEdit, onDraftChange, onSave, className }: EditableSelectProps) {
  if (isEditing) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        className="editable-select"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onBlur={() => onSave(field, draft)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <span className={`editable ${className ?? 'badge'}`} onClick={() => onStartEdit(field, value)}>
      {value}
    </span>
  )
}

function getInterestClass(interest: string) {
  if (interest === 'Élevé' || interest === 'Très élevé') return 'interest-badge interest-high'
  if (interest === 'Moyen') return 'interest-badge interest-medium'
  return 'interest-badge interest-low'
}

export default function ToolModal({ tool, categories, onClose, onUpdated }: Props) {
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)

  useEffect(() => {
    if (editingField) {
      textareaRef.current?.focus()
      selectRef.current?.focus()
    }
  }, [editingField])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingField) setEditingField(null)
        else onClose()
      }
    }
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

  function startEdit(field: EditableField, value: string) {
    setDraft(value)
    setEditingField(field)
  }

  const allCategoryOptions = [...new Set([...categories, tool.category])]

  const textFields: Array<{ field: EditableField; label: string }> = [
    { field: 'what_is_it', label: 'Qu\'est-ce que c\'est ?' },
    { field: 'what_for', label: 'À quoi ça sert' },
    { field: 'studio_interest', label: 'Intérêt pour 40-60' },
  ]

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>
          <EditableText
            field="name"
            value={tool.name}
            isEditing={editingField === 'name'}
            draft={draft}
            inputRef={textareaRef}
            onStartEdit={startEdit}
            onDraftChange={setDraft}
            onSave={saveField}
            onCancelEdit={() => setEditingField(null)}
          />
        </h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <EditableSelect
            field="type"
            value={tool.type}
            options={TOOL_TYPES}
            isEditing={editingField === 'type'}
            draft={draft}
            inputRef={selectRef}
            onStartEdit={startEdit}
            onDraftChange={setDraft}
            onSave={saveField}
          />
          <EditableSelect
            field="category"
            value={tool.category}
            options={allCategoryOptions}
            isEditing={editingField === 'category'}
            draft={draft}
            inputRef={selectRef}
            onStartEdit={startEdit}
            onDraftChange={setDraft}
            onSave={saveField}
          />
          <span
            className={getInterestClass(tool.interest)}
            onClick={() => startEdit('interest', tool.interest)}
            style={{ cursor: 'pointer' }}
          >
            {editingField === 'interest' ? (
              <select
                ref={selectRef}
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

        {textFields.map(({ field, label }) => (
          <div key={field}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: 15 }}>
              {label}
            </h3>
            <p style={{ margin: '0 0 20px' }}>
              <EditableText
                field={field}
                value={String(tool[field] ?? '')}
                isEditing={editingField === field}
                draft={draft}
                inputRef={textareaRef}
                onStartEdit={startEdit}
                onDraftChange={setDraft}
                onSave={saveField}
                onCancelEdit={() => setEditingField(null)}
              />
            </p>
          </div>
        ))}

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
