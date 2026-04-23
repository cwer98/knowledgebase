'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Link from 'next/link'
import { Brain, ChevronRight, Check, X, Trophy, Shuffle, RefreshCw, Sparkles, Loader2 } from 'lucide-react'

interface Theme { id: number; name: string; color: string }
interface Subject { id: number; name: string }
interface Fiche { id: number; title: string; _count: { questions: number } }

interface Question {
  id: number
  ficheId: number
  text: string
  options: string[]
  answer: number
  explanation: string
  difficulty: string
  fiche?: { title: string; subject: { name: string; theme: { name: string; color: string } } }
}

const difficultyLabel: Record<string, { label: string; color: string }> = {
  basic:        { label: 'Basique',        color: '#4ade80' },
  intermediate: { label: 'Intermédiaire',  color: '#fb923c' },
  expert:       { label: 'Expert',         color: '#f87171' },
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
}

function GlobalQuizInner() {
  const searchParams = useSearchParams()

  // Selectors
  const [themes,   setThemes]   = useState<Theme[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [fiches,   setFiches]   = useState<Fiche[]>([])

  const [themeId,   setThemeId]   = useState<number | ''>(searchParams.get('themeId')   ? parseInt(searchParams.get('themeId')!)   : '')
  const [subjectId, setSubjectId] = useState<number | ''>(searchParams.get('subjectId') ? parseInt(searchParams.get('subjectId')!) : '')
  const [ficheId,   setFicheId]   = useState<number | ''>(searchParams.get('ficheId')   ? parseInt(searchParams.get('ficheId')!)   : '')

  // Config
  const [difficulty,   setDifficulty]   = useState('basic')
  const [count,        setCount]        = useState(10)
  const [generateNew,  setGenerateNew]  = useState(false)

  // Quiz state
  const [step,      setStep]      = useState<'config' | 'quiz' | 'done'>('config')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current,   setCurrent]   = useState(0)
  const [selected,  setSelected]  = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score,     setScore]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Load themes
  useEffect(() => {
    fetch('/api/themes').then(r => r.json()).then(setThemes).catch(() => {})
  }, [])

  // Load subjects when theme changes
  useEffect(() => {
    setSubjectId(''); setFicheId(''); setSubjects([]); setFiches([])
    if (!themeId) return
    fetch(`/api/themes/${themeId}`)
      .then(r => r.json())
      .then(data => setSubjects(data.subjects || []))
      .catch(() => {})
  }, [themeId])

  // Load fiches when subject changes
  useEffect(() => {
    setFicheId(''); setFiches([])
    if (!subjectId) return
    fetch(`/api/subjects/${subjectId}`)
      .then(r => r.json())
      .then(data => setFiches(data.fiches || []))
      .catch(() => {})
  }, [subjectId])

  const selectedFiche = fiches.find(f => f.id === ficheId)
  const existingCount = selectedFiche?._count.questions ?? 0

  async function startQuiz() {
    setLoading(true)
    setError(null)
    try {
      let res: Response

      if (ficheId && generateNew) {
        // Générer de nouvelles questions pour cette fiche précise
        res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ficheId, difficulty, count, useExisting: false }),
        })
      } else if (ficheId && !generateNew) {
        // Questions existantes pour cette fiche
        res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ficheId, difficulty, count, useExisting: true }),
        })
      } else {
        // Quiz global avec filtres thème / sujet
        res = await fetch('/api/quiz/global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            difficulty, count,
            themeId:   themeId   || undefined,
            subjectId: subjectId || undefined,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      const parsed = (Array.isArray(data) ? data : []).map((q: Question & { options: string }) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }))

      if (parsed.length === 0) {
        setError('Aucune question disponible pour cette sélection.')
        setLoading(false)
        return
      }

      setQuestions(parsed)
      setCurrent(0); setScore(0); setSelected(null); setConfirmed(false)
      setStep('quiz')
    } catch {
      setError('Impossible de joindre le serveur.')
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (selected === null) return
    const q = questions[current]
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, correct: selected === q.answer }),
    })
    if (selected === q.answer) setScore(s => s + 1)
    setConfirmed(true)
  }

  function next() {
    if (current + 1 >= questions.length) setStep('done')
    else { setCurrent(c => c + 1); setSelected(null); setConfirmed(false) }
  }

  const q    = questions[current]
  const diff = q ? difficultyLabel[q.difficulty] : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          <Link href="/">Thèmes</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>Quiz global</span>
        </div>

        {/* ── CONFIG ── */}
        {step === 'config' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Brain size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Quiz global</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choisissez votre périmètre et lancez</p>
              </div>
            </div>

            <div className="card p-5 flex flex-col gap-5">

              {/* Sélecteurs en cascade */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Thème</label>
                  <select value={themeId} onChange={e => setThemeId(e.target.value ? parseInt(e.target.value) : '')} style={selectStyle}>
                    <option value="">Tous les thèmes</option>
                    {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {subjects.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Sujet</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value ? parseInt(e.target.value) : '')} style={selectStyle}>
                      <option value="">Tous les sujets</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {fiches.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Fiche</label>
                    <select value={ficheId} onChange={e => setFicheId(e.target.value ? parseInt(e.target.value) : '')} style={selectStyle}>
                      <option value="">Toutes les fiches</option>
                      {fiches.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.title}{f._count.questions > 0 ? ` (${f._count.questions} Q)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Option générer vs existantes — seulement si fiche sélectionnée */}
              {ficheId && (
                <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Source des questions</p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="source" checked={!generateNew} onChange={() => setGenerateNew(false)}
                      style={{ accentColor: 'var(--accent)', marginTop: 2 }} />
                    <div>
                      <div className="text-sm font-medium">Utiliser les questions existantes</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {existingCount > 0 ? `${existingCount} question${existingCount > 1 ? 's' : ''} disponible${existingCount > 1 ? 's' : ''} — sans appel API` : 'Aucune question encore générée'}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="source" checked={generateNew} onChange={() => setGenerateNew(true)}
                      style={{ accentColor: 'var(--accent)', marginTop: 2 }} />
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <Sparkles size={13} style={{ color: 'var(--accent)' }} /> Générer de nouvelles questions
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Questions fraîches via Groq IA (consomme 1 requête)</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Difficulté */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>Difficulté</label>
                <div className="flex gap-2">
                  {(['basic', 'intermediate', 'expert'] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: difficulty === d ? `${difficultyLabel[d].color}20` : 'var(--surface2)',
                        border: `1px solid ${difficulty === d ? difficultyLabel[d].color : 'var(--border)'}`,
                        color: difficulty === d ? difficultyLabel[d].color : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}>
                      {d === 'basic' ? '🟢' : d === 'intermediate' ? '🟠' : '🔴'} {difficultyLabel[d].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Nombre de questions : <span style={{ color: 'var(--text)', fontWeight: 600 }}>{count}</span>
                </label>
                <input type="range" min={3} max={20} value={count}
                  onChange={e => setCount(parseInt(e.target.value))}
                  className="w-full" style={{ accentColor: 'var(--accent)' }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>3</span><span>20</span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                  ⚠ {error}
                  {!ficheId && <p className="mt-1 text-xs">Sélectionnez une fiche et activez "Générer de nouvelles questions", ou générez d&apos;abord des quiz depuis vos fiches.</p>}
                </div>
              )}

              {loading && generateNew && (
                <div className="rounded-lg p-3 text-sm text-center" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                  Groq génère vos questions…
                </div>
              )}

              <button onClick={startQuiz} className="btn-primary" disabled={loading}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> {generateNew ? 'Génération...' : 'Chargement...'}</>
                  : <><Shuffle size={15} /> Lancer le quiz</>}
              </button>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {step === 'quiz' && q && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: diff?.color }}>{diff?.label}</span>
                {q.fiche && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                    {q.fiche.subject.theme.name} › {q.fiche.subject.name}
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{current + 1} / {questions.length}</span>
            </div>
            <div className="w-full h-1 rounded-full mb-2" style={{ background: 'var(--border)' }}>
              <div className="h-1 rounded-full transition-all" style={{ background: diff?.color, width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            {q.fiche && <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Fiche : {q.fiche.title}</p>}

            <p className="font-medium text-base mb-5 leading-relaxed">{q.text}</p>

            <div className="flex flex-col gap-2 mb-5">
              {q.options.map((opt, i) => {
                let borderColor = 'var(--border)', bg = 'var(--surface)'
                if (confirmed) {
                  if (i === q.answer)                  { borderColor = '#4ade80'; bg = 'rgba(74,222,128,0.08)' }
                  else if (i === selected)              { borderColor = '#f87171'; bg = 'rgba(248,113,113,0.08)' }
                } else if (i === selected)              { borderColor = 'var(--accent)' }
                return (
                  <button key={i} onClick={() => !confirmed && setSelected(i)}
                    className="p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-all"
                    style={{ border: `1px solid ${borderColor}`, background: bg, cursor: confirmed ? 'default' : 'pointer' }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {confirmed && i === q.answer  && <Check size={15} className="ml-auto" style={{ color: '#4ade80' }} />}
                    {confirmed && i === selected && i !== q.answer && <X size={15} className="ml-auto" style={{ color: '#f87171' }} />}
                  </button>
                )
              })}
            </div>

            {confirmed && (
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>💡 {q.explanation}</p>
                <Link href={`/fiches/${q.ficheId}`} className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  Voir la fiche <ChevronRight size={12} />
                </Link>
              </div>
            )}

            <div className="flex gap-3">
              {!confirmed
                ? <button onClick={handleConfirm} disabled={selected === null} className="btn-primary w-full">Valider</button>
                : <button onClick={next} className="btn-primary w-full">
                    {current + 1 >= questions.length ? 'Voir les résultats' : 'Suivant'} <ChevronRight size={15} />
                  </button>}
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <div className="text-center py-10">
            <Trophy size={56} className="mx-auto mb-4" style={{ color: '#fbbf24' }} />
            <h2 className="font-bold text-2xl mb-2">Quiz terminé !</h2>
            <p className="text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{score}/{questions.length}</p>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{Math.round((score / questions.length) * 100)}% de bonnes réponses</p>
            <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
              {score === questions.length ? 'Parfait ! 🎉' : score >= questions.length * 0.7 ? 'Très bien joué !' : score >= questions.length / 2 ? 'Bon résultat !' : 'Continuez à apprendre !'}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep('config')} className="btn-ghost"><RefreshCw size={15} /> Nouveau quiz</button>
              <Link href="/" className="btn-primary">Retour aux thèmes</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function GlobalQuizPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--background)' }} className="min-h-screen"><Nav /></div>}>
      <GlobalQuizInner />
    </Suspense>
  )
}
