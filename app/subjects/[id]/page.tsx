'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Modal from '@/components/Modal'
import { Plus, FileText, ChevronRight, Pencil, Trash2, Tag, Zap, Sparkles, Loader2, Lock, Unlock, Star, Brain } from 'lucide-react'
import QuizModal from '@/components/QuizModal'

interface Fiche {
  id: number
  title: string
  concepts: string
  tags: string
  updatedAt: string
  _count: { questions: number }
}

interface Subject {
  id: number
  name: string
  description?: string
  isPublic: boolean
  expertiseLevel: number
  theme: { id: number; name: string; color: string }
  fiches: Fiche[]
}

const EXPERTISE_LABELS = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert']

function ExpertiseGauge({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Niveau d&apos;expertise</span>
        <span style={{ color: level > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: 600 }}>
          {level > 0 ? EXPERTISE_LABELS[level - 1] : 'Non défini'}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onClick={() => onChange(level === i ? 0 : i)}
            className="flex-1 h-2 rounded-full transition-all"
            style={{
              background: i <= level ? '#fbbf24' : 'var(--border)',
              border: 'none',
              cursor: 'pointer',
            }}
            title={EXPERTISE_LABELS[i - 1]}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  )
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [form, setForm] = useState({ title: '', concepts: '', tags: '' })
  const [genPrompt, setGenPrompt] = useState('')
  const [pageCount, setPageCount] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [quizFiche, setQuizFiche] = useState<{ id: number; title: string; questionCount: number } | null>(null)

  async function load() {
    const res = await fetch(`/api/subjects/${id}`)
    setSubject(await res.json())
  }

  useEffect(() => { load() }, [id])

  async function togglePublic() {
    if (!subject) return
    await fetch(`/api/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !subject.isPublic }),
    })
    setSubject(s => s ? { ...s, isPublic: !s.isPublic } : s)
  }

  async function setExpertise(level: number) {
    if (!subject) return
    await fetch(`/api/subjects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expertiseLevel: level }),
    })
    setSubject(s => s ? { ...s, expertiseLevel: level } : s)
  }

  async function create() {
    if (!form.title.trim()) return
    await fetch('/api/fiches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        subjectId: parseInt(id),
        concepts: form.concepts.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        content: '',
      }),
    })
    setShowCreate(false)
    setForm({ title: '', concepts: '', tags: '' })
    load()
  }

  async function generate() {
    if (!genPrompt.trim()) return
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/fiches/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: parseInt(id), prompt: genPrompt, pageCount }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || 'Erreur de génération'); setGenerating(false); return }
      setShowGenerate(false)
      setGenPrompt('')
      router.push(`/fiches/${data.id}`)
    } catch {
      setGenError('Impossible de joindre le serveur.')
    }
    setGenerating(false)
  }

  async function remove(ficheId: number) {
    if (!confirm('Supprimer cette fiche ?')) return
    await fetch(`/api/fiches/${ficheId}`, { method: 'DELETE' })
    load()
  }

  if (!subject) return (
    <div style={{ background: 'var(--background)' }} className="min-h-screen">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse h-8 w-48 rounded-lg" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )

  const color = subject.theme.color
  const totalQuestions = subject.fiches.reduce((acc, f) => acc + f._count.questions, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          <Link href="/">Thèmes</Link>
          <ChevronRight size={14} />
          <Link href={`/themes/${subject.theme.id}`} style={{ color }}>{subject.theme.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>{subject.name}</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <button
                onClick={togglePublic}
                title={subject.isPublic ? 'Sujet public — cliquer pour rendre privé' : 'Sujet privé — cliquer pour rendre public'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: subject.isPublic ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                  color: subject.isPublic ? '#4ade80' : '#f87171',
                  border: `1px solid ${subject.isPublic ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                  cursor: 'pointer',
                }}
              >
                {subject.isPublic ? <Unlock size={11} /> : <Lock size={11} />}
                {subject.isPublic ? 'Public' : 'Privé'}
              </button>
            </div>
            {subject.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subject.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{subject.fiches.length} fiche{subject.fiches.length > 1 ? 's' : ''}</span>
              {totalQuestions > 0 && <span>{totalQuestions} question{totalQuestions > 1 ? 's' : ''}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowGenerate(true)} className="btn-ghost">
              <Sparkles size={16} style={{ color }} /> Générer avec l&apos;IA
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Nouvelle fiche
            </button>
          </div>
        </div>

        {/* Expertise gauge */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Star size={15} style={{ color: '#fbbf24' }} />
            <span>Mon niveau d&apos;expertise</span>
          </div>
          <ExpertiseGauge level={subject.expertiseLevel} onChange={setExpertise} />
        </div>

        {subject.fiches.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="font-medium mb-1">Aucune fiche</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Créez votre première fiche ou laissez l&apos;IA en générer une</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowGenerate(true)} className="btn-ghost"><Sparkles size={15} /> Générer avec l&apos;IA</button>
              <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> Créer manuellement</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {subject.fiches.map(f => {
              const concepts = JSON.parse(f.concepts || '[]') as string[]
              const tags = JSON.parse(f.tags || '[]') as string[]
              return (
                <div key={f.id} className="card p-5 group flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: `${color}15` }}>
                    <FileText size={18} style={{ color }} />
                  </div>
                  <Link href={`/fiches/${f.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1">{f.title}</h3>
                    {concepts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {concepts.slice(0, 4).map(c => (
                          <span key={c} className="tag"><Zap size={10} />{c}</span>
                        ))}
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => <span key={t} className="tag"><Tag size={10} />{t}</span>)}
                      </div>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f._count.questions > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${color}15`, color }}>
                        {f._count.questions} Q
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => setQuizFiche({ id: f.id, title: f.title, questionCount: f._count.questions })}
                        className="btn-ghost" style={{ padding: '5px', border: 'none' }}
                        title="Lancer un quiz"
                      ><Brain size={14} /></button>
                      <Link href={`/fiches/${f.id}`} className="btn-ghost" style={{ padding: '5px', border: 'none' }}><Pencil size={14} /></Link>
                      <button onClick={() => remove(f.id)} className="btn-ghost" style={{ padding: '5px', border: 'none', color: '#f87171' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal création manuelle */}
      {showCreate && (
        <Modal title="Nouvelle fiche" onClose={() => { setShowCreate(false); setForm({ title: '', concepts: '', tags: '' }) }}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Titre</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de la fiche..." />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Concepts clés (séparés par des virgules)</label>
              <input value={form.concepts} onChange={e => setForm(f => ({ ...f, concepts: e.target.value }))} placeholder="Concept 1, Concept 2, ..." />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tags (séparés par des virgules)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2, ..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowCreate(false); setForm({ title: '', concepts: '', tags: '' }) }} className="btn-ghost flex-1">Annuler</button>
              <button onClick={create} className="btn-primary flex-1">Créer</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal génération IA */}
      {showGenerate && (
        <Modal title="Générer une fiche avec l'IA" onClose={() => { setShowGenerate(false); setGenPrompt(''); setGenError(null) }}>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg p-3 text-sm" style={{ background: `${color}10`, border: `1px solid ${color}25`, color: 'var(--text-muted)' }}>
              ✨ Décrivez le sujet en quelques mots. L&apos;IA génère une fiche complète avec résumé, chiffres clés et sections détaillées.
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Votre prompt</label>
              <textarea
                rows={3}
                value={genPrompt}
                onChange={e => setGenPrompt(e.target.value)}
                placeholder={`Ex: "Le moteur hybride en Formule 1"\n"L'aérodynamique des monoplaces"`}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) generate() }}
              />
            </div>

            {/* Nombre de pages */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Densité du contenu : <span style={{ color: 'var(--text)', fontWeight: 600 }}>{pageCount} page{pageCount > 1 ? 's' : ''}</span>
              </label>
              <input
                type="range" min={1} max={10} value={pageCount}
                onChange={e => setPageCount(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: color }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Synthèse (1p)</span>
                <span>Approfondi (10p)</span>
              </div>
            </div>

            {genError && (
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                ⚠ {genError}
              </div>
            )}
            {generating && (
              <div className="rounded-lg p-3 text-sm text-center" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                Gemini peut mettre 10–30 s en période de charge…
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowGenerate(false); setGenPrompt(''); setGenError(null) }} className="btn-ghost flex-1" disabled={generating}>Annuler</button>
              <button onClick={generate} className="btn-primary flex-1" disabled={generating || !genPrompt.trim()}>
                {generating ? <><Loader2 size={15} className="animate-spin" /> Génération en cours...</> : genError ? <><Sparkles size={15} /> Réessayer</> : <><Sparkles size={15} /> Générer la fiche</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {quizFiche && (
        <QuizModal
          ficheId={quizFiche.id}
          ficheTitle={quizFiche.title}
          existingQuestionCount={quizFiche.questionCount}
          onClose={() => { setQuizFiche(null); load() }}
        />
      )}
    </div>
  )
}
