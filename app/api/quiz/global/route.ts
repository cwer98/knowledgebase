import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { difficulty = 'basic', count = 10, themeId, subjectId } = body

    const questions = await prisma.question.findMany({
      where: {
        difficulty,
        fiche: subjectId
          ? { subjectId }
          : themeId
          ? { subject: { themeId } }
          : undefined,
      },
      include: { fiche: { include: { subject: { include: { theme: true } } } } },
      orderBy: { createdAt: 'desc' },
    })

    if (questions.length === 0) {
      return Response.json(
        { error: 'Aucune question disponible. Générez d\'abord des quiz sur vos fiches.' },
        { status: 404 }
      )
    }

    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count)
    return Response.json(shuffled)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 500 })
  }
}
