'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, Search, LayoutDashboard, Brain, Zap } from 'lucide-react'

export default function Nav() {
  const [apiUsage, setApiUsage] = useState<{ count: number; remaining: number } | null>(null)

  useEffect(() => {
    fetch('/api/api-usage')
      .then(r => r.json())
      .then(setApiUsage)
      .catch(() => {})
  }, [])

  const usagePercent = apiUsage ? Math.min(100, (apiUsage.count / 1500) * 100) : 0
  const usageColor = usagePercent > 80 ? '#f87171' : usagePercent > 50 ? '#fb923c' : '#4ade80'

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-base" style={{ color: 'var(--text)' }}>
          <BookOpen size={20} style={{ color: 'var(--accent)' }} />
          KnowledgeBase
        </Link>
        <div className="flex items-center gap-2">
          {apiUsage !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <Zap size={12} style={{ color: usageColor }} />
              <span style={{ color: 'var(--text-muted)' }}>API:</span>
              <span style={{ color: usageColor, fontWeight: 600 }}>{apiUsage.remaining}</span>
              <span style={{ color: 'var(--text-muted)' }}>restantes</span>
              <div className="w-16 h-1 rounded-full ml-1" style={{ background: 'var(--border)' }}>
                <div className="h-1 rounded-full transition-all" style={{ background: usageColor, width: `${usagePercent}%` }} />
              </div>
            </div>
          )}
          <Link href="/quiz" className="btn-ghost text-sm" style={{ padding: '6px 12px' }}>
            <Brain size={15} />
            Quiz global
          </Link>
          <Link href="/dashboard" className="btn-ghost text-sm" style={{ padding: '6px 12px' }}>
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link href="/search" className="btn-ghost text-sm" style={{ padding: '6px 12px' }}>
            <Search size={15} />
            Rechercher
          </Link>
        </div>
      </div>
    </nav>
  )
}
