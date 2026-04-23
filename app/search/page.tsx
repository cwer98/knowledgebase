'use client'
import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { Search, FileText, ChevronRight } from 'lucide-react'

interface Result {
  id: number
  title: string
  content: string
  subject: { id: number; name: string; theme: { id: number; name: string; color: string } }
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    const res = await fetch(`/api/fiches?search=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data)
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Recherche</h1>
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Rechercher dans les fiches..."
              style={{ paddingLeft: 38 }}
            />
          </div>
          <button onClick={search} disabled={loading} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {searched && results.length === 0 && (
          <div className="text-center py-12">
            <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun résultat pour &quot;{query}&quot;</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {results.map(r => (
            <Link key={r.id} href={`/fiches/${r.id}`} className="card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${r.subject.theme.color}15` }}>
                <FileText size={18} style={{ color: r.subject.theme.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-0.5">{r.title}</h3>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: r.subject.theme.color }}>{r.subject.theme.name}</span>
                  <ChevronRight size={12} />
                  <span>{r.subject.name}</span>
                </div>
                {r.content && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {r.content.slice(0, 150)}...
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
