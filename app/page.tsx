'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import type { Tool, Category } from '@/lib/types'
import ToolFilters from '@/components/ToolFilters'
import ToolsTable from '@/components/ToolsTable'
import ToolModal from '@/components/ToolModal'

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createSupabaseClient(), [])

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const [toolsRes, catsRes] = await Promise.all([
        fetch('/api/tools'),
        fetch('/api/categories'),
      ])

      const toolsJson = await toolsRes.json()
      const catsJson = await catsRes.json()

      if (!toolsRes.ok) {
        setError(toolsJson.error ?? 'Erreur lors du chargement des outils.')
        return
      }
      if (!catsRes.ok) {
        setError(catsJson.error ?? 'Erreur lors du chargement des catégories.')
        return
      }

      setTools(toolsJson as Tool[])
      setCategories((catsJson as Category[]).map((c) => c.name))
    } catch (err) {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
      console.error('[page] loadData error:', err)
    }
  }, [])

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('tools-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tools' },
        (payload) => setTools((prev) => [payload.new as Tool, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tools' },
        (payload) => setTools((prev) => prev.map((t) => t.id === (payload.new as Tool).id ? payload.new as Tool : t))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData, supabase])

  function handleToolUpdated(updated: Tool) {
    setTools((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setActiveTool(updated)
  }

  return (
    <div className="container">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 600 }}>
          BDD Outils — 40-60 Studio
        </h1>
        <div style={{ color: 'var(--text-dim)', fontSize: 15 }}>
          Base de connaissances des outils, tips et ressources évalués pour le studio.
        </div>
      </header>

      {error && (
        <div style={{
          background: '#2d1515',
          border: '1px solid #7a2020',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#f87',
          fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Rechercher un outil, une catégorie, un mot-clé…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flexGrow: 1 }}
        />
      </div>

      <ToolFilters
        categories={categories}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        onCategoryChange={setSelectedCategory}
        onTypeChange={setSelectedType}
      />

      <ToolsTable
        tools={tools}
        query={query}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        onRowClick={setActiveTool}
      />

      <footer>
        {tools.length} outil{tools.length !== 1 ? 's' : ''} · Cliquer sur une ligne pour ouvrir la fiche
      </footer>

      <ToolModal
        tool={activeTool}
        categories={categories}
        onClose={() => setActiveTool(null)}
        onUpdated={handleToolUpdated}
      />
    </div>
  )
}
