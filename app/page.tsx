'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Modal from '@/components/Modal'
import { Plus, BookOpen, Layers, ChevronRight, Pencil, Trash2, Brain } from 'lucide-react'

interface Theme {
  id: number
  name: string
  description?: string
  color: string
  _count: { subjects: number }
}

const COLORS = ['#6366f1', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#a855f7', '#eab308']

export default function HomePage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editTheme, setEditTheme] = useState<Theme | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] })

  async function load() {
    const res = await fetch('/api/themes')
    setThemes(await res.json())
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim()) return
    await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowCreate(false)
    setForm({ name: '', description: '', color: COLORS[0] })
    load()
  }

  async function update() {
    if (!editTheme || !form.name.trim()) return
    await fetch(`/api/themes/${editTheme.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setEditTheme(null)
    load()
  }

  async function remove(id: number) {
    if (!confirm('Supprimer ce thème et tout son contenu ?')) return
    await fetch(`/api/themes/${id}`, { method: 'DELETE' })
    load()
  }

  function openEdit(t: Theme) {
    setEditTheme(t)
    setForm({ name: t.name, description: t.description || '', color: t.color })
  }

  const FormContent = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Nom du thème</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Énergie, Sport, Technologie..." />
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Description (optionnel)</label>
        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Courte description..." />
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Couleur</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-7 h-7 rounded-full transition-transform"
              style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, transform: form.color === c ? 'scale(1.2)' : 'scale(1)', border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => { setShowCreate(false); setEditTheme(null) }} className="btn-ghost flex-1">Annuler</button>
        <button onClick={editTheme ? update : create} className="btn-primary flex-1">
          {editTheme ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Mes thèmes</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{themes.length} thème{themes.length !== 1 ? 's' : ''} de connaissances</p>
          </div>
          <button onClick={() => { setShowCreate(true); setForm({ name: '', description: '', color: COLORS[0] }) }} className="btn-primary">
            <Plus size={16} /> Nouveau thème
          </button>
        </div>

        {themes.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-lg font-medium mb-2">Aucun thème pour l&apos;instant</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Créez votre premier thème pour commencer à organiser vos connaissances</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Créer un thème
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(t => (
              <div key={t.id} className="card p-5 group relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}20` }}>
                    <Layers size={20} style={{ color: t.color }} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(t)} className="btn-ghost" style={{ padding: '5px', border: 'none' }}><Pencil size={14} /></button>
                    <button onClick={() => remove(t.id)} className="btn-ghost" style={{ padding: '5px', border: 'none', color: '#f87171' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <Link href={`/themes/${t.id}`}>
                  <h2 className="font-semibold text-base mb-1">{t.name}</h2>
                  {t.description && <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{t.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t._count.subjects} sujet{t._count.subjects !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={16} style={{ color: t.color }} />
                  </div>
                </Link>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <Link
                    href={`/quiz?themeId=${t.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}25` }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Brain size={12} /> Quiz ce thème
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && <Modal title="Nouveau thème" onClose={() => setShowCreate(false)}>{FormContent}</Modal>}
      {editTheme && <Modal title="Modifier le thème" onClose={() => setEditTheme(null)}>{FormContent}</Modal>}
    </div>
  )
}
