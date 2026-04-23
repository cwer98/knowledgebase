import { getTodayApiUsage } from '@/lib/apiUsage'

export async function GET() {
  const count = await getTodayApiUsage()
  // Gemini free tier: ~1500 requests/day
  return Response.json({ count, limit: 1500, remaining: Math.max(0, 1500 - count) })
}
