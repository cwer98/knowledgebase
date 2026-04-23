'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import QuizModal from '@/components/QuizModal'
import { ChevronRight, Tag, Zap, Play, Save, BookOpen, Hash, AlignLeft, Sparkles } from 'lucide-react'

interface Section { title: string; content: string }
interface KeyNumber { value: string; label: string }

interface Fiche {
  id: number
  title: string
  concepts: string
  summary: string
  keyNumbers: string
  sections: string
  content: string
  deepening: string
  tags: string
  subject: { id: number; name: string; theme: { id: number; name: string; color: string } }
  questions: Array<{ id: number; difficulty: string }>
}

export default function FichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [fiche, setFiche] = useState<Fiche | null>(null)
  const [editing, setEditing] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', concepts: '', summary: '',
    keyNumbers: [] as KeyNumber[],
    sections: [] as Section[],
    content: '', deepening: '', tags: '',
  })

  async function load() {
    const res = await fetch(`/api/fiches/${id}`)
    const data: Fiche = await res.json()
    setFiche(data)
    setForm({
      title: data.title,
      concepts: JSON.parse(data.concepts || '[]').join(', '),
      summary: data.summary || '',
      keyNumbers: JSON.parse(data.keyNumbers || '[]'),
      sections: JSON.parse(data.sections || '[]'),
      content: data.content || '',
      deepening: data.deepening || '',
      tags: JSON.parse(data.tags || '[]').join(', '),
    })
  }

  useEffect(() => { load() }, [id])

  async function save() {
    setSaving(true)
    await fetch(`/api/fiches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        concepts: form.concepts.split(',').map(s => s.trim()).filter(Boolean),
        summary: form.summary,
        keyNumbers: form.keyNumbers,
        sections: form.sections,
        content: form.content,
        deepening: form.deepening,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    await load()
    setEditing(false)
    setSaving(false)
  }

  if (!fiche) return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="animate-pulse h-8 w-64 rounded-lg" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )

  const concepts = JSON.parse(fiche.concepts || '[]') as string[]
  const tags = JSON.parse(fiche.tags || '[]') as string[]
  const keyNumbers = JSON.parse(fiche.keyNumbers || '[]') as KeyNumber[]
  const sections = JSON.parse(fiche.sections || '[]') as Section[]
  const color = fiche.subject.theme.color
  const hasContent = fiche.summary || keyNumbers.length > 0 || sections.length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <Link href="/">Thèmes</Link>
          <ChevronRight size={14} />
          <Link href={`/themes/${fiche.subject.theme.id}`} style={{ color }}>{fiche.subject.theme.name}</Link>
          <ChevronRight size={14} />
          <Link href={`/subjects/${fiche.subject.id}`}>{fiche.subject.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>{fiche.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          {editing ? (
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-2xl font-bold flex-1"
              style={{ background: 'transparent', border: 'none', padding: 0, borderBottom: '2px solid var(--accent)', borderRadius: 0 }} />
          ) : (
            <h1 className="text-2xl font-bold leading-tight">{fiche.title}</h1>
          )}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowQuiz(true)} className="btn-ghost" style={{ padding: '8px 14px' }}>
              <Play size={15} /> Quiz
            </button>
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); load() }} className="btn-ghost">Annuler</button>
                <button onClick={save} disabled={saving} className="btn-primary">
                  <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-primary">Modifier</button>
            )}
          </div>
        </div>

        {/* Concepts */}
        {(concepts.length > 0 || editing) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {editing ? (
              <div className="w-full">
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Concepts clés (séparés par des virgules)</label>
                <input value={form.concepts} onChange={e => setForm(f => ({ ...f, concepts: e.target.value }))} placeholder="Concept 1, Concept 2..." />
              </div>
            ) : (
              concepts.map(c => <span key={c} className="tag"><Zap size={10} style={{ color }} />{c}</span>)
            )}
          </div>
        )}

        {!hasContent && !editing && (
          <div className="card p-8 text-center mb-6">
            <AlignLeft size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cette fiche est vide. Cliquez sur <strong>Modifier</strong> pour ajouter du contenu.</p>
          </div>
        )}

        {/* Résumé */}
        {(fiche.summary || editing) && (
          <div className="card p-5 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <BookOpen size={14} style={{ color }} /> Résumé
            </h2>
            {editing ? (
              <textarea rows={6} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Résumé de 6-7 lignes..." />
            ) : (
              <p className="text-sm leading-7 whitespace-pre-wrap">{fiche.summary}</p>
            )}
          </div>
        )}

        {/* Chiffres clés */}
        {(keyNumbers.length > 0 || editing) && (
          <div className="card p-5 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Hash size={14} style={{ color }} /> Chiffres clés
            </h2>
            {editing ? (
              <div className="flex flex-col gap-3">
                {form.keyNumbers.map((kn, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={kn.value} onChange={e => {
                      const updated = [...form.keyNumbers]
                      updated[i] = { ...updated[i], value: e.target.value }
                      setForm(f => ({ ...f, keyNumbers: updated }))
                    }} placeholder="42%" style={{ width: 90, flexShrink: 0 }} />
                    <input value={kn.label} onChange={e => {
                      const updated = [...form.keyNumbers]
                      updated[i] = { ...updated[i], label: e.target.value }
                      setForm(f => ({ ...f, keyNumbers: updated }))
                    }} placeholder="Description..." />
                    <button onClick={() => setForm(f => ({ ...f, keyNumbers: f.keyNumbers.filter((_, j) => j !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, keyNumbers: [...f.keyNumbers, { value: '', label: '' }] }))}
                  className="btn-ghost" style={{ width: 'fit-content', fontSize: 13 }}>+ Ajouter un chiffre</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {keyNumbers.map((kn, i) => (
                  <div key={i} className="rounded-xl p-4 text-center" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <div className="text-2xl font-bold mb-1" style={{ color }}>{kn.value}</div>
                    <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{kn.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {(sections.length > 0 || editing) && (
          <div className="flex flex-col gap-5 mb-5">
            {editing ? (
              <>
                {form.sections.map((s, i) => (
                  <div key={i} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <input value={s.title} onChange={e => {
                        const updated = [...form.sections]
                        updated[i] = { ...updated[i], title: e.target.value }
                        setForm(f => ({ ...f, sections: updated }))
                      }} placeholder="Titre de la section..." style={{ fontWeight: 600 }} />
                      <button onClick={() => setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}>✕</button>
                    </div>
                    <textarea rows={8} value={s.content} onChange={e => {
                      const updated = [...form.sections]
                      updated[i] = { ...updated[i], content: e.target.value }
                      setForm(f => ({ ...f, sections: updated }))
                    }} placeholder="Contenu de la section..." />
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, sections: [...f.sections, { title: 'Nouvelle section', content: '' }] }))}
                  className="btn-ghost" style={{ width: 'fit-content' }}>+ Ajouter une section</button>
              </>
            ) : (
              sections.map((s, i) => (
                <div key={i} className="card p-5">
                  <h2 className="font-semibold text-base mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)', color }}>
                    {s.title}
                  </h2>
                  <div className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{s.content}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ancien contenu (compatibilité) */}
        {fiche.content && !sections.length && (
          <div className="card p-5 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Contenu</h2>
            {editing ? (
              <textarea rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            ) : (
              <div className="text-sm leading-7 whitespace-pre-wrap">{fiche.content}</div>
            )}
          </div>
        )}

        {/* Approfondissement — contenu ajouté via quiz */}
        {(fiche.deepening || editing) && (
          <div className="card p-5 mb-5" style={{ borderColor: `${color}50`, background: `${color}06` }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color }}>
                <Sparkles size={13} /> Enrichi par le quiz
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>
                IA
              </span>
            </div>
            {editing ? (
              <textarea rows={5} value={form.deepening} onChange={e => setForm(f => ({ ...f, deepening: e.target.value }))}
                placeholder="Contenu enrichi automatiquement via les questions likées..." />
            ) : (
              <div className="text-sm leading-7 whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{fiche.deepening}</div>
            )}
          </div>
        )}

        {/* Tags */}
        {(tags.length > 0 || editing) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {editing ? (
              <div className="w-full">
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tags (séparés par des virgules)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2..." />
              </div>
            ) : (
              tags.map(t => <span key={t} className="tag"><Tag size={10} />{t}</span>)
            )}
          </div>
        )}

        {/* Questions générées */}
        {fiche.questions.length > 0 && (
          <div className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Questions générées ({fiche.questions.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {['basic', 'intermediate', 'expert'].map(d => {
                const count = fiche.questions.filter(q => q.difficulty === d).length
                if (!count) return null
                return (
                  <span key={d} className="tag" style={{ color: d === 'basic' ? '#4ade80' : d === 'intermediate' ? '#fb923c' : '#f87171' }}>
                    {d === 'basic' ? '🟢' : d === 'intermediate' ? '🟠' : '🔴'} {count} {d}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {showQuiz && <QuizModal ficheId={fiche.id} ficheTitle={fiche.title} existingQuestionCount={fiche.questions.length} onClose={() => { setShowQuiz(false); load() }} />}
    </div>
  )
}
