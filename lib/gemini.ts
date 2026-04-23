import { GoogleGenerativeAI } from '@google/generative-ai'

// Seul modèle gratuit disponible sur cette clé (2.0-flash = quota 0, 1.5-flash = 404)
const MODELS = ['gemini-2.5-flash']

export async function generateWithFallback(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!
  const genAI = new GoogleGenerativeAI(apiKey)

  const MAX_ATTEMPTS = 6
  const BASE_DELAY_MS = 3000

  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        return result.response.text()
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        const is503 = msg.includes('503')
        const is429 = msg.includes('429')

        if (!is503 && !is429) throw err // erreur non-retryable → on propage

        if (attempt < MAX_ATTEMPTS - 1) {
          // Backoff exponentiel : 2s, 4s, 8s, 16s
          await new Promise(r => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)))
        }
        // Dernier essai échoué → on passe au modèle suivant
      }
    }
  }

  throw new Error('Gemini est surchargé. Attendez 10–20 secondes et réessayez.')
}
