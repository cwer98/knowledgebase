import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const themeId = request.nextUrl.searchParams.get('themeId')
  const subjects = await prisma.subject.findMany({
    where: themeId ? { themeId: parseInt(themeId) } : undefined,
    include: { _count: { select: { fiches: true } }, theme: true },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(subjects)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const subject = await prisma.subject.create({
    data: { name: body.name, description: body.description, themeId: body.themeId },
  })
  return Response.json(subject, { status: 201 })
}
