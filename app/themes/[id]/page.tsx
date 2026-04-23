'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Modal from '@/components/Modal'
import { Plus, FileText, ChevronRight, ChevronLeft, Pencil, Trash2, Layers, Lock, Unlock, Brain } from 'lucide-react'

interface Subject {
  id: number
  name: string
  description?: string
  isPublic: boolean
  expertiseLevel: number
  _count: { fiches: number }
}

interface Theme {
  id: number
  name: string
  description?: string
  color: string
  subjects: Subject[]
}

const EXPERTISE_COLORS = ['', '#94a3b8', '#60a5fa', '#34d399', '#f97316', '#f87171']

export default function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  async function load() {
    const res = await fetch(`/api/themes/${id}`)
    setTheme(await res.json())
  }

  useEffect(() => { load() }, [id])

  async function create() {
    if (!form.name.trim()) return
    await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, themeId: parseInt(id) }),
    })
    setShowCreate(false)
    setForm({ name: '', description: '' })
    load()
  }

  async function update() {
    if (!editSubject || !form.name.trim()) return
    await fetch(`/api/subjects/${editSubject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setEditSubject(null)
    load()
  }

  async function remove(subjectId: number) {
    if (!confirm('Supprimer ce sujet et toutes ses fiches ?')) return
    await fetch(`/api/subjects/${subjectId}`, { method: 'DELETE' })
    load()
  }

  if (!theme) return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse h-8 w-48 rounded-lg mb-4" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )

  const FormContent = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Nom du sujet</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Énergies renouvelables, Formule 1..." />
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Description (optionnel)</label>
        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Courte description..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => { setShowCreate(false); setEditSubject(null) }} className="btn-ghost flex-1">Annuler</button>
        <button onClick={editSubject ? update : create} className="btn-primary flex-1">
          {editSubject ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/" className="flex items-center gap-1 text-sm mb-6 w-fit" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={16} /> Thèmes
        </Link>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${theme.color}20` }}>
              <Layers size={24} style={{ color: theme.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{theme.name}</h1>
              {theme.description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{theme.description}</p>}
            </div>
          </div>
          <button onClick={() => { setShowCreate(true); setForm({ name: '', description: '' }) }} className="btn-primary">
            <Plus size={16} /> Nouveau sujet
          </button>
        </div>

        {theme.subjects.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="font-medium mb-1">Aucun sujet</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Ajoutez des sujets pour organiser vos fiches</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> Créer un sujet</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {theme.subjects.map(s => (
              <div key={s.id} className="card p-5 group relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    {s.isPublic
                      ? <Unlock size={13} style={{ color: '#4ade80', opacity: 0.7 }} />
                      : <Lock size={13} style={{ color: '#f87171', opacity: 0.7 }} />}
                    <span className="text-xs" style={{ color: s.isPublic ? '#4ade80' : '#f87171', opacity: 0.8 }}>
                      {s.isPublic ? 'Public' : 'Privé'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditSubject(s); setForm({ name: s.name, description: s.description || '' }) }} className="btn-ghost" style={{ padding: '5px', border: 'none' }}><Pencil size={14} /></button>
                    <button onClick={() => remove(s.id)} className="btn-ghost" style={{ padding: '5px', border: 'none', color: '#f87171' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <Link href={`/subjects/${s.id}`}>
                  <h2 className="font-semibold text-base mb-1">{s.name}</h2>
                  {s.description && <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
                  {/* Expertise gauge */}
                  {s.expertiseLevel > 0 && (
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= s.expertiseLevel ? EXPERTISE_COLORS[s.expertiseLevel] : 'var(--border)' }} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s._count.fiches} fiche{s._count.fiches !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={16} style={{ color: theme.color }} />
                  </div>
                </Link>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <Link
                    href={`/quiz?subjectId=${s.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: `${theme.color}12`, color: theme.color, border: `1px solid ${theme.color}25` }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Brain size={12} /> Quiz ce sujet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showCreate && <Modal title="Nouveau sujet" onClose={() => setShowCreate(false)}>{FormContent}</Modal>}
      {editSubject && <Modal title="Modifier le sujet" onClose={() => setEditSubject(null)}>{FormContent}</Modal>}
    </div>
  )
}
