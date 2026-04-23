import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWithFallback } from '@/lib/gemini'
import { incrementApiUsage } from '@/lib/apiUsage'
import { parseObject } from '@/lib/parseAI'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subjectId, prompt, pageCount = 2 } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return Response.json({ error: 'Clé API Gemini non configurée.' }, { status: 503 })
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { theme: true },
    })
    if (!subject) return Response.json({ error: 'Sujet introuvable' }, { status: 404 })

    const paragraphsPerSection = Math.max(2, Math.round(pageCount * 1.5))
    const sectionCount = Math.max(3, Math.min(6, Math.round(pageCount * 0.8 + 2)))

    const systemPrompt = `Tu es un expert pédagogue. Génère une fiche de connaissance structurée sur le sujet suivant dans le contexte "${subject.theme.name} > ${subject.name}".

Demande de l'utilisateur : "${prompt}"
Densité souhaitée : ${pageCount} page${pageCount > 1 ? 's' : ''} (${sectionCount} sections, ${paragraphsPerSection} paragraphes minimum par section)

Génère un objet JSON avec exactement cette structure :
{
  "title": "Titre précis de la fiche",
  "concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "Résumé en 6-7 lignes qui synthétise l'essentiel du sujet. Clair, dense, informatif.",
  "keyNumbers": [
    {"value": "42%", "label": "Description courte du chiffre"},
    {"value": "1 500", "label": "Description courte du chiffre"},
    {"value": "2014", "label": "Description courte du chiffre"},
    {"value": "800 ch", "label": "Description courte du chiffre"},
    {"value": "0,3 s", "label": "Description courte du chiffre"}
  ],
  "sections": [
    {
      "title": "Introduction / Contexte",
      "content": "Texte détaillé de ${paragraphsPerSection} paragraphes minimum. Développement complet avec exemples et explications approfondies."
    }
    // ... ${sectionCount} sections au total, la dernière étant "Perspectives / Enjeux"
  ]
}

Règles importantes :
- Chaque section doit avoir ${paragraphsPerSection} paragraphes bien développés minimum
- Le contenu total doit équivaloir à environ ${pageCount} page${pageCount > 1 ? 's' : ''} A4
- Les keyNumbers doivent être des données réelles et précises
- Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après`

    const text = await generateWithFallback(systemPrompt)
    await incrementApiUsage()

    const data = parseObject(text) as {
      title?: string; concepts?: unknown[]; tags?: unknown[];
      summary?: string; keyNumbers?: unknown[]; sections?: unknown[]
    }

    const fiche = await prisma.fiche.create({
      data: {
        subjectId,
        title: data.title || 'Sans titre',
        concepts: JSON.stringify(data.concepts || []),
        tags: JSON.stringify(data.tags || []),
        summary: data.summary || '',
        keyNumbers: JSON.stringify(data.keyNumbers || []),
        sections: JSON.stringify(data.sections || []),
        content: '',
        deepening: '',
      },
    })

    return Response.json(fiche, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 500 })
  }
}
