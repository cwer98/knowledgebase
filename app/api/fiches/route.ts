import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const subjectId = request.nextUrl.searchParams.get('subjectId')
  const search = request.nextUrl.searchParams.get('search')
  const where: Record<string, unknown> = {}
  if (subjectId) where.subjectId = parseInt(subjectId)
  if (search) where.title = { contains: search }
  const fiches = await prisma.fiche.findMany({
    where,
    include: { subject: { include: { theme: true } }, _count: { select: { questions: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(fiches)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const fiche = await prisma.fiche.create({
    data: {
      title: body.title,
      subjectId: body.subjectId,
      concepts: JSON.stringify(body.concepts || []),
      content: body.content || '',
      tags: JSON.stringify(body.tags || []),
    },
  })
  return Response.json(fiche, { status: 201 })
}
