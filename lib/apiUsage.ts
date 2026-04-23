import { prisma } from './prisma'

export async function incrementApiUsage(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const record = await prisma.apiUsage.upsert({
    where: { date: today },
    update: { count: { increment: 1 } },
    create: { date: today, count: 1 },
  })
  return record.count
}

export async function getTodayApiUsage(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const record = await prisma.apiUsage.findUnique({ where: { date: today } })
  return record?.count ?? 0
}
