import { prisma } from '@/lib/prisma'
import { getTodayApiUsage } from '@/lib/apiUsage'

export async function GET() {
  try {
    const [themeCount, subjects, ficheCount, questionCount, totalQuizDone, correctAnswers, likedQuestions, apiCount] = await Promise.all([
      prisma.theme.count(),
      prisma.subject.findMany({
        include: { fiches: { include: { _count: { select: { questions: true } } } } },
      }),
      prisma.fiche.count(),
      prisma.question.count(),
      prisma.userInteraction.count({ where: { correct: { not: null } } }),
      prisma.userInteraction.count({ where: { correct: true } }),
      prisma.userInteraction.count({ where: { liked: true } }),
      getTodayApiUsage(),
    ])

    return Response.json({
      themes: themeCount,
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        expertiseLevel: s.expertiseLevel,
        isPublic: s.isPublic,
        ficheCount: s.fiches.length,
        questionCount: s.fiches.reduce((acc, f) => acc + f._count.questions, 0),
      })),
      fiches: ficheCount,
      questions: questionCount,
      totalQuizDone,
      correctAnswers,
      likedQuestions,
      accuracy: totalQuizDone > 0 ? Math.round((correctAnswers / totalQuizDone) * 100) : 0,
      apiUsageToday: apiCount,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 500 })
  }
}
