import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWithFallback } from '@/lib/gemini'
import { incrementApiUsage } from '@/lib/apiUsage'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { questionId, liked, correct } = body

  const interaction = await prisma.userInteraction.create({
    data: { questionId, liked: liked ?? false, correct },
  })

  if (liked) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { fiche: true },
    })

    if (question && question.difficulty === 'expert') {
      const apiKey = process.env.GEMINI_API_KEY
      if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
          const fiche = question.fiche
          const sections = JSON.parse(fiche.sections || '[]') as Array<{ title: string; content: string }>
          const sectionsText = sections.map((s, i) => `Section ${i}: "${s.title}"`).join('\n')

          const prompt = `Tu enrichis une fiche de connaissance avec une idée issue d'une question de quiz expert.

Fiche : "${fiche.title}"
Sections existantes :
${sectionsText || '(aucune section)'}

Question expert aimée :
Question: ${question.text}
Réponse correcte: ${JSON.parse(question.options)[question.answer]}
Explication: ${question.explanation}

Génère un objet JSON avec :
{
  "sectionIndex": <index de la section la plus pertinente, ou -1 pour créer "Approfondissement">,
  "paragraph": "<un paragraphe de 3-5 phrases qui intègre naturellement cette idée dans le contexte de la section, avec du vocabulaire pédagogique, sans répéter mot pour mot la question ou l'explication>"
}

Réponds UNIQUEMENT avec le JSON valide.`

          const text = await generateWithFallback(prompt)
          await incrementApiUsage()

          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) throw new Error('Parse error')

          const { sectionIndex, paragraph } = JSON.parse(jsonMatch[0])

          if (sectionIndex >= 0 && sectionIndex < sections.length) {
            sections[sectionIndex].content = sections[sectionIndex].content + '\n\n' + paragraph
            await prisma.fiche.update({
              where: { id: fiche.id },
              data: { sections: JSON.stringify(sections) },
            })
          } else {
            const current = fiche.deepening || ''
            await prisma.fiche.update({
              where: { id: fiche.id },
              data: { deepening: current ? `${current}\n\n${paragraph}` : paragraph },
            })
          }
        } catch {
          // enrichissement silencieux si erreur API
        }
      }
    }
  }

  return Response.json(interaction, { status: 201 })
}
