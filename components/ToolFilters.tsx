'use client'

import { TOOL_TYPES } from '@/lib/types'

interface Props {
  categories: string[]
  selectedCategory: string
  selectedType: string
  onCategoryChange: (cat: string) => void
  onTypeChange: (type: string) => void
}

export default function ToolFilters({
  categories,
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
}: Props) {
  return (
    <>
      <div className="toolbar">
        <button
          className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onCategoryChange('')}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="toolbar" style={{ marginTop: 0 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>Type :</span>
        <button
          className={`filter-btn ${selectedType === '' ? 'active' : ''}`}
          onClick={() => onTypeChange('')}
        >
          Tous
        </button>
        {TOOL_TYPES.map((type) => (
          <button
            key={type}
            className={`filter-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => onTypeChange(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </>
  )
}
