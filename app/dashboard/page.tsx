'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { LayoutDashboard, BookOpen, Brain, Target, Heart, TrendingUp, Star, Lock, Unlock, ChevronRight, Zap, AlertCircle, RefreshCw } from 'lucide-react'

interface SubjectStat {
  id: number
  name: string
  expertiseLevel: number
  isPublic: boolean
  ficheCount: number
  questionCount: number
}

interface DashboardData {
  themes: number
  subjects: SubjectStat[]
  fiches: number
  questions: number
  totalQuizDone: number
  correctAnswers: number
  likedQuestions: number
  accuracy: number
  apiUsageToday: number
}

const EXPERTISE_LABELS = ['', 'Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert']
const EXPERTISE_COLORS = ['', '#94a3b8', '#60a5fa', '#34d399', '#f97316', '#f87171']

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card p-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color || 'var(--accent)'}20` }}>
        <span style={{ color: color || 'var(--accent)' }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function ExpertiseBadge({ level }: { level: number }) {
  if (level === 0) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Non défini</span>
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-4 h-1.5 rounded-full" style={{ background: i <= level ? EXPERTISE_COLORS[level] : 'var(--border)' }} />
        ))}
      </div>
      <span className="text-xs font-medium" style={{ color: EXPERTISE_COLORS[level] }}>{EXPERTISE_LABELS[level]}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur serveur'); return }
      setData(json)
    } catch {
      setError('Impossible de charger le dashboard.')
    }
  }

  useEffect(() => { load() }, [])

  if (error) return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="card p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#f87171' }} />
          <p className="font-medium mb-1">Erreur dashboard</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button onClick={load} className="btn-primary"><RefreshCw size={15} /> Réessayer</button>
        </div>
      </div>
    </div>
  )

  if (!data) return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card p-5 animate-pulse h-28" style={{ background: 'var(--surface)' }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <LayoutDashboard size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vue d&apos;ensemble de votre apprentissage</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard icon={<BookOpen size={18} />} label="Thèmes" value={data.themes} color="#6366f1" />
          <StatCard icon={<BookOpen size={18} />} label="Fiches" value={data.fiches} sub={`${data.subjects.length} sujets`} color="#06b6d4" />
          <StatCard icon={<Brain size={18} />} label="Questions" value={data.questions} color="#a855f7" />
          <StatCard icon={<Target size={18} />} label="Réponses" value={data.totalQuizDone} sub={`${data.accuracy}% de réussite`} color="#22c55e" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<TrendingUp size={18} />} label="Taux de réussite" value={`${data.accuracy}%`} sub={`${data.correctAnswers}/${data.totalQuizDone} bonnes réponses`} color="#22c55e" />
          <StatCard icon={<Heart size={18} />} label="Fiches enrichies" value={data.likedQuestions} sub="via questions likées" color="#f87171" />
          <StatCard icon={<Zap size={18} />} label="API aujourd'hui" value={data.apiUsageToday} sub={`${Math.max(0, 1500 - data.apiUsageToday)} restantes`} color="#fbbf24" />
        </div>

        <div>
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Star size={16} style={{ color: '#fbbf24' }} />
            Sujets et niveaux d&apos;expertise
          </h2>
          {data.subjects.length === 0 ? (
            <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <p>Aucun sujet. <Link href="/" style={{ color: 'var(--accent)' }}>Créez votre premier thème</Link></p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.subjects.map(s => (
                <div key={s.id} className="card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-sm">{s.name}</span>
                      {s.isPublic ? <Unlock size={12} style={{ color: '#4ade80' }} /> : <Lock size={12} style={{ color: '#f87171' }} />}
                    </div>
                    <ExpertiseBadge level={s.expertiseLevel} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{s.ficheCount} fiche{s.ficheCount > 1 ? 's' : ''}</span>
                    {s.questionCount > 0 && <span>{s.questionCount} Q</span>}
                  </div>
                  <Link href={`/subjects/${s.id}`} className="btn-ghost flex-shrink-0" style={{ padding: '5px 10px', fontSize: 12 }}>
                    Voir <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
