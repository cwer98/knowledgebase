import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWithFallback } from '@/lib/gemini'
import { incrementApiUsage } from '@/lib/apiUsage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ficheId, difficulty = 'basic', count = 5, useExisting = false } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return Response.json(
        { error: 'Clé API Gemini non configurée. Ajoutez GEMINI_API_KEY dans le fichier .env.local (gratuit sur aistudio.google.com).' },
        { status: 503 }
      )
    }

    const fiche = await prisma.fiche.findUnique({ where: { id: ficheId } })
    if (!fiche) return Response.json({ error: 'Fiche introuvable' }, { status: 404 })

    // Return existing questions if requested
    if (useExisting) {
      const existing = await prisma.question.findMany({
        where: { ficheId, difficulty },
        orderBy: { createdAt: 'desc' },
        take: count,
      })
      if (existing.length > 0) return Response.json(existing, { status: 200 })
    }

    const difficultyMap: Record<string, string> = {
      basic: 'basique (définitions directes, faits simples)',
      intermediate: 'intermédiaire (compréhension, reformulations, mises en contexte)',
      expert: 'expert (va au-delà du contenu, introduit de nouvelles idées, fait progresser)',
    }

    const prompt = `Tu es un expert pédagogue. Génère ${count} questions QCM de niveau ${difficultyMap[difficulty]} basées sur cette fiche :

Titre: ${fiche.title}
Concepts clés: ${fiche.concepts}
Contenu: ${fiche.content}
${fiche.summary ? `Résumé: ${fiche.summary}` : ''}
${fiche.sections ? `Sections: ${fiche.sections}` : ''}
${fiche.deepening ? `Approfondissement: ${fiche.deepening}` : ''}

Pour chaque question, fournis un objet JSON avec:
- text: la question
- options: tableau de 4 options (chaînes de caractères)
- answer: index de la bonne réponse (0-3)
- explanation: explication pédagogique claire

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte supplémentaire.`

    const text = await generateWithFallback(prompt)
    await incrementApiUsage()

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return Response.json({ error: 'Format de réponse invalide' }, { status: 500 })

    const questionsData = JSON.parse(jsonMatch[0])

    const questions = await Promise.all(
      questionsData.map((q: { text: string; options: string[]; answer: number; explanation: string }) =>
        prisma.question.create({
          data: {
            ficheId,
            text: q.text,
            options: JSON.stringify(q.options),
            answer: q.answer,
            explanation: q.explanation,
            difficulty,
            type: 'generated',
          },
        })
      )
    )

    return Response.json(questions, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 500 })
  }
}
