// Escape unescaped control characters inside JSON string values
function sanitize(json: string): string {
  return json.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner: string) => {
    const fixed = inner
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    return `"${fixed}"`
  })
}

export function parseObject(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Format de réponse IA invalide')
  const json = match[0]
  try { return JSON.parse(json) }
  catch { return JSON.parse(sanitize(json)) }
}

export function parseArray(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Format de réponse IA invalide')
  const json = match[0]
  try { return JSON.parse(json) }
  catch { return JSON.parse(sanitize(json)) }
}
