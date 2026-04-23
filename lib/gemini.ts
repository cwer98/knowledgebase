import { GoogleGenerativeAI } from '@google/generative-ai'

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === 'your_groq_api_key_here') throw new Error('GROQ_API_KEY non configurée')

  // Essaie llama-3.3-70b d'abord, puis llama-3.1-8b si quota dépassé
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

  for (const model of models) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return data.choices[0].message.content
    }

    const status = res.status
    // 429 = rate limit sur ce modèle → essaie le suivant
    if (status !== 429) throw new Error(`Groq error ${status}`)
  }

  throw new Error('Groq rate limit atteint')
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') throw new Error('GEMINI_API_KEY non configurée')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('503') && !msg.includes('429')) throw err
      if (attempt < 3) await new Promise(r => setTimeout(r, 4000 * (attempt + 1)))
    }
  }
  throw new Error('Gemini surchargé')
}

export async function generateWithFallback(prompt: string): Promise<string> {
  // Groq en priorité (rapide, gratuit, fiable)
  try {
    return await generateWithGroq(prompt)
  } catch (groqErr) {
    const msg = groqErr instanceof Error ? groqErr.message : ''
    // Si Groq n'est pas configuré ou erreur non-quota, on log mais on essaie Gemini
    if (!msg.includes('GROQ_API_KEY')) {
      console.warn('Groq indisponible, fallback Gemini:', msg)
    }
  }

  // Fallback Gemini
  try {
    return await generateWithGemini(prompt)
  } catch {
    throw new Error('Tous les modèles IA sont temporairement indisponibles. Réessayez dans quelques secondes.')
  }
}
