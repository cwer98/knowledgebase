'use client'
import { useState } from 'react'
import { Heart, ChevronRight, Check, X, Loader2, Trophy, RefreshCw } from 'lucide-react'

interface Question {
  id: number
  text: string
  options: string[]
  answer: number
  explanation: string
  difficulty: string
}

interface QuizModalProps {
  ficheId: number
  ficheTitle: string
  existingQuestionCount?: number
  onClose: () => void
}

const difficultyLabel: Record<string, { label: string; color: string }> = {
  basic: { label: 'Basique', color: '#4ade80' },
  intermediate: { label: 'Intermédiaire', color: '#fb923c' },
  expert: { label: 'Expert', color: '#f87171' },
}

export default function QuizModal({ ficheId, ficheTitle, existingQuestionCount = 0, onClose }: QuizModalProps) {
  const [step, setStep] = useState<'config' | 'quiz' | 'done'>('config')
  const [difficulty, setDifficulty] = useState('basic')
  const [count, setCount] = useState(5)
  const [useExisting, setUseExisting] = useState(existingQuestionCount > 0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [liking, setLiking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function startQuiz() {
    setLoading(true)
    setGenError(null)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficheId, difficulty, count, useExisting }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenError(data.error || 'Erreur lors de la génération du quiz.')
        setLoading(false)
        return
      }
      const parsed = data.map((q: Question & { options: string }) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }))
      setQuestions(parsed)
      setStep('quiz')
    } catch {
      setGenError('Impossible de joindre le serveur. Vérifiez votre connexion.')
    }
    setLoading(false)
  }

  async function handleLike() {
    if (liking || liked) return
    setLiking(true)
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: questions[current].id, liked: true, correct: selected === questions[current].answer }),
    })
    setLiked(true)
    setLiking(false)
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
    if (current + 1 >= questions.length) {
      setStep('done')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
      setLiked(false)
    }
  }

  const q = questions[current]
  const diff = q ? difficultyLabel[q.difficulty] : null

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        {step === 'config' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Quiz — {ficheTitle}</h2>
              <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Niveau de difficulté :</p>
            <div className="flex flex-col gap-2 mb-5">
              {(['basic', 'intermediate', 'expert'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="card p-3 text-left transition-all"
                  style={{ border: difficulty === d ? `1px solid ${difficultyLabel[d].color}` : undefined }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 16 }}>
                      {d === 'basic' ? '🟢' : d === 'intermediate' ? '🟠' : '🔴'}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{difficultyLabel[d].label}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {d === 'basic' && 'Questions directes, définitions, faits simples'}
                        {d === 'intermediate' && 'Compréhension, reformulations, mises en contexte'}
                        {d === 'expert' && 'Nouvelles idées, va au-delà du contenu de la fiche'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Nombre de questions */}
            <div className="mb-5">
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                Nombre de questions : <span style={{ color: 'var(--text)' }}>{count}</span>
              </label>
              <input
                type="range" min={3} max={15} value={count}
                onChange={e => setCount(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>3</span><span>15</span>
              </div>
            </div>

            {/* Réutiliser les questions existantes */}
            {existingQuestionCount > 0 && (
              <div className="mb-5 p-3 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useExisting}
                    onChange={e => setUseExisting(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                  />
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <RefreshCw size={14} style={{ color: 'var(--accent)' }} />
                      Réutiliser les questions existantes
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {existingQuestionCount} question{existingQuestionCount > 1 ? 's' : ''} déjà générée{existingQuestionCount > 1 ? 's' : ''} — sans consommer de requêtes API
                    </div>
                  </div>
                </label>
              </div>
            )}

            {genError && (
              <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                ⚠ {genError}
              </div>
            )}
            {loading && (
              <div className="rounded-lg p-3 text-sm text-center" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                Gemini peut mettre 10–30 s en période de charge…
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
              <button onClick={startQuiz} className="btn-primary flex-1" disabled={loading}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Génération...</> : genError ? 'Réessayer' : 'Démarrer le quiz'}
              </button>
            </div>
          </div>
        )}

        {step === 'quiz' && q && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: diff?.color }}>
                {diff?.label}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {current + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full h-1 rounded-full mb-5" style={{ background: 'var(--border)' }}>
              <div
                className="h-1 rounded-full transition-all"
                style={{ background: diff?.color, width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>

            <p className="font-medium text-base mb-5 leading-relaxed">{q.text}</p>

            <div className="flex flex-col gap-2 mb-5">
              {q.options.map((opt, i) => {
                let borderColor = 'var(--border)'
                let bg = 'var(--surface)'
                if (confirmed) {
                  if (i === q.answer) { borderColor = '#4ade80'; bg = 'rgba(74,222,128,0.08)' }
                  else if (i === selected) { borderColor = '#f87171'; bg = 'rgba(248,113,113,0.08)' }
                } else if (i === selected) {
                  borderColor = 'var(--accent)'
                }
                return (
                  <button
                    key={i}
                    onClick={() => !confirmed && setSelected(i)}
                    className="p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-all"
                    style={{ border: `1px solid ${borderColor}`, background: bg, cursor: confirmed ? 'default' : 'pointer' }}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {confirmed && i === q.answer && <Check size={15} className="ml-auto" style={{ color: '#4ade80' }} />}
                    {confirmed && i === selected && i !== q.answer && <X size={15} className="ml-auto" style={{ color: '#f87171' }} />}
                  </button>
                )
              })}
            </div>

            {confirmed && (
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  💡 {q.explanation}
                </p>
                {q.difficulty === 'expert' && (
                  <button
                    onClick={handleLike}
                    disabled={liking || liked}
                    className="mt-3 flex items-center gap-2 text-xs transition-all"
                    style={{ color: liked ? '#f87171' : 'var(--text-muted)', background: 'none', border: 'none', cursor: liked ? 'default' : 'pointer', padding: 0 }}
                  >
                    <Heart size={14} fill={liked ? '#f87171' : 'none'} />
                    {liked ? 'Ajouté à la fiche !' : 'Enrichir la fiche avec cette idée'}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {!confirmed ? (
                <button onClick={handleConfirm} disabled={selected === null} className="btn-primary w-full">
                  Valider
                </button>
              ) : (
                <button onClick={next} className="btn-primary w-full">
                  {current + 1 >= questions.length ? 'Voir les résultats' : 'Suivant'}
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center">
            <Trophy size={48} className="mx-auto mb-4" style={{ color: '#fbbf24' }} />
            <h2 className="font-bold text-xl mb-2">Quiz terminé !</h2>
            <p className="text-4xl font-bold mb-1" style={{ color: 'var(--accent)' }}>{score}/{questions.length}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {score === questions.length ? 'Parfait ! 🎉' : score >= questions.length / 2 ? 'Bien joué !' : 'Continuez à apprendre !'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setStep('config'); setCurrent(0); setScore(0); setSelected(null); setConfirmed(false); setLiked(false) }} className="btn-ghost flex-1">
                Recommencer
              </button>
              <button onClick={onClose} className="btn-primary flex-1">Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
