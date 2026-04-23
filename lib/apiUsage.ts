import { prisma } from './prisma'

export async function incrementApiUsage(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]
    await prisma.apiUsage.upsert({
      where: { date: today },
      update: { count: { increment: 1 } },
      create: { date: today, count: 1 },
    })
  } catch {
    // non-bloquant : le tracking ne doit jamais faire échouer une génération
  }
}

export async function getTodayApiUsage(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const record = await prisma.apiUsage.findUnique({ where: { date: today } })
    return record?.count ?? 0
  } catch {
    return 0
  }
}
